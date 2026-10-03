import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { colors, v3Colors } from "../../theme/tokens";

type SessionDotsProps = {
  accentColor?: string;
  compact?: boolean;
  completed: number;
  target: number;
  tone?: "dark" | "light";
  variant?: "default" | "v3";
};

export function SessionDots({
  accentColor = v3Colors.purple,
  compact = false,
  completed,
  target,
  tone = "light",
  variant = "default",
}: SessionDotsProps) {
  const safeTarget = Math.max(1, Math.min(7, target));
  const filled = Math.min(Math.max(0, completed), safeTarget);

  if (variant === "v3") {
    return (
      <View
        accessibilityLabel={`${completed} of ${target} weekly sessions completed`}
        style={styles.v3Row}
      >
        {Array.from({ length: safeTarget }, (_, index) => {
          const isFilled = index < filled;

          return (
            <Fragment key={index}>
              <View
                style={[
                  styles.v3Dot,
                  compact && styles.v3CompactDot,
                  isFilled && styles.v3FilledDot,
                  isFilled && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
              >
                {isFilled ? (
                  <MaterialCommunityIcons
                    color={colors.surface}
                    name="check"
                    size={compact ? 8 : 13}
                  />
                ) : null}
              </View>
              {index < safeTarget - 1 ? (
                <View
                  style={[
                    styles.v3Connector,
                    compact && styles.v3CompactConnector,
                    index < filled - 1 && {
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              ) : null}
            </Fragment>
          );
        })}
      </View>
    );
  }

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
  v3Row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  v3Dot: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: v3Colors.progressTrack,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  v3FilledDot: {
    borderWidth: 0,
    borderColor: v3Colors.purple,
    backgroundColor: v3Colors.purple,
  },
  v3CompactDot: {
    width: 14,
    height: 14,
    borderWidth: 3,
  },
  v3Connector: {
    height: 4,
    flex: 1,
    backgroundColor: v3Colors.progressTrack,
  },
  v3CompactConnector: {
    height: 3,
  },
});
