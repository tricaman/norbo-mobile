import { Screen } from "@/components/ui/Screen";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Animated, { FadeIn } from "react-native-reanimated";
import { PetWizardHeader } from "./PetWizardHeader";

interface PetWizardLayoutProps {
  step: number;
  leading?: "close" | "back" | "none";
  onLeadingPress?: () => void;
  canSkip?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
  /** Sticky bottom area (typically a `PetWizardButton`). */
  footer?: React.ReactNode;
  /** When true, content is wrapped in a ScrollView. Defaults to true. */
  scrollable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** When true, footer sits above the keyboard (KeyboardAvoidingView). */
  avoidKeyboard?: boolean;
  children: React.ReactNode;
}

/**
 * PetWizardLayout — canonical chrome for any pet-wizard screen.
 *
 * Composition: `Screen` → `PetWizardHeader` → animated content area
 * (entering with a soft FadeIn so step transitions feel premium) →
 * sticky footer.
 *
 * Always use this instead of re-declaring the wizard chrome inside a
 * step component.
 */
export function PetWizardLayout({
  step,
  leading = "back",
  onLeadingPress,
  canSkip,
  onSkip,
  skipLabel,
  footer,
  scrollable = true,
  contentStyle,
  avoidKeyboard = true,
  children,
}: PetWizardLayoutProps) {
  const Body = scrollable ? ScrollView : View;
  const bodyProps = scrollable
    ? {
        keyboardShouldPersistTaps: "handled" as const,
        showsVerticalScrollIndicator: false,
        contentContainerStyle: [styles.content, contentStyle],
      }
    : { style: [styles.content, contentStyle] };

  const inner = (
    <>
      <PetWizardHeader
        step={step}
        leading={leading}
        onLeadingPress={onLeadingPress}
        canSkip={canSkip}
        onSkip={onSkip}
        skipLabel={skipLabel}
      />
      <Animated.View
        key={step}
        style={styles.flex}
        entering={FadeIn.duration(220)}
      >
        <Body {...bodyProps}>{children}</Body>
      </Animated.View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </>
  );

  return (
    <Screen>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {inner}
        </KeyboardAvoidingView>
      ) : (
        inner
      )}
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing["3xl"],
    gap: theme.spacing.lg,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: theme.spacing["2xl"],
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
}));
