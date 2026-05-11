import { useCallback, useRef, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { mediaApi, uploadFileToR2 } from "@/services/media.api";
import type { MediaAsset, MediaContextType } from "@/types/media.types";

export type MediaUploadState =
  | "idle"
  | "picking"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

export interface UseMediaUploadReturn {
  state: MediaUploadState;
  progress: number;
  asset: MediaAsset | null;
  error: string | null;
  pickAndUpload: (
    context: MediaContextType,
    contextRef?: string,
  ) => Promise<MediaAsset | null>;
  reset: () => void;
}

/**
 * useMediaUpload — unified hook for the pick → upload → confirm flow.
 *
 * State machine:
 *   idle → picking → uploading (with 0–1 progress) → confirming → done
 *   any state → error on failure
 *
 * Returns the confirmed `MediaAsset` from both the resolved promise and
 * the `asset` state field so callers can use either pattern.
 */
export function useMediaUpload(): UseMediaUploadReturn {
  const [state, setState] = useState<MediaUploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Guard against stale callbacks if the component unmounts mid-upload
  const aborted = useRef(false);

  const reset = useCallback(() => {
    aborted.current = false;
    setState("idle");
    setProgress(0);
    setAsset(null);
    setError(null);
  }, []);

  const pickAndUpload = useCallback(
    async (
      context: MediaContextType,
      contextRef?: string,
    ): Promise<MediaAsset | null> => {
      aborted.current = false;
      setError(null);
      setProgress(0);
      setAsset(null);

      try {
        setState("picking");

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.82,
          allowsMultipleSelection: false,
        });

        if (result.canceled || aborted.current) {
          setState("idle");
          return null;
        }

        const picked = result.assets[0];
        if (!picked) {
          setState("idle");
          return null;
        }

        const mimeType = picked.mimeType ?? "image/jpeg";
        const sizeBytes = picked.fileSize ?? 1;

        setState("uploading");

        const { data: urlData } = await mediaApi.requestUploadUrl({
          context,
          contextRef,
          mimeType,
          sizeBytes,
        });

        if (aborted.current) {
          setState("idle");
          return null;
        }

        await uploadFileToR2(urlData.uploadUrl, picked.uri, mimeType, (p) => {
          if (!aborted.current) setProgress(p);
        });

        if (aborted.current) {
          setState("idle");
          return null;
        }

        setState("confirming");
        const { data: confirmedAsset } = await mediaApi.confirmUpload(
          urlData.assetId,
        );

        setAsset(confirmedAsset);
        setState("done");
        return confirmedAsset;
      } catch (err) {
        if (!aborted.current) {
          const message = err instanceof Error ? err.message : "Upload failed";
          setError(message);
          setState("error");
        }
        return null;
      }
    },
    [],
  );

  return { state, progress, asset, error, pickAndUpload, reset };
}
