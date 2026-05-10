import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { useUnistyles } from "react-native-unistyles";

interface SaveHeaderActionProps {
  onPress: () => void;
  disabled?: boolean;
  /** Icon size. Default 20. */
  size?: number;
}

/**
 * SaveHeaderAction — checkmark header action button.
 * Used as the `right` slot of ScreenHeader on every "save" form screen.
 */
export function SaveHeaderAction({
  onPress,
  disabled = false,
  size = 20,
}: SaveHeaderActionProps) {
  const { theme } = useUnistyles();

  return (
    <NorboPressable
      style={{
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
      }}
      scale="row"
      haptic="medium"
      disabled={disabled}
      onPress={onPress}
    >
      <IconSymbol
        name="checkmark"
        size={size}
        tintColor={disabled ? theme.colors.textTertiary : theme.colors.primary}
      />
    </NorboPressable>
  );
}
