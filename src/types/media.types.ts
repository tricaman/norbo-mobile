export type MediaContextType =
  | "USER_AVATAR"
  | "PET_AVATAR"
  | "PET_PHOTO"
  | "PET_DOCUMENT"
  | "PET_EVENT_MEDIA"
  | "EVENT_ATTACHMENT"
  | "EXPENSE_RECEIPT"
  | "PET_PHOTO_ALBUM";

export type MediaStatus = "PENDING" | "READY" | "FAILED" | "DELETED";

export interface MediaAsset {
  id: string;
  ownerId: string;
  context: MediaContextType;
  contextRef: string | null;
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
  contextRef?: string;
  mimeType: string;
  sizeBytes: number;
}

export interface RequestUploadUrlResponse {
  assetId: string;
  uploadUrl: string;
}
