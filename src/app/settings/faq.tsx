import { DitPressable } from "@/components/DitPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Screen } from "@/components/ui/Screen";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SCREEN_BOTTOM_PADDING } from "@/constants/layout";
import { springs } from "@/hooks/useSpring";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

type FaqItemData = {
  question: string;
  answer: string;
};

type FaqSection = {
  title: string;
  items: FaqItemData[];
};

function FaqItem({ question, answer }: FaqItemData) {
  const { theme } = useUnistyles();
  const progress = useSharedValue(0);
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    progress.value = withSpring(next ? 1 : 0, springs.snappy);
  };

  const containerStyle = useAnimatedStyle(() => ({
    maxHeight: interpolate(progress.value, [0, 1], [0, 400]),
    opacity: interpolate(progress.value, [0, 0.5], [0, 1]),
    overflow: "hidden" as const,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg` },
    ],
  }));

  return (
    <View style={styles.faqItem}>
      <DitPressable
        style={styles.questionRow}
        onPress={toggle}
        scale="row"
        haptic="light"
      >
        <Text style={styles.question}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <IconSymbol
            name="chevron.down"
            size={13}
            tintColor={theme.colors.textTertiary}
          />
        </Animated.View>
      </DitPressable>
      <Animated.View style={containerStyle}>
        <Text style={styles.answer}>{answer}</Text>
      </Animated.View>
    </View>
  );
}

export default function FaqScreen() {
  const { t } = useTranslation();

  const sections: FaqSection[] = [
    {
      title: t("faqScreen.basics.title"),
      items: [
        {
          question: t("faqScreen.basics.q1"),
          answer: t("faqScreen.basics.a1"),
        },
        {
          question: t("faqScreen.basics.q2"),
          answer: t("faqScreen.basics.a2"),
        },
      ],
    },
    {
      title: t("faqScreen.signals.title"),
      items: [
        {
          question: t("faqScreen.signals.q1"),
          answer: t("faqScreen.signals.a1"),
        },
        {
          question: t("faqScreen.signals.q2"),
          answer: t("faqScreen.signals.a2"),
        },
        {
          question: t("faqScreen.signals.q3"),
          answer: t("faqScreen.signals.a3"),
        },
        {
          question: t("faqScreen.signals.q4"),
          answer: t("faqScreen.signals.a4"),
        },
      ],
    },
    {
      title: t("faqScreen.privacy.title"),
      items: [
        {
          question: t("faqScreen.privacy.q1"),
          answer: t("faqScreen.privacy.a1"),
        },
        {
          question: t("faqScreen.privacy.q2"),
          answer: t("faqScreen.privacy.a2"),
        },
        {
          question: t("faqScreen.privacy.q3"),
          answer: t("faqScreen.privacy.a3"),
        },
        {
          question: t("faqScreen.privacy.q4"),
          answer: t("faqScreen.privacy.a4"),
        },
        {
          question: t("faqScreen.privacy.q5"),
          answer: t("faqScreen.privacy.a5"),
        },
      ],
    },
    {
      title: t("faqScreen.account.title"),
      items: [
        {
          question: t("faqScreen.account.q1"),
          answer: t("faqScreen.account.a1"),
        },
        {
          question: t("faqScreen.account.q2"),
          answer: t("faqScreen.account.a2"),
        },
        {
          question: t("faqScreen.account.q3"),
          answer: t("faqScreen.account.a3"),
        },
        {
          question: t("faqScreen.account.q4"),
          answer: t("faqScreen.account.a4"),
        },
      ],
    },
  ];

  return (
    <Screen>
      <ScreenHeader title={t("faqScreen.title")} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sections.map((section) => (
          <View key={section.title} style={styles.card}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <React.Fragment key={item.question}>
                <FaqItem question={item.question} answer={item.answer} />
                {i < section.items.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scrollContent: {
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing["2xl"],
    paddingBottom: SCREEN_BOTTOM_PADDING,
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
  },
  faqItem: {
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  question: {
    ...theme.typography.subhead,
    color: theme.colors.textPrimary,
    flex: 1,
    textTransform: "lowercase",
  },
  answer: {
    ...theme.typography.footnote,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  cardTitle: {
    ...theme.typography.footnote,
    color: theme.colors.primary,
    textTransform: "lowercase",
    letterSpacing: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
  },
  divider: {
    height: theme.hairline,
    marginLeft: theme.spacing.xl,
    backgroundColor: theme.colors.border,
  },
}));
