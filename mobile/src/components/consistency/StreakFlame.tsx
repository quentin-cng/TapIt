import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { colors, fonts } from "../../theme/tokens";

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
  message,
  streak,
  tone = "light",
}: {
  message: string;
  streak: number;
  tone?: "dark" | "light";
}) {
  const tier = getFlameTier(streak);
  const isDark = tone === "dark";

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
});
