import { NorboPressable } from "@/components/CustomPressable";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useRouter } from "expo-router";
import { StyleProp, ViewStyle } from "react-native";
import { useUnistyles } from "react-native-unistyles";

interface GoBackButtonProps {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function GoBackButton({ style, onPress }: GoBackButtonProps) {
  const router = useRouter();
  const { theme } = useUnistyles();

  return (
    <NorboPressable
      style={[
        {
          width: 40,
          height: 40,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
      scale="row"
      haptic="light"
      onPress={onPress ?? (() => router.back())}
    >
      <IconSymbol
        name="chevron.left"
        size={20}
        tintColor={theme.colors.textPrimary}
      />
    </NorboPressable>
  );
}
