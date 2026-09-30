import { StyleSheet, View } from "react-native";
import { colors } from "../theme/tokens";

type ProgressBarProps = {
  height?: number;
  label: string;
  max: number;
  value: number;
};

export function ProgressBar({ height = 8, label, max, value }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const radius = Math.min(6, height / 2);

  return (
    <View
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={{ max, min: 0, now: value }}
      style={[styles.track, { borderRadius: radius, height }]}
    >
      <View style={[styles.fill, { borderRadius: radius, width: `${percentage}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: "hidden",
    backgroundColor: colors.surfaceElevated,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.purple,
  },
});
