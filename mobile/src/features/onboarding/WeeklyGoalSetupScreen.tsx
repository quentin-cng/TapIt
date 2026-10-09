import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { TapPressable } from "../../motion/TapPressable";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, v3Colors } from "../../theme/tokens";

const weeklyGoalOptions = [1, 2, 3, 4, 5, 6, 7] as const;
type WeeklyGoal = (typeof weeklyGoalOptions)[number];

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

function isWeeklyGoal(value: number | null): value is WeeklyGoal {
  return (
    value !== null &&
    Number.isInteger(value) &&
    value >= weeklyGoalOptions[0] &&
    value <= weeklyGoalOptions[weeklyGoalOptions.length - 1]
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

    if (!isWeeklyGoal(selectedGoal)) {
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
      if (
        !isConfigureGoalResult(result) ||
        result.goal_sessions !== selectedGoal
      ) {
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

  async function signOut() {
    await supabase.auth.signOut();
  }

  const isContinueDisabled = isSubmitting || selectedGoal === null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.kicker}>ACCOUNT SETUP</Text>
          <Text accessibilityRole="header" style={styles.title}>
            Set your weekly goal<Text style={styles.period}>.</Text>
          </Text>
          <Text style={styles.copy}>
            How many times do you want to show up each week?
          </Text>
        </View>

        <View style={styles.form}>
          <View
            accessibilityLabel="Weekly session goal"
            accessibilityRole="radiogroup"
            style={styles.options}
          >
            {weeklyGoalOptions.map((goal) => {
              const isSelected = selectedGoal === goal;

              return (
                <Pressable
                  accessibilityLabel={`${goal} ${goal === 1 ? "session" : "sessions"} per week`}
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: isSelected,
                    disabled: isSubmitting,
                  }}
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

          <View style={styles.selectionSummary}>
            {selectedGoal === null ? (
              <Text style={styles.selectionPrompt}>Choose 1–7 sessions.</Text>
            ) : (
              <>
                <Text style={styles.selectionNumber}>{selectedGoal}</Text>
                <Text style={styles.selectionLabel}>
                  {selectedGoal === 1 ? "session" : "sessions"} each week
                </Text>
              </>
            )}
          </View>

          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <TapPressable
            accessibilityRole="button"
            accessibilityState={{
              busy: isSubmitting,
              disabled: isContinueDisabled,
            }}
            disabled={isContinueDisabled}
            haptic="press"
            onPress={() => void saveGoal()}
            style={[styles.button, isContinueDisabled && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fffaf1" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <MaterialCommunityIcons
                  color="#fffaf1"
                  name="arrow-right"
                  size={20}
                />
              </>
            )}
          </TapPressable>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => void signOut()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.signOut}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff8ed",
  },
  content: {
    minHeight: "100%",
    flexGrow: 1,
    justifyContent: "center",
    gap: 34,
    paddingHorizontal: 24,
    paddingVertical: 30,
  },
  heading: {
    gap: 10,
  },
  kicker: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.25,
  },
  title: {
    maxWidth: 350,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1.8,
    lineHeight: 44,
  },
  period: {
    color: v3Colors.purple,
  },
  copy: {
    maxWidth: 340,
    color: "#706474",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 22,
  },
  options: {
    flexDirection: "row",
    gap: 6,
  },
  option: {
    minWidth: 0,
    minHeight: 52,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 15,
    backgroundColor: "#f4eadd",
  },
  optionSelected: {
    borderColor: v3Colors.purpleDark,
    backgroundColor: v3Colors.purpleDark,
  },
  optionText: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  optionTextSelected: {
    color: "#fffaf1",
  },
  selectionSummary: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: "#f8eee3",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectionNumber: {
    color: v3Colors.purpleDark,
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -1.5,
  },
  selectionLabel: {
    color: v3Colors.ink,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  selectionPrompt: {
    color: "#8d818f",
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  button: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  signOut: {
    color: "#706474",
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingVertical: 8,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
