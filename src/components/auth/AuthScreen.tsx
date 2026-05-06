import React, { useState, useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { springs } from "@/hooks/useSpring";
import type { AuthScreen as AuthScreenType } from "@/types/auth.types";

import { LandingView } from "./views/LandingView";
import { EmailInputView } from "./views/EmailInputView";
import { OtpVerifyView } from "./views/OtpVerifyView";

export function AuthScreen() {
  const [screen, setScreen] = useState<AuthScreenType>("landing");
  const [pendingEmail, setPendingEmail] = useState("");
  const opacity = useSharedValue(1);

  const navigate = useCallback(
    (next: AuthScreenType, email?: string) => {
      const applyNav = () => {
        if (email) setPendingEmail(email);
        setScreen(next);
        opacity.value = withSpring(1, springs.default);
      };
      opacity.value = withSpring(0, springs.snappy, () => {
        runOnJS(applyNav)();
      });
    },
    [opacity],
  );

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const renderView = () => {
    switch (screen) {
      case "landing":
        return <LandingView onNavigate={navigate} />;
      case "email-input":
        return <EmailInputView onNavigate={navigate} />;
      case "otp-verify":
        return <OtpVerifyView email={pendingEmail} onNavigate={navigate} />;
    }
  };

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.content, animStyle]}>
        {renderView()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
}));
