import * as FileSystem from "expo-file-system/legacy";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

/** JPEG quality for the re-encode. High enough to be visually lossless. */
const JPEG_QUALITY = 0.9;

export interface PreparedImage {
  /** Local URI of the metadata-free copy, ready for `uploadFileToR2`. */
  uri: string;
  /** Content-Type of the copy — may differ from the input (HEIC becomes JPEG). */
  mimeType: string;
  /** Byte size of the copy, for the `requestUploadUrl` payload. */
  sizeBytes: number;
}

/**
 * Re-encode a picked image so it carries no metadata, then report the
 * resulting URI, MIME type and size.
 *
 * **This is a privacy control, not an optimisation.** Photos from the gallery
 * carry EXIF, and EXIF routinely contains GPS coordinates of where the shot was
 * taken. Uploads go straight from the device to R2 over a presigned PUT, so the
 * backend never sees the original bytes and cannot strip anything: if we don't
 * do it here, precise location leaves the device and we would have to declare
 * it as collected in the store privacy forms. See `docs/PLAY-DATA-SAFETY.md`.
 *
 * Decoding to a bitmap and re-encoding drops every metadata block. Orientation
 * survives because both platforms normalise it while loading — Glide applies the
 * EXIF rotation on Android, and the iOS module runs a fix-orientation transform
 * on load — so the pixels come out upright without needing the tag.
 *
 * PNG input stays PNG to keep transparency and avoid a lossy pass; everything
 * else (JPEG, HEIC, WebP) is written as JPEG.
 *
 * Every image upload path must go through this. If you add another one, route
 * it here too, or the store declarations stop being true.
 */
export async function prepareImageForUpload(
  uri: string,
  mimeType: string,
): Promise<PreparedImage> {
  const isPng = mimeType.toLowerCase().includes("png");
  const format = isPng ? SaveFormat.PNG : SaveFormat.JPEG;

  const image = await ImageManipulator.manipulate(uri).renderAsync();
  const result = await image.saveAsync({
    format,
    // `compress` is ignored for PNG, which is lossless.
    compress: JPEG_QUALITY,
  });

  const info = await FileSystem.getInfoAsync(result.uri);

  return {
    uri: result.uri,
    mimeType: isPng ? "image/png" : "image/jpeg",
    // `size` is absent from FileInfo when the file doesn't exist, which
    // `saveAsync` resolving already rules out. Keep the payload non-zero
    // regardless, since the API rejects a zero-byte declaration.
    sizeBytes: info.exists && info.size > 0 ? info.size : 1,
  };
}
