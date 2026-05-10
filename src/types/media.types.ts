export type MediaContextType =
  | "USER_AVATAR"
  | "PET_PHOTO"
  | "PET_DOCUMENT"
  | "PET_EVENT_MEDIA";

export type MediaStatus = "PENDING" | "READY" | "DELETED";

export interface MediaAsset {
  id: string;
  ownerId: string;
  context: MediaContextType;
  status: MediaStatus;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  originalUrl: string | null;
  thumbSmUrl: string | null;
  thumbMdUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RequestUploadUrlPayload {
  context: MediaContextType;
  mimeType: string;
  sizeBytes: number;
}

export interface RequestUploadUrlResponse {
  assetId: string;
  uploadUrl: string;
}
