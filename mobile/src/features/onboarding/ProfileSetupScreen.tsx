import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  isValidDisplayName,
  isValidUsername,
  normalizeDisplayName,
  normalizeUsername,
} from "../../domain/profile-identity";
import { supabase } from "../../lib/supabase";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { colors, fonts, radii } from "../../theme/tokens";
import { OnboardingStepScreen } from "./OnboardingStepScreen";

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

  async function saveProfile() {
    if (submissionInFlight.current) return;

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

  return (
    <OnboardingStepScreen
      isBusy={isSubmitting}
      message="Choose the name your friends will see and a unique TapIt username."
      title="Set up your profile"
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            autoCapitalize="words"
            autoComplete="name"
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
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
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
          ) : (
            <Text style={styles.help}>The name your friends will see.</Text>
          )}
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
              placeholderTextColor={colors.textMuted}
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
              Unique: lowercase letters, numbers, and underscores.
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
          disabled={isSubmitting}
          onPress={() => void saveProfile()}
          style={({ pressed }) => [
            styles.button,
            isSubmitting && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
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
  field: {
    gap: 7,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  usernameField: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    paddingLeft: 14,
  },
  atSign: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  usernameInput: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 3,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  inputError: {
    borderColor: colors.danger,
  },
  help: {
    color: colors.textMuted,
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
