import { StyleSheet, View } from "react-native";
import { colors } from "../../theme/tokens";

type SessionDotsProps = {
  compact?: boolean;
  completed: number;
  target: number;
  tone?: "dark" | "light";
};

export function SessionDots({
  compact = false,
  completed,
  target,
  tone = "light",
}: SessionDotsProps) {
  const safeTarget = Math.max(1, Math.min(7, target));
  const filled = Math.min(Math.max(0, completed), safeTarget);

  return (
    <View
      accessibilityLabel={`${completed} of ${target} weekly sessions completed`}
      style={[styles.row, compact && styles.compactRow]}
    >
      {Array.from({ length: safeTarget }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            compact && styles.compactDot,
            tone === "dark" && styles.darkDot,
            index < filled && styles.filledDot,
            index < filled && tone === "dark" && styles.darkFilledDot,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
  },
  compactRow: {
    gap: 5,
  },
  dot: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
  },
  compactDot: {
    width: 8,
    height: 8,
  },
  darkDot: {
    borderColor: "#484451",
    backgroundColor: "#28252f",
  },
  filledDot: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  darkFilledDot: {
    borderColor: "#8b67ed",
    backgroundColor: "#8b67ed",
  },
});
