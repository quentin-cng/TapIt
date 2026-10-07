import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";
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
    borderWidth: 1,
    borderColor: "#eadccd",
    borderRadius: 20,
    backgroundColor: "#fffaf3",
    padding: 3,
  },
  button: {
    minHeight: 38,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  buttonSelected: {
    backgroundColor: "#24143f",
  },
  label: {
    color: "#1a1333",
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  labelSelected: {
    color: "#fffcf6",
  },
  pressed: {
    opacity: 0.7,
  },
});
