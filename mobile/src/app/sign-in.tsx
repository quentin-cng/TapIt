import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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
import { useSession } from "../auth/SessionProvider";
import { supabase } from "../lib/supabase";
import { colors, fonts, radii } from "../theme/tokens";

export default function SignInScreen() {
  const { restoreError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  async function signIn() {
    setAuthError("");
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      const normalizedMessage = error.message.toLowerCase();
      setAuthError(
        normalizedMessage.includes("invalid login credentials")
          ? "Email or password is incorrect."
          : normalizedMessage.includes("email not confirmed")
            ? "Confirm your email before logging in."
          : "We could not log you in. Please try again.",
      );
    } else {
      setPassword("");
    }

    setIsSigningIn(false);
  }

  const isDisabled = isSigningIn || !email.trim() || !password;

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
              Log in
            </Text>
            <Text style={styles.subtitle}>Use your existing TapIt account.</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                editable={!isSigningIn}
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
                autoComplete="current-password"
                editable={!isSigningIn}
                onChangeText={setPassword}
                onSubmitEditing={() => void signIn()}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={styles.input}
                value={password}
              />
            </View>

            {authError || restoreError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {authError || restoreError}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={isDisabled}
              onPress={() => void signIn()}
              style={({ pressed }) => [
                styles.button,
                isDisabled && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isSigningIn ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.buttonText}>Log in</Text>
              )}
            </Pressable>

            <View style={styles.switchRow}>
              <Text style={styles.switchCopy}>New to TapIt?</Text>
              <Pressable
                accessibilityRole="link"
                disabled={isSigningIn}
                onPress={() => router.push("/sign-up")}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.switchLink}>Create account</Text>
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
    paddingVertical: 48,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 46,
    letterSpacing: -2.8,
    lineHeight: 49,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: 36,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
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
  error: {
    marginBottom: 16,
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
