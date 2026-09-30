import { StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

type ProgressBarProps = {
  label: string;
  max: number;
  value: number;
};

export function ProgressBar({ label, max, value }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ max, min: 0, now: value }}
      style={styles.track}
    >
      <View style={[styles.fill, { width: `${percentage}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    overflow: "hidden",
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  fill: {
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.purple,
  },
});
