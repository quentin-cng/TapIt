import { DMSerifDisplay_400Regular } from "@expo-google-fonts/dm-serif-display/400Regular";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_800ExtraBold } from "@expo-google-fonts/inter/800ExtraBold";
import { useFonts } from "expo-font";
import { router, Stack, SplashScreen, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SessionProvider, useSession } from "../auth/SessionProvider";
import {
  PendingCheckinProvider,
  usePendingCheckin,
} from "../checkin/PendingCheckinProvider";
import { supabase } from "../lib/supabase";
import {
  OnboardingProvider,
  useOnboarding,
} from "../onboarding/OnboardingProvider";
import { RewardEventProvider } from "../motion/RewardEventProvider";
import { colors, fonts } from "../theme/tokens";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isRestoring, session } = useSession();
  const { isHydrating, pendingToken } = usePendingCheckin();
  const {
    error: onboardingError,
    isComplete: isOnboardingComplete,
    isHydrating: isOnboardingHydrating,
    readiness,
    refresh: refreshOnboarding,
  } = useOnboarding();
  const pathname = usePathname();
  const handoffToken = useRef<string | null>(null);

  useEffect(() => {
    if (
      isRestoring ||
      isHydrating ||
      isOnboardingHydrating ||
      onboardingError ||
      !session ||
      pathname.startsWith("/checkin/")
    ) {
      return;
    }

    if (!isOnboardingComplete) {
      const destination =
        readiness === "identity-incomplete"
          ? "/onboarding/profile"
          : "/onboarding/weekly-goal";

      if (pathname !== destination) router.replace(destination);
      return;
    }

    if (pathname.startsWith("/onboarding/") && !pendingToken) {
      router.replace("/");
    }
  }, [
    isHydrating,
    isOnboardingComplete,
    isOnboardingHydrating,
    isRestoring,
    onboardingError,
    pathname,
    pendingToken,
    readiness,
    session,
  ]);

  useEffect(() => {
    if (!pendingToken) {
      handoffToken.current = null;
      return;
    }

    const canContinuePendingCheckin =
      Boolean(session) && isOnboardingComplete;

    if (
      isRestoring ||
      isHydrating ||
      isOnboardingHydrating ||
      Boolean(onboardingError) ||
      !canContinuePendingCheckin ||
      pathname.startsWith("/checkin/") ||
      handoffToken.current === pendingToken
    ) {
      return;
    }

    handoffToken.current = pendingToken;
    router.replace(`/checkin/${pendingToken}`);
  }, [
    isHydrating,
    isOnboardingComplete,
    isOnboardingHydrating,
    isRestoring,
    onboardingError,
    pathname,
    pendingToken,
    session,
  ]);

  if (isRestoring || isHydrating || isOnboardingHydrating) {
    return (
      <View style={styles.restoring}>
        <ActivityIndicator
          accessibilityLabel="Restoring session"
          color={colors.purple}
          size="large"
        />
        <Text style={styles.restoringText}>Opening TapIt…</Text>
      </View>
    );
  }

  if (session && onboardingError) {
    return (
      <View style={styles.readinessError}>
        <Text accessibilityRole="header" style={styles.errorTitle}>
          We couldn’t open your account.
        </Text>
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {onboardingError}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void refreshOnboarding()}
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => void supabase.auth.signOut()}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.errorSignOut}>Log out</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ contentStyle: styles.stackContent, headerShown: false }}>
      <Stack.Protected guard={Boolean(session) && isOnboardingComplete}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session) && !isOnboardingComplete}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
      <Stack.Screen name="checkin/[token]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSerifDisplay_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      void SplashScreen.hideAsync();
    }
  }, [fontError, fontsLoaded]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SessionProvider>
        <RewardEventProvider>
          <PendingCheckinProvider>
            <OnboardingProvider>
              <StatusBar style="dark" />
              <RootNavigator />
            </OnboardingProvider>
          </PendingCheckinProvider>
        </RewardEventProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: colors.background,
  },
  restoring: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.background,
  },
  restoringText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  readinessError: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.display,
    fontSize: 26,
    letterSpacing: -1.2,
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 160,
    minHeight: 48,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  errorSignOut: {
    marginTop: 16,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.72,
  },
});
