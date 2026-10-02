import { useState } from "react";
import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { colors, fonts } from "../../theme/tokens";
import type { PrivacyMutationResult } from "./useProfileData";

type ProfilePrivacySettingProps = {
  onChange: (value: boolean) => Promise<PrivacyMutationResult>;
  value: boolean;
};

export function ProfilePrivacySetting({
  onChange,
  value,
}: ProfilePrivacySettingProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<PrivacyMutationResult | null>(null);

  async function change(nextValue: boolean) {
    if (isSaving) return;

    setNotice(null);
    setIsSaving(true);
    const result = await onChange(nextValue);
    setNotice(result);
    setIsSaving(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.settingRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>Show my name</Text>
          <Text style={styles.description}>
            When off, your rank and points remain visible as Anonymous.
          </Text>
        </View>
        <View style={styles.control}>
          <Switch
            accessibilityLabel="Show my name on the General leaderboard"
            disabled={isSaving}
            ios_backgroundColor="#e8e7eb"
            onValueChange={(nextValue) => void change(nextValue)}
            thumbColor={colors.surface}
            trackColor={{ false: "#e8e7eb", true: colors.purple }}
            value={value}
          />
          {isSaving ? (
            <ActivityIndicator color={colors.purple} size="small" />
          ) : null}
        </View>
      </View>
      {notice ? (
        <Text
          accessibilityRole={notice.status === "error" ? "alert" : "text"}
          style={[
            styles.notice,
            notice.status === "error" ? styles.error : styles.success,
          ]}
        >
          {notice.message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 15,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  description: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  control: {
    alignItems: "center",
    gap: 4,
  },
  notice: {
    marginTop: 8,
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
