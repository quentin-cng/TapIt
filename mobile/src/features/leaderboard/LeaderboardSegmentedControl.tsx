import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../../theme/tokens";
import type { LeaderboardView } from "./useLeaderboardData";

type LeaderboardSegmentedControlProps = {
  onChange: (view: LeaderboardView) => void;
  value: LeaderboardView;
};

export function LeaderboardSegmentedControl({
  onChange,
  value,
}: LeaderboardSegmentedControlProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {(["friends", "general"] as const).map((view) => {
        const selected = value === view;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={view}
            onPress={() => onChange(view)}
            style={({ pressed }) => [
              styles.button,
              selected && styles.buttonSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {view === "friends" ? "Friends" : "General"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: radii.large,
    backgroundColor: "#ecebed",
    padding: 4,
  },
  button: {
    minHeight: 42,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.medium,
  },
  buttonSelected: {
    backgroundColor: colors.purple,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  labelSelected: {
    color: colors.surface,
  },
  pressed: {
    opacity: 0.72,
  },
});
