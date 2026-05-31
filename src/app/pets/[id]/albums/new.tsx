import { queryClient } from "@/app/_layout";
import {
  AlbumForm,
  albumFormSchema,
  type AlbumFormValues,
} from "@/components/pets/photos/AlbumForm";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { useForm } from "@/hooks/useForm";
import { useMutation } from "@/hooks/useMutation";
import { photoAlbumsApi } from "@/services/photo-albums.api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";

export default function NewAlbumScreen(): React.JSX.Element {
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();

  const form = useForm<AlbumFormValues>({
    schema: albumFormSchema,
    defaultValues: {
      title: "",
      description: null,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (values: AlbumFormValues) =>
      photoAlbumsApi.create(petId, {
        title: values.title,
        description: values.description ?? null,
      }),
    showSuccessToast: false,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["photo-albums", petId] });
      router.replace(`/pets/${petId}/albums/${res.data.id}` as never);
    },
  });

  return (
    <Screen>
      <ScreenHeader title={t("photoAlbums.createTitle")} />
      <AlbumForm
        form={form}
        isSubmitting={isPending}
        submitLabel={t("photoAlbums.create")}
        onSubmit={(values) => {
          mutate(values);
        }}
      />
    </Screen>
  );
}
