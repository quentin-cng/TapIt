import { Image, StyleSheet, View } from "react-native";
import { getProfileAvatarAsset } from "./avatar-assets";

type TapItAvatarProps = {
  accessibilityLabel?: string;
  avatarId?: string | null;
  borderColor?: string;
  borderWidth?: number;
  size: number;
};

export function TapItAvatar({
  accessibilityLabel,
  avatarId,
  borderColor = "transparent",
  borderWidth = 0,
  size,
}: TapItAvatarProps) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? "image" : undefined}
      accessible={Boolean(accessibilityLabel)}
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderColor,
          borderRadius: size / 2,
          borderWidth,
        },
      ]}
    >
      <Image
        accessibilityIgnoresInvertColors
        accessible={false}
        resizeMode="cover"
        source={getProfileAvatarAsset(avatarId)}
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flexShrink: 0,
    overflow: "hidden",
  },
});
