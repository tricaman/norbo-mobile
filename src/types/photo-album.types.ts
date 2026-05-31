export interface PhotoAlbum {
  id: string;
  petId: string;
  ownerId: string;
  title: string;
  description: string | null;
  coverAssetId: string | null;
  mediaAssetIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface PhotoAlbumListResponse {
  rows: PhotoAlbum[];
  nextCursor: string | null;
}

export interface CreateAlbumInput {
  title: string;
  description?: string | null;
  mediaAssetIds?: string[];
}

export interface UpdateAlbumInput {
  title?: string;
  description?: string | null;
}

export interface AddPhotosInput {
  mediaAssetIds: string[];
}

export interface SetCoverInput {
  mediaAssetId: string;
}
