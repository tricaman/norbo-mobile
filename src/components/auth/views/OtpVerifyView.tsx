import { DitPressable } from "@/components/DitPressable";
import { GoBackButton } from "@/components/GoBackButton";
import { useAuth } from "@/hooks/useAuth";
import { springs } from "@/hooks/useSpring";
import type { AuthScreen } from "@/types/auth.types";
import { extractError } from "@/utils/extract-error";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { ErrorMessage } from "../ErrorMessage";

const OTP_LENGTH = 6;
const AUTO_SUBMIT_DELAY_MS = 150;

// ─── OtpBox ───────────────────────────────────────────────────────────────────

interface OtpBoxProps {
  digit: string;
  isActive: boolean;
  hasError: boolean;
}

function OtpBox({ digit, isActive, hasError }: OtpBoxProps) {
  const { theme } = useUnistyles();
  const scale = useSharedValue(1);
  const cursorOpacity = useSharedValue(0);

  useEffect(() => {
    if (digit) {
      scale.value = 0.72;
      scale.value = withSpring(1, springs.bouncy);
    }
  }, [digit, scale]);

  useEffect(() => {
    if (isActive) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1, { duration: 600 }),
          withTiming(0, { duration: 100 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      );
      return () => cancelAnimation(cursorOpacity);
    }
    cancelAnimation(cursorOpacity);
    cursorOpacity.value = withTiming(0, { duration: 80 });
  }, [isActive, cursorOpacity]);

  const boxAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cursorAnimStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  const borderColor = hasError
    ? theme.colors.error
    : isActive
      ? theme.colors.primary
      : digit
        ? theme.colors.border2
        : theme.colors.border;

  const backgroundColor = isActive
    ? theme.colors.surface2
    : theme.colors.surface;

  return (
    <Animated.View
      style={[styles.box, { borderColor, backgroundColor }, boxAnimStyle]}
    >
      {digit ? (
        <Text
          style={[styles.boxDigit, hasError && { color: theme.colors.error }]}
        >
          {digit}
        </Text>
      ) : isActive ? (
        <Animated.View
          style={[
            styles.cursor,
            { backgroundColor: theme.colors.primary },
            cursorAnimStyle,
          ]}
        />
      ) : null}
    </Animated.View>
  );
}

// ─── SuccessOverlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ label }: { label: string }) {
  const { theme } = useUnistyles();
  const backdropOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 250 });
    circleScale.value = withSpring(1, springs.bouncy);
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 200 }));
  }, [backdropOpacity, circleScale, contentOpacity]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <Animated.View style={[styles.successBackdrop, backdropStyle]}>
      <Animated.View
        style={[
          styles.successCircle,
          {
            backgroundColor: theme.colors.primarySoft,
            borderColor: theme.colors.primary,
          },
          circleStyle,
        ]}
      >
        <Animated.View style={contentStyle}>
          <Ionicons name="checkmark" size={52} color={theme.colors.primary} />
        </Animated.View>
      </Animated.View>
      <Animated.Text
        style={[
          styles.successLabel,
          { color: theme.colors.primary },
          contentStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

// ─── OtpVerifyView ────────────────────────────────────────────────────────────

interface Props {
  email: string;
  onNavigate: (screen: AuthScreen) => void;
}

export function OtpVerifyView({ email, onNavigate }: Props) {
  const { t } = useTranslation();
  const { verifyOtp, completeSignIn, sendOtp } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const handleVerifyRef = useRef<() => void>(() => {});

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH || loading || showSuccess) return;
    setLoading(true);
    setError("");
    try {
      await verifyOtp(email, otp);
      setShowSuccess(true);
      await new Promise<void>((r) => setTimeout(r, 700));
      await completeSignIn();
    } catch (e: unknown) {
      setShowSuccess(false);
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  handleVerifyRef.current = () => void handleVerify();

  useEffect(() => {
    if (otp.length !== OTP_LENGTH || loading || showSuccess || error) return;
    const timer = setTimeout(
      () => handleVerifyRef.current(),
      AUTO_SUBMIT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [otp, loading, showSuccess, error]);

  const handleChangeText = (text: string) => {
    setError("");
    setOtp(text.replace(/[^0-9]/g, "").slice(0, OTP_LENGTH));
  };

  const startCooldown = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCooldown(60);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await sendOtp(email);
      startCooldown();
    } catch (e: unknown) {
      setError(extractError(e));
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.root}>
          <GoBackButton onPress={() => onNavigate("email-input")} />

          <Text style={styles.title}>{t("auth.otpTitle")}</Text>
          <Text style={styles.subtitle}>
            {t("auth.otpSubtitle", { email })}
          </Text>

          <View style={styles.form}>
            {/* OTP boxes: visual-only row + hidden capturing input on top */}
            <View style={styles.boxesWrapper}>
              <View style={styles.boxesRow} pointerEvents="none">
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <OtpBox
                    key={i}
                    digit={otp[i] ?? ""}
                    isActive={
                      i === otp.length && otp.length < OTP_LENGTH && !loading
                    }
                    hasError={!!error}
                  />
                ))}
              </View>
              <TextInput
                ref={inputRef}
                style={styles.hiddenInput}
                value={otp}
                onChangeText={handleChangeText}
                keyboardType="number-pad"
                maxLength={OTP_LENGTH}
                autoFocus
                caretHidden
                textContentType="oneTimeCode"
              />
            </View>

            <ErrorMessage message={error} />

            <DitPressable
              style={[
                styles.primaryBtn,
                (loading || otp.length !== OTP_LENGTH) && styles.btnDisabled,
              ]}
              scale="cta"
              haptic="medium"
              disabled={loading || otp.length !== OTP_LENGTH}
              onPress={() => void handleVerify()}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "..." : t("auth.otpVerify")}
              </Text>
            </DitPressable>

            <DitPressable
              scale="text"
              haptic="light"
              disabled={cooldown > 0}
              onPress={() => void handleResend()}
            >
              <Text
                style={[styles.linkText, cooldown > 0 && styles.linkDisabled]}
              >
                {cooldown > 0
                  ? t("auth.otpResendCooldown", { seconds: String(cooldown) })
                  : t("auth.otpResend")}
              </Text>
            </DitPressable>
          </View>
        </View>
      </SafeAreaView>

      {showSuccess && <SuccessOverlay label={t("auth.otpSuccess")} />}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: { flex: 1 },
  root: {
    flex: 1,
    paddingHorizontal: theme.spacing["3xl"],
    paddingTop: theme.spacing.xl,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing["3xl"],
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing["3xl"],
  },
  form: { gap: theme.spacing.md },
  boxesWrapper: {
    height: 58,
  },
  boxesRow: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row" as const,
    gap: theme.spacing.sm,
  },
  hiddenInput: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
  },
  box: {
    flex: 1,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  boxDigit: {
    fontFamily: "DMMono-Medium",
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  cursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
  },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.lg,
    alignItems: "center" as const,
    marginTop: theme.spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: {
    ...theme.typography.subhead,
    color: theme.colors.textOnPrimary,
  },
  linkText: {
    fontFamily: "DMMono-Regular",
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.primary,
    textAlign: "center" as const,
  },
  linkDisabled: {
    color: theme.colors.textTertiary,
  },
  successBackdrop: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: theme.spacing.xl,
  },
  successCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1.5,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  successLabel: {
    fontFamily: "DMMono-Medium",
    fontSize: 13,
    letterSpacing: 3,
    textTransform: "uppercase" as const,
  },
}));
