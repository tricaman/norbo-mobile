import React from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { springs } from "@/hooks/useSpring";

interface Props {
  message: string;
}

export function ErrorMessage({ message }: Props) {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    height.value = withSpring(message ? 24 : 0, springs.snappy);
    opacity.value = withSpring(message ? 1 : 0, springs.snappy);
  }, [message, height, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden" as const,
  }));

  return (
    <Animated.View style={animStyle}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  text: {
    ...theme.typography.footnote,
    color: theme.colors.error,
  },
}));
