import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radii } from "../../theme/tokens";

type OnboardingStepScreenProps = {
  children: ReactNode;
  isBusy?: boolean;
  message: string;
  title: string;
};

export function OnboardingStepScreen({
  children,
  isBusy = false,
  message,
  title,
}: OnboardingStepScreenProps) {
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.wordmark}>
            Tap<Text style={styles.wordmarkAccent}>It</Text>
          </Text>
          <View style={styles.body}>
            <View style={styles.copy}>
              <Text style={styles.kicker}>ACCOUNT SETUP</Text>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={styles.message}>{message}</Text>
            </View>
            {children}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => void signOut()}
            style={({ pressed }) => [
              isBusy && styles.disabled,
              pressed && styles.pressed,
            ]}
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
  wordmark: {
    minHeight: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1.5,
    textAlignVertical: "center",
  },
  wordmarkAccent: {
    color: colors.purple,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 40,
  },
  copy: {
    marginBottom: 30,
  },
  kicker: {
    marginBottom: 12,
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 40,
    letterSpacing: -2.2,
    lineHeight: 43,
  },
  message: {
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  signOut: {
    alignSelf: "flex-start",
    borderRadius: radii.small,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.65,
  },
  disabled: {
    opacity: 0.45,
  },
});
