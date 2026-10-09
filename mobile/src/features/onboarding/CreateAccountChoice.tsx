import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import {
  AuthMethodDivider,
  GoogleAuthButton,
} from "../auth/GoogleAuthButton";
import { TapPressable } from "../../motion/TapPressable";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const termsUrl = "https://tap-it-pied.vercel.app/terms";
const privacyUrl = "https://tap-it-pied.vercel.app/privacy";

export type CreateAccountCredentials = {
  email: string;
  password: string;
};

export type CreateAccountSubmissionResult =
  | { status: "complete" }
  | { message: string; status: "confirmation-required" | "error" };

type CreateAccountChoiceProps = {
  onBack?: () => void;
  onSignIn: () => void;
  onSubmit: (
    credentials: CreateAccountCredentials,
  ) => Promise<CreateAccountSubmissionResult>;
  preview?: boolean;
};

export function CreateAccountChoice({
  onBack,
  onSignIn,
  onSubmit,
  preview = false,
}: CreateAccountChoiceProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isConfirmationRequired, setIsConfirmationRequired] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordInput = useRef<TextInput>(null);
  const submissionInFlight = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  async function submit() {
    if (submissionInFlight.current) return;

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

    Keyboard.dismiss();
    submissionInFlight.current = true;
    setIsSubmitting(true);

    try {
      const result = await onSubmit({
        email: normalizedEmail,
        password,
      });

      if (!isMounted.current) return;

      if (result.status === "error") {
        setNotice(result.message);
        return;
      }

      if (result.status === "confirmation-required") {
        setPassword("");
        setIsConfirmationRequired(true);
        setNotice(result.message);
      }
    } catch {
      if (isMounted.current) {
        setNotice("We could not create your account. Please try again.");
      }
    } finally {
      submissionInFlight.current = false;
      if (isMounted.current) setIsSubmitting(false);
    }
  }

  const isDisabled = isSubmitting || !email.trim() || !password;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          {onBack ? (
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              disabled={isSubmitting}
              hitSlop={10}
              onPress={onBack}
              style={({ pressed }) => [
                styles.headerButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                color={v3Colors.ink}
                name="arrow-left"
                size={24}
              />
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
          {preview ? <Text style={styles.previewLabel}>DEV PREVIEW</Text> : null}
        </View>

        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>
              Create your account<Text style={styles.period}>.</Text>
            </Text>

            {!preview ? (
              <View style={styles.googleMethod}>
                <GoogleAuthButton />
                <AuthMethodDivider />
              </View>
            ) : null}

            <View
              style={[styles.fields, !preview && styles.fieldsAfterGoogle]}
            >
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  editable={!isSubmitting && !isConfirmationRequired}
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
                  autoComplete="new-password"
                  editable={!isSubmitting && !isConfirmationRequired}
                  onChangeText={setPassword}
                  onSubmitEditing={() => void submit()}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9d919f"
                  ref={passwordInput}
                  returnKeyType="done"
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
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
              <TapPressable
                accessibilityRole="button"
                haptic="press"
                onPress={onSignIn}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>Return to sign in</Text>
              </TapPressable>
            ) : (
              <TapPressable
                accessibilityRole="button"
                accessibilityState={{ busy: isSubmitting, disabled: isDisabled }}
                disabled={isDisabled}
                haptic="press"
                onPress={() => void submit()}
                style={[styles.primaryButton, isDisabled && styles.disabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fffaf1" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create account</Text>
                )}
              </TapPressable>
            )}

            <Text style={styles.legalNotice}>
              You must be at least 16. By continuing, you agree to TapIt’s{" "}
              <Text
                accessibilityRole="link"
                onPress={() => void Linking.openURL(termsUrl)}
                style={styles.legalLink}
              >
                Terms of Service
              </Text>{" "}
              and acknowledge the{" "}
              <Text
                accessibilityRole="link"
                onPress={() => void Linking.openURL(privacyUrl)}
                style={styles.legalLink}
              >
                Privacy Policy
              </Text>
              .
            </Text>

            <View style={styles.signInRow}>
              <Text style={styles.signInCopy}>Already have an account?</Text>
              <Pressable
                accessibilityRole="link"
                disabled={isSubmitting}
                onPress={onSignIn}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.signInLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8f1" },
  keyboardView: { flex: 1 },
  header: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
  },
  form: { width: "100%", maxWidth: 480, alignSelf: "center" },
  title: {
    maxWidth: 340,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 43,
    letterSpacing: -2.1,
    lineHeight: 47,
  },
  period: { color: v3Colors.purple },
  googleMethod: { marginTop: 34 },
  fields: { gap: 18, marginTop: 38 },
  fieldsAfterGoogle: { marginTop: 0 },
  field: { gap: 8 },
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
  notice: {
    marginTop: 16,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  error: { color: colors.danger },
  success: { color: colors.success },
  primaryButton: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderRadius: radii.large,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  legalNotice: {
    marginTop: 16,
    color: "#8d818f",
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  legalLink: {
    color: v3Colors.purple,
    fontFamily: fonts.semibold,
  },
  signInRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 24,
  },
  signInCopy: {
    color: "#746a78",
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  signInLink: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
});
