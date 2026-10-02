import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Inter_700Bold } from "@expo-google-fonts/inter/700Bold";
import { Inter_800ExtraBold } from "@expo-google-fonts/inter/800ExtraBold";
import { useFonts } from "expo-font";
import { router, Stack, SplashScreen, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SessionProvider, useSession } from "../auth/SessionProvider";
import {
  PendingCheckinProvider,
  usePendingCheckin,
} from "../checkin/PendingCheckinProvider";
import { colors, fonts } from "../theme/tokens";

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isRestoring, session } = useSession();
  const { isHydrating, pendingToken } = usePendingCheckin();
  const pathname = usePathname();
  const handoffToken = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingToken) {
      handoffToken.current = null;
      return;
    }

    // Future onboarding can extend this gate without coupling continuation to
    // the sign-in screen or changing pending-token persistence.
    const canContinuePendingCheckin = Boolean(session);

    if (
      isRestoring ||
      isHydrating ||
      !canContinuePendingCheckin ||
      pathname.startsWith("/checkin/") ||
      handoffToken.current === pendingToken
    ) {
      return;
    }

    handoffToken.current = pendingToken;
    router.replace(`/checkin/${pendingToken}`);
  }, [isHydrating, isRestoring, pathname, pendingToken, session]);

  if (isRestoring || isHydrating) {
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

  return (
    <Stack screenOptions={{ contentStyle: styles.stackContent, headerShown: false }}>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      <Stack.Screen name="checkin/[token]" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
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
    <SessionProvider>
      <PendingCheckinProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </PendingCheckinProvider>
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
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
});
