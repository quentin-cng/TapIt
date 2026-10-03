import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../auth/SessionProvider";
import { isValidCheckinToken } from "../../checkin/checkin-contract";
import { CheckinScreen } from "../../checkin/CheckinScreen";
import { usePendingCheckin } from "../../checkin/PendingCheckinProvider";
import { useOnboarding } from "../../onboarding/OnboardingProvider";
import { fonts } from "../../theme/tokens";

export default function PublicCheckinRoute() {
  const { token: routeToken } = useLocalSearchParams<{
    token?: string | string[];
  }>();
  const { isRestoring, session } = useSession();
  const {
    isComplete: isOnboardingComplete,
    isHydrating: isOnboardingHydrating,
    readiness,
  } = useOnboarding();
  const {
    acknowledgePendingToken,
    isHydrating,
    pendingToken,
    persistPendingToken,
  } = usePendingCheckin();
  const [persistenceError, setPersistenceError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const deferredHandoffKey = useRef<string | null>(null);
  const acknowledgementKey = useRef<string | null>(null);
  const token =
    typeof routeToken === "string" && isValidCheckinToken(routeToken)
      ? routeToken
      : null;

  useEffect(() => {
    if (
      !token ||
      isRestoring ||
      isHydrating ||
      isOnboardingHydrating ||
      (session && isOnboardingComplete) ||
      readiness === "error"
    ) {
      return;
    }

    let isActive = true;
    const destination = session
      ? readiness === "identity-incomplete"
        ? "/onboarding/profile"
        : "/onboarding/weekly-goal"
      : "/sign-in";
    const handoffKey = `${destination}:${token}`;
    if (deferredHandoffKey.current === handoffKey) return;

    deferredHandoffKey.current = handoffKey;
    setPersistenceError("");
    setIsSaving(true);

    void persistPendingToken(token).then((saved) => {
      if (!isActive) return;

      setIsSaving(false);
      if (saved) {
        router.replace(destination);
      } else {
        deferredHandoffKey.current = null;
        setPersistenceError(
          "This check-in could not be saved for later. Please try again.",
        );
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    isHydrating,
    isOnboardingComplete,
    isOnboardingHydrating,
    isRestoring,
    persistPendingToken,
    readiness,
    retryKey,
    session,
    token,
  ]);

  useEffect(() => {
    if (
      !token ||
      isRestoring ||
      isHydrating ||
      isOnboardingHydrating ||
      !session ||
      !isOnboardingComplete ||
      !pendingToken
    ) {
      return;
    }

    let isActive = true;
    const nextAcknowledgementKey = `${pendingToken}:${token}`;
    if (acknowledgementKey.current === nextAcknowledgementKey) return;
    acknowledgementKey.current = nextAcknowledgementKey;

    void (async () => {
      if (pendingToken !== token) {
        const saved = await persistPendingToken(token);
        if (!saved || !isActive) return;
      }

      const acknowledged = await acknowledgePendingToken(token);
      if (isActive && !acknowledged) {
        acknowledgementKey.current = null;
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    acknowledgePendingToken,
    isHydrating,
    isOnboardingComplete,
    isOnboardingHydrating,
    isRestoring,
    pendingToken,
    persistPendingToken,
    session,
    token,
  ]);

  if (
    isRestoring ||
    isHydrating ||
    isOnboardingHydrating ||
    (token &&
      (!session || !isOnboardingComplete) &&
      (isSaving || !persistenceError))
  ) {
    return (
      <RouteState
        loading
        message="Preparing your secure check-in…"
        title="Opening TapIt"
      />
    );
  }

  if (!token) {
    return (
      <RouteState
        actionLabel={session ? "Back to Home" : "Go to sign in"}
        message="This check-in link is malformed. Try the NFC tag again or ask the fitness location for help."
        onAction={() => router.replace(session ? "/" : "/sign-in")}
        title="This TapIt link is invalid."
      />
    );
  }

  if (!session || !isOnboardingComplete) {
    return (
      <RouteState
        actionLabel="Try again"
        message={
          persistenceError ||
          "Sign in is required before you can continue this check-in."
        }
        onAction={() => {
          deferredHandoffKey.current = null;
          setPersistenceError("");
          setIsSaving(true);
          setRetryKey((value) => value + 1);
        }}
        title="We couldn’t continue your check-in."
      />
    );
  }

  return (
    <CheckinScreen
      key={token}
      mode="route"
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace("/");
        }
      }}
      onDone={() => router.replace("/")}
      token={token}
    />
  );
}

function RouteState({
  actionLabel,
  loading = false,
  message,
  onAction,
  title,
}: {
  actionLabel?: string;
  loading?: boolean;
  message: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <Text style={styles.wordmark}>
          Tap<Text style={styles.wordmarkAccent}>It</Text>
        </Text>
        {loading ? (
          <ActivityIndicator color="#9b7af2" size="large" style={styles.loader} />
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <Text accessibilityRole="alert" style={styles.message}>
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.buttonText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111113",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  wordmark: {
    position: "absolute",
    top: 20,
    left: 24,
    color: "#ffffff",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1.5,
  },
  wordmarkAccent: {
    color: "#9b7af2",
  },
  loader: {
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  title: {
    color: "#ffffff",
    fontFamily: fonts.bold,
    fontSize: 37,
    letterSpacing: -2.1,
    lineHeight: 41,
  },
  message: {
    maxWidth: 380,
    marginTop: 17,
    color: "#aaa6b2",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  button: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 11,
    backgroundColor: "#7b52e8",
    paddingHorizontal: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  pressed: {
    opacity: 0.7,
  },
});
