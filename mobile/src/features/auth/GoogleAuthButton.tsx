import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { startGoogleOAuth } from "../../auth/google-oauth";
import { TapPressable } from "../../motion/TapPressable";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";

export function GoogleAuthButton() {
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const launchInFlight = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  async function continueWithGoogle() {
    if (launchInFlight.current) return;

    launchInFlight.current = true;
    setError("");
    setIsBusy(true);

    try {
      const result = await startGoogleOAuth();
      if (isMounted.current && result.status === "error") {
        setError(result.message);
      }
    } finally {
      launchInFlight.current = false;
      if (isMounted.current) setIsBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <TapPressable
        accessibilityLabel="Continue with Google"
        accessibilityRole="button"
        accessibilityState={{ busy: isBusy, disabled: isBusy }}
        disabled={isBusy}
        haptic="press"
        onPress={() => void continueWithGoogle()}
        style={[styles.button, isBusy && styles.disabled]}
      >
        {isBusy ? (
          <ActivityIndicator color={v3Colors.ink} />
        ) : (
          <Text style={styles.buttonText}>Continue with Google</Text>
        )}
      </TapPressable>

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export function AuthMethodDivider() {
  return (
    <View accessibilityElementsHidden style={styles.dividerRow}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>or</Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  button: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#cfc0b0",
    borderRadius: radii.large,
    backgroundColor: "#fffcf6",
    paddingHorizontal: 18,
  },
  buttonText: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  disabled: { opacity: 0.55 },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 24,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    flex: 1,
    backgroundColor: "#ddcfbf",
  },
  dividerText: {
    color: "#8d818d",
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});
