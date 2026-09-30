import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { colors, fonts } from "../../theme/tokens";

type GeneralLeaderboardPrivacyToggleProps = {
  isSaving: boolean;
  message: { status: "success" | "error"; message: string } | null;
  onChange: (value: boolean) => void;
  value: boolean;
};

export function GeneralLeaderboardPrivacyToggle({
  isSaving,
  message,
  onChange,
  value,
}: GeneralLeaderboardPrivacyToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.controlRow}>
        <Switch
          accessibilityLabel="Show my name on the General leaderboard"
          disabled={isSaving}
          ios_backgroundColor="#e8e7eb"
          onValueChange={onChange}
          thumbColor={colors.surface}
          trackColor={{ false: "#e8e7eb", true: colors.purple }}
          value={value}
        />
        <Text style={styles.label}>Show my name</Text>
        {isSaving ? (
          <ActivityIndicator color={colors.purple} size="small" />
        ) : null}
      </View>
      {message ? (
        <Text
          accessibilityRole={message.status === "error" ? "alert" : "text"}
          style={[
            styles.message,
            message.status === "error" ? styles.error : styles.success,
          ]}
        >
          {message.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  message: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  success: {
    color: colors.success,
  },
  error: {
    color: colors.danger,
  },
});
