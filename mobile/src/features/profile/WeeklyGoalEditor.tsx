import { useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radii } from "../../theme/tokens";
import type { ProfileMutationResult } from "./useProfileData";

type WeeklyGoalEditorProps = {
  currentGoal: number | null;
  onCancel: () => void;
  onSave: (goal: number) => Promise<ProfileMutationResult>;
  pendingGoal: number | null;
};

export function WeeklyGoalEditor({
  currentGoal,
  onCancel,
  onSave,
  pendingGoal,
}: WeeklyGoalEditorProps) {
  const initialGoal = pendingGoal ?? currentGoal ?? 1;
  const [selectedGoal, setSelectedGoal] = useState(initialGoal);
  const incomingSource = `${currentGoal ?? "none"}:${pendingGoal ?? "none"}`;
  const [source, setSource] = useState(incomingSource);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<ProfileMutationResult | null>(null);

  if (!isSaving && source !== incomingSource) {
    setSource(incomingSource);
    setSelectedGoal(pendingGoal ?? currentGoal ?? 1);
  }

  function adjustGoal(change: number) {
    setNotice(null);
    setSelectedGoal((current) => Math.min(7, Math.max(1, current + change)));
  }

  async function save() {
    if (isSaving) return;

    setNotice(null);
    setIsSaving(true);
    const result = await onSave(selectedGoal);
    setNotice(result);
    setIsSaving(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Weekly goal
        </Text>
        <Pressable
          accessibilityLabel="Close weekly goal"
          accessibilityRole="button"
          disabled={isSaving}
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            color={colors.textSecondary}
            name="close"
            size={21}
          />
        </Pressable>
      </View>

      <Text style={styles.prompt}>
        How many times do you want to show up each week?
      </Text>

      <View style={styles.counter}>
        <Pressable
          accessibilityLabel="Decrease weekly goal"
          accessibilityRole="button"
          disabled={isSaving || selectedGoal === 1}
          onPress={() => adjustGoal(-1)}
          style={({ pressed }) => [
            styles.counterButton,
            selectedGoal === 1 && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            color={colors.textPrimary}
            name="minus"
            size={25}
          />
        </Pressable>
        <View style={styles.goalValueWrap}>
          <Text style={styles.goalValue}>{selectedGoal}</Text>
          <Text style={styles.goalUnit}>
            {selectedGoal === 1 ? "workout" : "workouts"}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Increase weekly goal"
          accessibilityRole="button"
          disabled={isSaving || selectedGoal === 7}
          onPress={() => adjustGoal(1)}
          style={({ pressed }) => [
            styles.counterButton,
            selectedGoal === 7 && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            color={colors.textPrimary}
            name="plus"
            size={25}
          />
        </Pressable>
      </View>

      <Text style={styles.scheduleCopy}>
        {currentGoal === null
          ? "Your first goal may begin this week."
          : "Changes start next Monday."}
      </Text>

      {pendingGoal !== null ? (
        <Text style={styles.pendingNote}>
          {pendingGoal} {pendingGoal === 1 ? "workout is" : "workouts are"} already scheduled for next week. Saving replaces that goal.
        </Text>
      ) : null}

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

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void save()}
        style={({ pressed }) => [
          styles.saveButton,
          isSaving && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.surface} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save goal</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 23,
    letterSpacing: -0.8,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.surfaceElevated,
  },
  prompt: {
    maxWidth: 300,
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 25,
    marginVertical: 27,
  },
  counterButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 24,
    backgroundColor: colors.surface,
  },
  goalValueWrap: {
    minWidth: 76,
    alignItems: "center",
  },
  goalValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 42,
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
    lineHeight: 44,
  },
  goalUnit: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  scheduleCopy: {
    textAlign: "center",
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  pendingNote: {
    marginTop: 13,
    borderRadius: radii.medium,
    backgroundColor: "#ece6fb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.purpleDark,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  notice: {
    marginTop: 13,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  success: {
    color: colors.success,
  },
  error: {
    color: colors.danger,
  },
  saveButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: radii.medium,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.38,
  },
  pressed: {
    opacity: 0.7,
  },
});
