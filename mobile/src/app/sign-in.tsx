import { router } from "expo-router";
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
import { useSession } from "../auth/SessionProvider";
import {
  AuthMethodDivider,
  GoogleAuthButton,
} from "../features/auth/GoogleAuthButton";
import { supabase } from "../lib/supabase";
import { TapPressable } from "../motion/TapPressable";
import { colors, fonts, radii, v3Colors } from "../theme/tokens";

export default function SignInScreen() {
  const { restoreError } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const passwordInput = useRef<TextInput>(null);
  const submissionInFlight = useRef(false);

  async function signIn() {
    if (submissionInFlight.current || !email.trim() || !password) return;

    Keyboard.dismiss();
    submissionInFlight.current = true;
    setAuthError("");
    setIsSigningIn(true);

    try {
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
    } catch {
      setAuthError("We could not log you in. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSigningIn(false);
    }
  }

  const isDisabled = isSigningIn || !email.trim() || !password;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>
              Welcome back<Text style={styles.period}>.</Text>
            </Text>

            <View style={styles.googleMethod}>
              <GoogleAuthButton />
              <AuthMethodDivider />
            </View>

            <View style={styles.fields}>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!isSigningIn}
                  inputMode="email"
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                  placeholder="you@example.com"
                  placeholderTextColor="#9d919f"
                  returnKeyType="next"
                  style={styles.input}
                  value={email}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete="current-password"
                  editable={!isSigningIn}
                  onChangeText={setPassword}
                  onSubmitEditing={() => void signIn()}
                  placeholder="Your password"
                  placeholderTextColor="#9d919f"
                  ref={passwordInput}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
            </View>

            {authError || restoreError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {authError || restoreError}
              </Text>
            ) : null}

            <TapPressable
              accessibilityRole="button"
              accessibilityState={{ busy: isSigningIn, disabled: isDisabled }}
              disabled={isDisabled}
              haptic="press"
              onPress={() => void signIn()}
              style={[styles.button, isDisabled && styles.disabled]}
            >
              {isSigningIn ? (
                <ActivityIndicator color="#fffaf1" />
              ) : (
                <Text style={styles.buttonText}>Sign in</Text>
              )}
            </TapPressable>

            <View style={styles.createAccountRow}>
              <Text style={styles.createAccountCopy}>New to TapIt?</Text>
              <Pressable
                accessibilityRole="link"
                disabled={isSigningIn}
                onPress={() => router.push("/sign-up")}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.createAccountLink}>Create account</Text>
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
    backgroundColor: "#fff8f1",
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
  },
  form: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 43,
    letterSpacing: -2.1,
    lineHeight: 47,
  },
  period: { color: v3Colors.purple },
  googleMethod: { marginTop: 34 },
  fields: { gap: 18 },
  field: {
    gap: 8,
  },
  label: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#ddcfbf",
    borderRadius: 15,
    paddingHorizontal: 16,
    color: v3Colors.ink,
    backgroundColor: "#fffcf6",
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  error: {
    marginTop: 16,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderRadius: radii.large,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 18,
  },
  buttonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  createAccountRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 24,
  },
  createAccountCopy: {
    color: "#746a78",
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  createAccountLink: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
