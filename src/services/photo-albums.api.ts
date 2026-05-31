import type {
  AddPhotosInput,
  CreateAlbumInput,
  PhotoAlbum,
  PhotoAlbumListResponse,
  SetCoverInput,
  UpdateAlbumInput,
} from "@/types/photo-album.types";
import { api } from "./api";

export const photoAlbumsApi = {
  list: (petId: string, params?: { cursor?: string; limit?: number }) =>
    api.get<PhotoAlbumListResponse>(
      `/pets/${encodeURIComponent(petId)}/albums`,
      { params },
    ),

  get: (petId: string, albumId: string) =>
    api.get<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}`,
    ),

  create: (petId: string, input: CreateAlbumInput) =>
    api.post<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums`,
      input,
    ),

  update: (petId: string, albumId: string, input: UpdateAlbumInput) =>
    api.patch<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}`,
      input,
    ),

  delete: (petId: string, albumId: string) =>
    api.delete(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}`,
    ),

  addPhotos: (petId: string, albumId: string, input: AddPhotosInput) =>
    api.post<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}/photos`,
      input,
    ),

  removePhoto: (petId: string, albumId: string, assetId: string) =>
    api.delete<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}/photos/${encodeURIComponent(assetId)}`,
    ),

  setCover: (petId: string, albumId: string, input: SetCoverInput) =>
    api.put<PhotoAlbum>(
      `/pets/${encodeURIComponent(petId)}/albums/${encodeURIComponent(albumId)}/cover`,
      input,
    ),

  photoCount: (petId: string) =>
    api.get<{ count: number }>(
      `/pets/${encodeURIComponent(petId)}/albums/photo-count`,
    ),
} as const;
