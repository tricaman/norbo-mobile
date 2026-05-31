import { queryClient } from "@/app/_layout";
import {
  AlbumForm,
  albumFormSchema,
  type AlbumFormValues,
} from "@/components/pets/photos/AlbumForm";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useAlbumDetail, useUpdateAlbum } from "@/hooks/usePhotoAlbums";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";

export default function EditAlbumScreen(): React.JSX.Element {
  const { id: petId, albumId } = useLocalSearchParams<{
    id: string;
    albumId: string;
  }>();
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();

  const albumQuery = useAlbumDetail(petId, albumId);
  const album = albumQuery.data;

  const form = useForm<AlbumFormValues>({
    schema: albumFormSchema,
    defaultValues: {
      title: album?.title ?? "",
      description: album?.description ?? null,
    },
  });

  // Reset form when album data loads
  React.useEffect(() => {
    if (album) {
      form.reset({
        title: album.title,
        description: album.description ?? null,
      });
    }
  }, [album?.id]);

  const updateMutation = useUpdateAlbum(petId, albumId);

  if (albumQuery.isPending) {
    return (
      <Screen>
        <ScreenHeader title={t("photoAlbums.editTitle")} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title={t("photoAlbums.editTitle")} />
      <AlbumForm
        form={form}
        isSubmitting={updateMutation.isPending}
        submitLabel={t("photoAlbums.save")}
        onSubmit={(values) => {
          updateMutation.mutate(
            {
              title: values.title,
              description: values.description ?? null,
            },
            {
              onSuccess: () => {
                void queryClient.invalidateQueries({
                  queryKey: ["photo-albums", petId, albumId],
                });
                void queryClient.invalidateQueries({
                  queryKey: ["photo-albums", petId],
                });
                router.back();
              },
            },
          );
        }}
      />
    </Screen>
  );
}
