import * as Haptics from 'expo-haptics';

const run = (fn: () => Promise<void>) => {
  fn().catch(() => {});
};

export const haptics = {
  light: () => run(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  medium: () => run(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  heavy: () => run(() =>
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  success: () => run(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  warning: () => run(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  error: () => run(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
} as const;

export type HapticWeight = keyof typeof haptics;
