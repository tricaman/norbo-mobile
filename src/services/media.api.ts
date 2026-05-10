import { api } from "./api";
import type {
  MediaAsset,
  RequestUploadUrlPayload,
  RequestUploadUrlResponse,
} from "@/types/media.types";

export const mediaApi = {
  /** POST /media/upload-url — get a presigned PUT URL for direct R2 upload. */
  requestUploadUrl: (payload: RequestUploadUrlPayload) =>
    api.post<RequestUploadUrlResponse>("/media/upload-url", payload),

  /** POST /media/:assetId/confirm — mark upload complete, trigger thumbnails. */
  confirmUpload: (assetId: string) =>
    api.post<MediaAsset>(`/media/${encodeURIComponent(assetId)}/confirm`),

  /** GET /media/:assetId — fetch asset metadata. */
  getAsset: (assetId: string) =>
    api.get<MediaAsset>(`/media/${encodeURIComponent(assetId)}`),

  /** DELETE /media/:assetId — soft-delete an asset. */
  deleteAsset: (assetId: string) =>
    api.delete(`/media/${encodeURIComponent(assetId)}`),
} as const;

/**
 * Upload a local file directly to R2 via a presigned PUT URL.
 *
 * Uses XMLHttpRequest so we can track upload progress. The file is first
 * fetched as a Blob from the local URI (expo-image-picker provides a
 * `file://` URI on both platforms).
 *
 * @param uploadUrl  Presigned PUT URL returned by the API.
 * @param uri        Local file URI from expo-image-picker.
 * @param mimeType   Content-Type to set on the PUT request.
 * @param onProgress Called with a value in [0, 1] as bytes are sent.
 */
export async function uploadFileToR2(
  uploadUrl: string,
  uri: string,
  mimeType: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (e: ProgressEvent) => {
      if (e.lengthComputable) {
        onProgress?.(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed: HTTP ${xhr.status.toString()}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("R2 upload network error"));
    };

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.send(blob);
  });
}
