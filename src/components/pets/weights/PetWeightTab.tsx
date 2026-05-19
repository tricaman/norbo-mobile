import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface PetWeightTabProps {
  petId: string;
}

/**
 * Weight tab body for the pet detail screen.
 *
 * Intentionally does NOT show the latest weight nor the history list:
 * both are already surfaced by the timeline. The tab is the future
 * home of the weight chart + breed-based ideal-weight note. For now
 * it renders a placeholder plus a primary CTA that opens the dedicated
 * `WeightForm` push screen.
 */
export function PetWeightTab({ petId }: PetWeightTabProps): React.ReactElement {
  const { t } = useTranslation();
  const { theme } = useUnistyles();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingBottom: SCREEN_BOTTOM_PADDING + insets.bottom },
      ]}
    >
      <View style={styles.placeholder}>
        <IconSymbol
          name="chart.line.uptrend.xyaxis"
          size={32}
          tintColor={theme.colors.textTertiary}
        />
        <Text
          style={[styles.placeholderText, { color: theme.colors.textTertiary }]}
        >
          {t("petDetail.weight.empty")}
        </Text>
      </View>

      <NorboPressable
        style={[styles.cta, { backgroundColor: theme.colors.primary }]}
        haptic="medium"
        onPress={() => router.push(`/pets/${petId}/weights/new` as never)}
      >
        <IconSymbol
          name="plus"
          size={16}
          tintColor={theme.colors.textOnPrimary}
        />
        <Text style={[styles.ctaLabel, { color: theme.colors.textOnPrimary }]}>
          {t("petDetail.weight.addCta")}
        </Text>
      </NorboPressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing["3xl"],
    alignItems: "center",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing["3xl"],
  },
  placeholderText: {
    ...theme.typography.footnote,
    textAlign: "center",
  },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing["2xl"],
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    marginBottom: theme.spacing.lg,
  },
  ctaLabel: {
    ...theme.typography.subhead,
    fontWeight: "600",
  },
}));
