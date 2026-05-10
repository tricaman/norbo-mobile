import { NorboPressable } from "@/components/CustomPressable";
import { Dropdown } from "@/components/ui/Dropdown";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { QueryBoundary } from "@/components/ui/QueryBoundary";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SettingsCard, SettingsRow } from "@/components/ui/SettingsRow";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useMutation } from "@/hooks/useMutation";
import { petsApi } from "@/services/pets.api";
import { queryClient } from "@/app/_layout";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useTranslation } from "react-i18next";
import type { Pet } from "@/types/pet.types";

export default function PetDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuVisible, setMenuVisible] = useState(false);

  const query = useQuery({
    queryKey: ["pets", id],
    queryFn: () => petsApi.get(id).then((r) => r.data),
    enabled: !!id,
  });

  const { mutate: deletePet } = useMutation({
    mutationFn: () => petsApi.delete(id),
    showSuccessToast: true,
    successMessage: t("pets.deleteSuccess"),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["pets"] });
      router.back();
    },
  });

  function confirmDelete(petName: string) {
    Alert.alert(
      t("pets.deleteConfirmTitle"),
      t("pets.deleteConfirmMessage", { name: petName }),
      [
        { text: t("pets.deleteConfirmCancel"), style: "cancel" },
        {
          text: t("pets.deleteConfirmOk"),
          style: "destructive",
          onPress: () => deletePet(),
        },
      ],
    );
  }

  return (
    <Screen>
      <QueryBoundary query={query}>
        {(pet) => (
          <>
            <ScreenHeader
              title={pet.name}
              right={<PetMenuButton onPress={() => setMenuVisible(true)} />}
            />
            <PetDetailContent pet={pet} />
            <Dropdown
              visible={menuVisible}
              onClose={() => setMenuVisible(false)}
              items={[
                {
                  label: t("petForm.editTitle"),
                  icon: "pencil",
                  onPress: () => router.push(`/pets/${id}/edit`),
                },
                {
                  label: t("pets.deleteConfirmOk"),
                  icon: "trash.fill",
                  destructive: true,
                  onPress: () => confirmDelete(pet.name),
                },
              ]}
            />
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function PetMenuButton({ onPress }: { onPress: () => void }) {
  const { theme } = useUnistyles();
  return (
    <NorboPressable
      style={styles.menuBtn}
      scale="row"
      haptic="light"
      onPress={onPress}
    >
      <IconSymbol
        name="ellipsis.circle"
        size={22}
        tintColor={theme.colors.textPrimary}
      />
    </NorboPressable>
  );
}

function PetDetailContent({ pet }: { pet: Pet }) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();

  const SEX_LABELS: Record<string, string> = {
    MALE: t("petForm.sexMale"),
    FEMALE: t("petForm.sexFemale"),
    UNKNOWN: t("petForm.sexUnknown"),
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.hero}>
        <View
          style={[styles.heroIcon, { backgroundColor: theme.colors.surface }]}
        >
          <IconSymbol
            name="pawprint.fill"
            size={40}
            tintColor={theme.colors.primary}
          />
        </View>
        <Text style={styles.heroName}>{pet.name}</Text>
        <Text style={styles.heroCategory}>
          {t(`petForm.categories.${pet.category}`)}
        </Text>
      </View>

      <SettingsCard>
        {pet.speciesLabelFreetext ? (
          <SettingsRow
            iconName="pawprint"
            label={t("petForm.speciesLabel")}
            subtitle={pet.speciesLabelFreetext}
          />
        ) : null}
        <SettingsRow
          iconName="person.circle"
          label={t("petForm.sexLabel")}
          subtitle={SEX_LABELS[pet.sex] ?? pet.sex}
        />
        {pet.birthDate ? (
          <SettingsRow
            iconName="doc.text"
            label={t("petForm.birthDateLabel")}
            subtitle={pet.birthDate}
          />
        ) : null}
        {pet.sterilized !== null && pet.sterilized !== undefined ? (
          <SettingsRow
            iconName="checkmark"
            label={t("petForm.sterilizedLabel")}
            subtitle={pet.sterilized ? "✓" : "–"}
          />
        ) : null}
        {pet.notes ? (
          <SettingsRow
            iconName="text.quote"
            label={t("petForm.notesLabel")}
            subtitle={pet.notes}
          />
        ) : null}
      </SettingsCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: {
    padding: theme.spacing["3xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.md,
  },
  menuBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    color: theme.colors.textPrimary,
  },
  hero: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  heroName: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
  },
  heroCategory: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
  },
}));
