import { queryClient } from "@/app/_layout";
import { useMutation } from "@/hooks/useMutation";
import { photoAlbumsApi } from "@/services/photo-albums.api";
import type {
  AddPhotosInput,
  CreateAlbumInput,
  PhotoAlbum,
  PhotoAlbumListResponse,
  SetCoverInput,
  UpdateAlbumInput,
} from "@/types/photo-album.types";
import {
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";

const KEYS = {
  list: (petId: string) => ["photo-albums", petId] as const,
  detail: (petId: string, albumId: string) =>
    ["photo-albums", petId, albumId] as const,
  count: (petId: string) => ["photo-albums", petId, "count"] as const,
};

export function useAlbumList(petId: string) {
  return useInfiniteQuery({
    queryKey: KEYS.list(petId),
    queryFn: ({ pageParam }) =>
      photoAlbumsApi
        .list(petId, { cursor: pageParam as string | undefined, limit: 20 })
        .then((r) => r.data),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: PhotoAlbumListResponse) =>
      last.nextCursor ?? undefined,
    enabled: !!petId,
  });
}

export function useAlbumDetail(petId: string, albumId: string) {
  return useQuery({
    queryKey: KEYS.detail(petId, albumId),
    queryFn: () => photoAlbumsApi.get(petId, albumId).then((r) => r.data),
    enabled: !!petId && !!albumId,
  });
}

export function usePhotoCount(petId: string) {
  return useQuery({
    queryKey: KEYS.count(petId),
    queryFn: () => photoAlbumsApi.photoCount(petId).then((r) => r.data.count),
    enabled: !!petId,
  });
}

function invalidateAlbumQueries(petId: string, albumId?: string) {
  void queryClient.invalidateQueries({ queryKey: KEYS.list(petId) });
  void queryClient.invalidateQueries({ queryKey: KEYS.count(petId) });
  if (albumId) {
    void queryClient.invalidateQueries({
      queryKey: KEYS.detail(petId, albumId),
    });
  }
}

export function useCreateAlbum(petId: string) {
  return useMutation({
    mutationFn: (input: CreateAlbumInput) =>
      photoAlbumsApi.create(petId, input).then((r) => r.data),
    showSuccessToast: false,
    onSuccess: () => invalidateAlbumQueries(petId),
  });
}

export function useUpdateAlbum(petId: string, albumId: string) {
  return useMutation({
    mutationFn: (input: UpdateAlbumInput) =>
      photoAlbumsApi.update(petId, albumId, input).then((r) => r.data),
    showSuccessToast: false,
    onSuccess: () => invalidateAlbumQueries(petId, albumId),
  });
}

export function useDeleteAlbum(petId: string) {
  return useMutation({
    mutationFn: (albumId: string) =>
      photoAlbumsApi.delete(petId, albumId),
    showSuccessToast: true,
    onSuccess: () => invalidateAlbumQueries(petId),
  });
}

export function useAddPhotos(petId: string, albumId: string) {
  return useMutation({
    mutationFn: (input: AddPhotosInput) =>
      photoAlbumsApi.addPhotos(petId, albumId, input).then((r) => r.data),
    showSuccessToast: false,
    onSuccess: () => invalidateAlbumQueries(petId, albumId),
  });
}

export function useRemovePhoto(petId: string, albumId: string) {
  return useMutation({
    mutationFn: (assetId: string) =>
      photoAlbumsApi.removePhoto(petId, albumId, assetId).then((r) => r.data),
    showSuccessToast: false,
    onSuccess: () => invalidateAlbumQueries(petId, albumId),
  });
}

export function useSetCover(petId: string, albumId: string) {
  return useMutation({
    mutationFn: (input: SetCoverInput) =>
      photoAlbumsApi.setCover(petId, albumId, input).then((r) => r.data),
    showSuccessToast: false,
    onSuccess: () => invalidateAlbumQueries(petId, albumId),
  });
}
