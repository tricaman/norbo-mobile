import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import type { PetCategory } from "@/types/pet.types";
import { CATEGORY_META } from "../category-meta";
import { PetCategoryIcon } from "../PetCategoryIcon";
import { PetWizardButton } from "../PetWizardButton";

interface ConfirmStepProps {
  category: PetCategory;
  petName: string;
  onGoToProfile: () => void;
  onAddAnother: () => void;
}

/**
 * ConfirmStep — celebratory success screen shown after the API call
 * completes. Big circular avatar (category-tinted), checkmark badge,
 * primary CTA to the pet detail screen, ghost link to start over.
 */
export function ConfirmStep({
  category,
  petName,
  onGoToProfile,
  onAddAnother,
}: ConfirmStepProps) {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const meta = CATEGORY_META[category];

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.center}>
          <Animated.View
            entering={FadeIn.duration(400)}
            style={[styles.avatarOuter, { backgroundColor: meta.tint }]}
          >
            <PetCategoryIcon
              category={category}
              size={88}
              color={theme.colors.textOnPrimary}
            />
            <Animated.View
              entering={FadeInDown.duration(400).delay(150)}
              style={[
                styles.checkBadge,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <IconSymbol
                name="checkmark"
                size={20}
                tintColor={theme.colors.textOnPrimary}
              />
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.duration(400).delay(250)}
            style={styles.textBlock}
          >
            <Text style={styles.title}>
              {t("petWizard.confirmTitleTemplate", { name: petName })}
            </Text>
            <Text style={styles.subtitle}>
              {t("petWizard.confirmSubtitle")}
            </Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(400).delay(400)}
          style={styles.actions}
        >
          <PetWizardButton
            label={t("petWizard.confirmGoToProfile", { name: petName })}
            onPress={onGoToProfile}
          />
          <PetWizardButton
            label={t("petWizard.confirmAddAnother")}
            onPress={onAddAnother}
            variant="ghost"
          />
        </Animated.View>
      </View>
    </Screen>
  );
}

const AVATAR_SIZE = 168;
const BADGE_SIZE = 44;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing["2xl"],
    paddingBottom: theme.spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing["2xl"],
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: theme.colors.background,
  },
  textBlock: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  actions: {
    gap: theme.spacing.xs,
  },
}));
