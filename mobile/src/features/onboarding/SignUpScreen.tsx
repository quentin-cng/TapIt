import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radii } from "../../theme/tokens";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const termsUrl = "https://tap-it-pied.vercel.app/terms";
const privacyUrl = "https://tap-it-pied.vercel.app/privacy";

function friendlySignupError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("already registered")) {
    return "An account already exists for this email.";
  }

  if (normalizedMessage.includes("password")) return message;

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "Too many signup attempts. Please wait and try again.";
  }

  return "We could not create your account. Please try again.";
}

export function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isConfirmationRequired, setIsConfirmationRequired] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  async function signUp() {
    if (isSigningUp) return;

    const normalizedEmail = email.trim().toLowerCase();
    setNotice("");
    setIsConfirmationRequired(false);

    if (!emailPattern.test(normalizedEmail)) {
      setNotice("Enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setNotice("Password must be at least 8 characters.");
      return;
    }

    setIsSigningUp(true);
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setNotice(friendlySignupError(error.message));
      setIsSigningUp(false);
      return;
    }

    setPassword("");

    if (!data.session) {
      setIsConfirmationRequired(true);
      setNotice(
        "Account created. Check your email to confirm it, then return to TapIt and log in.",
      );
    }

    setIsSigningUp(false);
  }

  const isDisabled = isSigningUp || !email.trim() || !password;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.wordmarkRow}>
            <Text style={styles.wordmark}>
              Tap<Text style={styles.wordmarkAccent}>It</Text>
            </Text>
          </View>

          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>
              Create account
            </Text>
            <Text style={styles.subtitle}>
              Start with your email. You’ll set up your TapIt profile next.
            </Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSigningUp && !isConfirmationRequired}
                inputMode="email"
                onChangeText={setEmail}
                placeholder="example@email.com"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                value={email}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isSigningUp && !isConfirmationRequired}
                onChangeText={setPassword}
                onSubmitEditing={() => void signUp()}
                placeholder="At least 8 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {notice ? (
              <Text
                accessibilityRole={isConfirmationRequired ? "text" : "alert"}
                style={[
                  styles.notice,
                  isConfirmationRequired ? styles.success : styles.error,
                ]}
              >
                {notice}
              </Text>
            ) : null}

            {isConfirmationRequired ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/sign-in")}
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.buttonText}>Return to log in</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={isDisabled}
                onPress={() => void signUp()}
                style={({ pressed }) => [
                  styles.button,
                  isDisabled && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSigningUp ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.buttonText}>Create account</Text>
                )}
              </Pressable>
            )}

            <Text style={styles.legalNotice}>
              You must be at least 16. By creating an account, you agree to the{" "}
              <Text
                accessibilityRole="link"
                onPress={() => void Linking.openURL(termsUrl)}
                style={styles.link}
              >
                Terms of Service
              </Text>{" "}
              and acknowledge the{" "}
              <Text
                accessibilityRole="link"
                onPress={() => void Linking.openURL(privacyUrl)}
                style={styles.link}
              >
                Privacy Policy
              </Text>
              .
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchCopy}>Already have an account?</Text>
              <Pressable
                accessibilityRole="link"
                disabled={isSigningUp}
                onPress={() => router.replace("/sign-in")}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.switchLink}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  wordmarkRow: {
    minHeight: 68,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  wordmark: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1.5,
  },
  wordmarkAccent: {
    color: colors.purple,
  },
  form: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 42,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 42,
    letterSpacing: -2.5,
    lineHeight: 46,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 32,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  field: {
    gap: 8,
    marginBottom: 18,
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
    paddingHorizontal: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  notice: {
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  error: {
    color: colors.danger,
  },
  success: {
    color: colors.success,
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
  legalNotice: {
    marginTop: 18,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  link: {
    color: colors.purple,
    fontFamily: fonts.semibold,
  },
  switchRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  switchCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  switchLink: {
    color: colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
