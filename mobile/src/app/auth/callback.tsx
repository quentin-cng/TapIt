import * as Linking from "expo-linking";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { completeGoogleOAuthCallback } from "../../auth/google-oauth";
import { GOOGLE_OAUTH_CALLBACK_URI } from "../../auth/google-oauth-contract";
import { colors, fonts, v3Colors } from "../../theme/tokens";

type CallbackState = "exchanging" | "error" | "complete";

function appendRouteParam(
  searchParams: URLSearchParams,
  name: string,
  value: string | string[] | undefined,
) {
  if (Array.isArray(value)) {
    for (const item of value) searchParams.append(name, item);
  } else if (typeof value === "string") {
    searchParams.append(name, value);
  }
}

export default function GoogleOAuthCallbackScreen() {
  const routeParams = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
  }>();
  const incomingUrl = Linking.useURL();
  const [attempt, setAttempt] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<CallbackState>("exchanging");
  const requestId = useRef(0);

  const callbackUrl = useMemo(() => {
    if (incomingUrl?.startsWith(`${GOOGLE_OAUTH_CALLBACK_URI}?`)) {
      return incomingUrl;
    }

    const searchParams = new URLSearchParams();
    appendRouteParam(searchParams, "code", routeParams.code);
    appendRouteParam(searchParams, "error", routeParams.error);
    const query = searchParams.toString();
    return query
      ? `${GOOGLE_OAUTH_CALLBACK_URI}?${query}`
      : GOOGLE_OAUTH_CALLBACK_URI;
  }, [incomingUrl, routeParams.code, routeParams.error]);

  useEffect(() => {
    const currentRequest = ++requestId.current;

    void completeGoogleOAuthCallback(callbackUrl).then((result) => {
      if (currentRequest !== requestId.current) return;

      if (result.status === "error") {
        setCanRetry(result.retryable);
        setMessage(result.message);
        setState("error");
      } else {
        // SessionProvider and the root coordinator own the destination.
        setState("complete");
      }
    });

    return () => {
      requestId.current += 1;
    };
  }, [attempt, callbackUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {state !== "error" ? (
          <>
            <ActivityIndicator color={v3Colors.purple} size="large" />
            <Text accessibilityRole="header" style={styles.title}>
              Finishing sign in<Text style={styles.period}>.</Text>
            </Text>
            <Text style={styles.message}>
              {state === "complete"
                ? "Opening your TapIt account…"
                : "Securely connecting your Google account…"}
            </Text>
          </>
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              Sign-in unavailable<Text style={styles.period}>.</Text>
            </Text>
            <Text accessibilityRole="alert" style={styles.message}>
              {message}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={
                canRetry
                  ? () => {
                      setMessage("");
                      setState("exchanging");
                      setAttempt((value) => value + 1);
                    }
                  : () => router.replace("/sign-in")
              }
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {canRetry ? "Try again" : "Back to sign in"}
              </Text>
            </Pressable>
            {canRetry ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace("/sign-in")}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text style={styles.secondaryButtonText}>Back to sign in</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8f1" },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  title: {
    marginTop: 22,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 39,
    letterSpacing: -1.8,
    lineHeight: 44,
  },
  period: { color: v3Colors.purple },
  message: {
    maxWidth: 380,
    marginTop: 14,
    color: "#746a78",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 14,
    backgroundColor: v3Colors.ink,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  secondaryButtonText: {
    alignSelf: "center",
    marginTop: 18,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.72 },
});
