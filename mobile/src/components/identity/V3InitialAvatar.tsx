import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";

const avatarPalettes = [
  { avatar: "#ffd9b5", foreground: "#713f1f", surface: "#fff4ea" },
  { avatar: "#cfece3", foreground: "#1f6650", surface: "#eff9f6" },
  { avatar: "#f8cedc", foreground: "#833652", surface: "#fff0f5" },
  { avatar: "#ddd3fb", foreground: "#4d3395", surface: "#f4f0ff" },
  { avatar: "#d6e3fb", foreground: "#31558a", surface: "#f1f5fd" },
] as const;

export function getV3AvatarPalette(identityKey: string) {
  let hash = 0;

  for (const character of identityKey) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }

  return avatarPalettes[hash % avatarPalettes.length];
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean);

  if (words.length > 1) {
    return `${Array.from(words[0])[0] ?? ""}${Array.from(words.at(-1) ?? "")[0] ?? ""}`.toLocaleUpperCase(
      "en-CA",
    );
  }

  return Array.from(words[0] ?? "T")
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("en-CA");
}

export function V3InitialAvatar({
  identityKey,
  name,
  size = "medium",
}: {
  identityKey: string;
  name: string;
  size?: "small" | "medium" | "large";
}) {
  const palette = getV3AvatarPalette(identityKey);

  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.avatar,
        size === "small"
          ? styles.small
          : size === "large"
            ? styles.large
            : styles.medium,
        { backgroundColor: palette.avatar },
      ]}
    >
      <Text
        style={[
          styles.initials,
          size === "small"
            ? styles.smallInitials
            : size === "large"
              ? styles.largeInitials
              : styles.mediumInitials,
          { color: palette.foreground },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  medium: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  large: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  initials: {
    fontFamily: fonts.bold,
  },
  smallInitials: {
    fontSize: 12,
  },
  mediumInitials: {
    fontSize: 16,
  },
  largeInitials: {
    fontSize: 20,
  },
});
