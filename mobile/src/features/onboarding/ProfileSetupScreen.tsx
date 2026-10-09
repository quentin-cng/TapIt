import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  isValidDisplayName,
  isValidUsername,
  normalizeDisplayName,
  normalizeUsername,
} from "../../domain/profile-identity";
import { supabase } from "../../lib/supabase";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, v3Colors } from "../../theme/tokens";

type FieldErrors = {
  displayName?: string;
  username?: string;
};

export function ProfileSetupScreen() {
  const { refresh } = useOnboarding();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const usernameInput = useRef<TextInput>(null);

  async function saveProfile() {
    if (submissionInFlight.current) return;

    Keyboard.dismiss();

    const normalizedDisplayName = normalizeDisplayName(displayName);
    const normalizedUsername = normalizeUsername(username);
    const nextFieldErrors: FieldErrors = {};

    if (!isValidDisplayName(normalizedDisplayName)) {
      nextFieldErrors.displayName =
        "Enter a display name between 1 and 30 characters.";
    }

    if (!isValidUsername(normalizedUsername)) {
      nextFieldErrors.username =
        "Use 3–30 lowercase letters, numbers, or underscores.";
    }

    setDisplayName(normalizedDisplayName);
    setUsername(normalizedUsername);
    setFieldErrors(nextFieldErrors);
    setSubmissionError("");

    if (Object.keys(nextFieldErrors).length > 0) return;

    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      const { error } = await supabase.rpc("update_my_profile", {
        p_display_name: normalizedDisplayName,
        p_username: normalizedUsername,
      });

      if (error) {
        if (__DEV__) {
          console.error("[mobile onboarding] profile setup failed", {
            code: error.code,
            message: error.message,
          });
        }

        const isUsernameConflict =
          error.code === "23505" ||
          error.message.toLowerCase().includes("duplicate key");

        if (isUsernameConflict) {
          setFieldErrors({ username: "That username is already taken." });
        } else {
          setSubmissionError(
            "We couldn’t save your profile. Please try again.",
          );
        }
        return;
      }

      await refresh();
    } catch (error) {
      if (__DEV__) {
        console.error("[mobile onboarding] profile setup failed", error);
      }
      setSubmissionError("We couldn’t save your profile. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heading}>
            <Text style={styles.kicker}>ACCOUNT SETUP</Text>
            <Text accessibilityRole="header" style={styles.title}>
              Make it yours<Text style={styles.period}>.</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                autoCapitalize="words"
                autoComplete="name"
                blurOnSubmit={false}
                editable={!isSubmitting}
                maxLength={30}
                onChangeText={(value) => {
                  setDisplayName(value);
                  if (fieldErrors.displayName) {
                    setFieldErrors((current) => ({
                      ...current,
                      displayName: undefined,
                    }));
                  }
                }}
                onSubmitEditing={() => usernameInput.current?.focus()}
                placeholder="Your name"
                placeholderTextColor="#9d919f"
                returnKeyType="next"
                style={[
                  styles.input,
                  fieldErrors.displayName && styles.inputError,
                ]}
                value={displayName}
              />
              {fieldErrors.displayName ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {fieldErrors.displayName}
                </Text>
              ) : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Username</Text>
              <View
                style={[
                  styles.usernameField,
                  fieldErrors.username && styles.inputError,
                ]}
              >
                <Text style={styles.atSign}>@</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="username"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  maxLength={30}
                  onChangeText={(value) => {
                    setUsername(value);
                    if (fieldErrors.username) {
                      setFieldErrors((current) => ({
                        ...current,
                        username: undefined,
                      }));
                    }
                  }}
                  onSubmitEditing={() => void saveProfile()}
                  placeholder="username"
                  placeholderTextColor="#9d919f"
                  ref={usernameInput}
                  returnKeyType="done"
                  spellCheck={false}
                  style={styles.usernameInput}
                  value={username}
                />
              </View>
              {fieldErrors.username ? (
                <Text accessibilityRole="alert" style={styles.fieldError}>
                  {fieldErrors.username}
                </Text>
              ) : (
                <Text style={styles.help}>
                  3–30 lowercase letters, numbers, or underscores.
                </Text>
              )}
            </View>

            {submissionError ? (
              <Text accessibilityRole="alert" style={styles.submissionError}>
                {submissionError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSubmitting }}
              disabled={isSubmitting}
              onPress={() => void saveProfile()}
              style={({ pressed }) => [
                styles.button,
                isSubmitting && styles.disabled,
                pressed && styles.pressed,
              ]}
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
            </Pressable>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff8ed",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    minHeight: "100%",
    flexGrow: 1,
    justifyContent: "center",
    gap: 32,
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
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: -1.8,
    lineHeight: 44,
  },
  period: {
    color: v3Colors.purple,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 7,
  },
  label: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#ddcfc0",
    borderRadius: 14,
    backgroundColor: "#fffcf6",
    paddingHorizontal: 15,
    color: v3Colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  usernameField: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddcfc0",
    borderRadius: 14,
    backgroundColor: "#fffcf6",
    paddingLeft: 15,
  },
  atSign: {
    color: "#9d919f",
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  usernameInput: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 3,
    color: v3Colors.ink,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  help: {
    color: "#8d818f",
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  fieldError: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  submissionError: {
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
    opacity: 0.72,
  },
});
