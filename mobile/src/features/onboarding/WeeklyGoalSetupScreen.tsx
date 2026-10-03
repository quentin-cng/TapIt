import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, radii } from "../../theme/tokens";
import { OnboardingStepScreen } from "./OnboardingStepScreen";

type ConfigureGoalResult = {
  applies_current_week: boolean;
  effective_week: string;
  goal_sessions: number;
};

function isConfigureGoalResult(value: unknown): value is ConfigureGoalResult {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<ConfigureGoalResult>;
  return (
    typeof result.applies_current_week === "boolean" &&
    typeof result.effective_week === "string" &&
    typeof result.goal_sessions === "number"
  );
}

export function WeeklyGoalSetupScreen() {
  const { refresh } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  async function saveGoal() {
    if (submissionInFlight.current) return;

    if (
      selectedGoal === null ||
      !Number.isInteger(selectedGoal) ||
      selectedGoal < 1 ||
      selectedGoal > 7
    ) {
      setError("Choose a weekly goal from 1 to 7 sessions.");
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "configure_weekly_goal",
        { p_goal_sessions: selectedGoal },
      );

      if (rpcError) {
        if (__DEV__) {
          console.error("[mobile onboarding] weekly goal setup failed", {
            code: rpcError.code,
            message: rpcError.message,
          });
        }
        setError("We couldn’t save your weekly goal. Please try again.");
        return;
      }

      const result = Array.isArray(data) ? data[0] : data;
      if (!isConfigureGoalResult(result)) {
        if (__DEV__) {
          console.error(
            "[mobile onboarding] weekly goal returned no valid result",
          );
        }
        setError("We couldn’t save your weekly goal. Please try again.");
        return;
      }

      await refresh();
    } catch (failure) {
      if (__DEV__) {
        console.error("[mobile onboarding] weekly goal setup failed", failure);
      }
      setError("We couldn’t save your weekly goal. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <OnboardingStepScreen
      isBusy={isSubmitting}
      message="Choose the commitment you want to make each week. You can schedule changes later from Profile."
      title="Set your weekly goal"
    >
      <View style={styles.form}>
        <View
          accessibilityLabel="Weekly session goal"
          accessibilityRole="radiogroup"
          style={styles.options}
        >
          {Array.from({ length: 7 }, (_, index) => index + 1).map((goal) => {
            const isSelected = selectedGoal === goal;

            return (
              <Pressable
                accessibilityLabel={`${goal} ${goal === 1 ? "session" : "sessions"} per week`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                disabled={isSubmitting}
                key={goal}
                onPress={() => {
                  setSelectedGoal(goal);
                  setError("");
                }}
                style={({ pressed }) => [
                  styles.option,
                  isSelected && styles.optionSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {goal}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.summary}>
          {selectedGoal ? (
            <>
              <Text style={styles.summaryNumber}>{selectedGoal}</Text>
              <Text style={styles.summaryLabel}>
                {selectedGoal === 1 ? "session" : "sessions"} per week
              </Text>
            </>
          ) : (
            <Text style={styles.summaryPrompt}>Select a goal from 1 to 7.</Text>
          )}
        </View>

        <Text style={styles.help}>
          Your first goal starts this week. TapIt uses Montreal calendar weeks.
        </Text>

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting || selectedGoal === null}
          onPress={() => void saveGoal()}
          style={({ pressed }) => [
            styles.button,
            (isSubmitting || selectedGoal === null) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Start my week</Text>
          )}
        </Pressable>
      </View>
    </OnboardingStepScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 18,
  },
  options: {
    flexDirection: "row",
    gap: 7,
  },
  option: {
    minWidth: 0,
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  optionTextSelected: {
    color: colors.surface,
  },
  summary: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 14,
  },
  summaryNumber: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -1.5,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  summaryPrompt: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  help: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.medium,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
