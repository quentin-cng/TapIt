import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, v3Colors } from "../../theme/tokens";

type FlameTier = {
  color: string;
  size: number;
};

function getFlameTier(streak: number): FlameTier {
  if (streak === 0) return { color: colors.textMuted, size: 32 };
  if (streak <= 2) return { color: "#d85d32", size: 38 };
  if (streak <= 5) return { color: "#e25424", size: 44 };
  if (streak <= 10) return { color: "#ed4b1b", size: 51 };
  if (streak <= 20) return { color: "#f04416", size: 59 };
  return { color: "#f43f0f", size: 68 };
}

export function StreakFlame({
  compact = false,
  message,
  streak,
  tone = "light",
  variant = "default",
}: {
  compact?: boolean;
  message: string;
  streak: number;
  tone?: "dark" | "light";
  variant?: "default" | "v3";
}) {
  const tier = getFlameTier(streak);
  const isDark = tone === "dark";

  if (variant === "v3") {
    return (
      <View
        accessible
        accessibilityLabel={`${streak} week streak. ${message}`}
        style={[styles.v3Container, compact && styles.v3CompactContainer]}
      >
        <View
          style={[
            styles.v3FlameSurface,
            compact && styles.v3CompactFlameSurface,
          ]}
        >
          <MaterialCommunityIcons
            color={v3Colors.flame}
            name="fire"
            size={compact ? 32 : 39}
          />
        </View>
        <View style={styles.v3Copy}>
          <Text style={[styles.v3Title, compact && styles.v3CompactTitle]}>
            {streak} week streak
          </Text>
          <Text style={[styles.v3Message, compact && styles.v3CompactMessage]}>
            {message}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityLabel={`${streak} week streak. ${message}`}
      style={styles.container}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <MaterialCommunityIcons color={tier.color} name="fire" size={tier.size} />
      </View>
      <View style={styles.copy}>
        <Text
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.value, isDark && styles.darkValue]}
        >
          {streak}
        </Text>
        <Text style={[styles.label, isDark && styles.darkSecondary]}>
          Week streak
        </Text>
        <Text style={[styles.message, isDark && styles.darkSecondary]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: {
    flexShrink: 1,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 54,
    fontVariant: ["tabular-nums"],
    letterSpacing: -3.4,
    lineHeight: 56,
  },
  darkValue: {
    color: "#ffffff",
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  message: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  darkSecondary: {
    color: "#aaa6b2",
  },
  v3Container: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  v3CompactContainer: {
    minHeight: 62,
    gap: 11,
  },
  v3FlameSurface: {
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: v3Colors.flameSurface,
  },
  v3CompactFlameSurface: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  v3Copy: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  v3Title: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.65,
  },
  v3CompactTitle: {
    fontSize: 16,
  },
  v3Message: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  v3CompactMessage: {
    fontSize: 12,
  },
});
