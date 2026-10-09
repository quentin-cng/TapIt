import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { TapPressable } from "../../motion/TapPressable";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, v3Colors } from "../../theme/tokens";

function isCompletionTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function CompleteOnboardingScreen() {
  const { refresh } = useOnboarding();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  async function completeOnboarding() {
    if (submissionInFlight.current) return;

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "complete_my_onboarding",
      );

      if (rpcError || !isCompletionTimestamp(data)) {
        if (__DEV__) {
          console.error("[mobile onboarding] completion failed", {
            code: rpcError?.code,
            message: rpcError?.message,
          });
        }
        setError("We couldn’t finish setting up your account. Please try again.");
        return;
      }

      await refresh();
    } catch (failure) {
      if (__DEV__) {
        console.error("[mobile onboarding] completion failed", failure);
      }
      setError("We couldn’t finish setting up your account. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.celebration}>
          <View style={styles.markHalo}>
            <View style={styles.mark}>
              <MaterialCommunityIcons color="#fffaf1" name="check" size={40} />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text accessibilityRole="header" style={styles.title}>
              You’re in<Text style={styles.period}>.</Text>
            </Text>
            <Text style={styles.message}>
              Your goal is set.{"\n"}Now show up.
            </Text>
          </View>
        </View>

        <View style={styles.actionBlock}>
          {error ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          ) : null}

          <TapPressable
            accessibilityRole="button"
            accessibilityState={{ busy: isSubmitting }}
            disabled={isSubmitting}
            haptic="press"
            onPress={() => void completeOnboarding()}
            style={[styles.button, isSubmitting && styles.disabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fffaf1" />
            ) : (
              <>
                <Text style={styles.buttonText}>Get started</Text>
                <MaterialCommunityIcons
                  color="#fffaf1"
                  name="arrow-right"
                  size={20}
                />
              </>
            )}
          </TapPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff8ed",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 22,
  },
  celebration: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 34,
  },
  markHalo: {
    width: 118,
    height: 118,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 59,
    backgroundColor: v3Colors.lavender,
  },
  mark: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
    backgroundColor: v3Colors.purpleDark,
  },
  copyBlock: {
    alignItems: "center",
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: -2.2,
    lineHeight: 52,
    textAlign: "center",
  },
  period: {
    color: v3Colors.purple,
  },
  message: {
    marginTop: 14,
    color: "#706474",
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  actionBlock: {
    gap: 14,
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
  disabled: {
    opacity: 0.45,
  },
});
