import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type { ProfileMutationResult } from "./useProfileData";

type WeeklyGoalEditorProps = {
  currentGoal: number | null;
  onSave: (goal: number) => Promise<ProfileMutationResult>;
  pendingGoal: number | null;
};

export function WeeklyGoalEditor({
  currentGoal,
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

  function chooseGoal(goal: number) {
    setNotice(null);
    setSelectedGoal(goal);
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
      <View style={styles.headingRow}>
        <Text accessibilityRole="header" style={styles.title}>Weekly goal</Text>
        {currentGoal !== null ? (
          <Text style={styles.currentGoal}>
            {currentGoal} / week
          </Text>
        ) : null}
      </View>

      <View accessibilityRole="radiogroup" style={styles.choices}>
        {Array.from({ length: 7 }, (_, index) => index + 1).map((goal) => {
          const isSelected = selectedGoal === goal;

          return (
            <Pressable
              accessibilityLabel={`${goal} ${goal === 1 ? "session" : "sessions"} per week`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected, disabled: isSaving }}
              disabled={isSaving}
              key={goal}
              onPress={() => chooseGoal(goal)}
              style={({ pressed }) => [
                styles.choice,
                isSelected && styles.selectedChoice,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.choiceText,
                  isSelected && styles.selectedChoiceText,
                ]}
              >
                {goal}
              </Text>
            </Pressable>
          );
        })}
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
    marginTop: 36,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  currentGoal: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  choices: {
    flexDirection: "row",
    gap: 7,
    marginTop: 14,
  },
  choice: {
    minWidth: 0,
    minHeight: 42,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#f2e9de",
  },
  selectedChoice: {
    backgroundColor: v3Colors.purpleDark,
  },
  choiceText: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  selectedChoiceText: {
    color: "#fff8f1",
  },
  scheduleCopy: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  pendingNote: {
    marginTop: 13,
    borderRadius: radii.medium,
    backgroundColor: v3Colors.lavender,
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
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: radii.medium,
    backgroundColor: v3Colors.ink,
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
