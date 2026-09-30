import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "../../../components/AppScreen";
import { useSession } from "../../../auth/SessionProvider";
import { supabase } from "../../../lib/supabase";
import { colors, fonts, radii } from "../../../theme/tokens";

export default function ProfileScreen() {
  const { session } = useSession();
  const [error, setError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function signOut() {
    setError("");
    setIsSigningOut(true);
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError("We could not log you out. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Your account</Text>
        <Text accessibilityRole="header" style={styles.title}>
          Profile
        </Text>
        {session?.user.email ? (
          <Text style={styles.email}>{session.user.email}</Text>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.copy}>
          The complete native Profile experience will be added in a later milestone.
        </Text>

        {__DEV__ ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/dev-checkin")}
            style={({ pressed }) => [
              styles.developmentButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.developmentButtonText}>Open check-in tester</Text>
          </Pressable>
        ) : null}

        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          {isSigningOut ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={styles.logoutText}>Log out</Text>
          )}
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 36,
  },
  eyebrow: {
    marginBottom: 8,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 42,
    letterSpacing: -2,
    lineHeight: 44,
  },
  email: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  section: {
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  developmentButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: radii.medium,
    paddingHorizontal: 16,
  },
  developmentButtonText: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  logoutButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    paddingHorizontal: 16,
  },
  logoutText: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
