import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AppScreen } from "../../components/AppScreen";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radii } from "../../theme/tokens";

type RewardsProfile = {
  total_points: number;
};

function returnHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

export function RewardsScreen() {
  const [points, setPoints] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setError("");
    setIsLoading(true);

    try {
      const { data, error: profileError } = await supabase
        .rpc("get_my_profile")
        .single();

      if (profileError || !data) throw profileError ?? new Error("No profile");
      if (currentRequest !== requestId.current) return;

      setPoints((data as RewardsProfile).total_points);
    } catch (loadError) {
      console.error("[mobile rewards] profile load failed", loadError);
      if (currentRequest === requestId.current) {
        setError("Your points could not be loaded. Please try again.");
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        requestId.current += 1;
      };
    }, [load]),
  );

  const returnControl = (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={returnHome}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Text style={styles.returnText}>Back</Text>
    </Pressable>
  );

  return (
    <AppScreen topbarAccessory={returnControl}>
      <Text style={styles.eyebrow}>Rewards</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Your consistency will pay off.
      </Text>

      <View style={styles.pointsBlock}>
        {isLoading && points === null ? (
          <ActivityIndicator
            accessibilityLabel="Loading points"
            color={colors.purple}
            size="large"
          />
        ) : points !== null ? (
          <>
            <Text adjustsFontSizeToFit numberOfLines={1} style={styles.points}>
              {points}
            </Text>
            <Text style={styles.pointsLabel}>Points earned</Text>
          </>
        ) : (
          <View>
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void load()}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
            >
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonLabel}>Coming soon</Text>
        <Text style={styles.comingSoonTitle}>Rewards are on the way.</Text>
        <Text style={styles.comingSoonCopy}>
          Points you earn today will count when TapIt Rewards launches. Keep
          showing up in the meantime.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    maxWidth: 330,
    marginTop: 8,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 39,
    letterSpacing: -2.3,
    lineHeight: 43,
  },
  pointsBlock: {
    minHeight: 178,
    justifyContent: "center",
    marginTop: 42,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 28,
  },
  points: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 72,
    fontVariant: ["tabular-nums"],
    letterSpacing: -5.5,
    lineHeight: 74,
  },
  pointsLabel: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  comingSoon: {
    marginTop: 44,
  },
  comingSoonLabel: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  comingSoonTitle: {
    marginTop: 12,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 23,
    letterSpacing: -0.8,
  },
  comingSoonCopy: {
    maxWidth: 340,
    marginTop: 11,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  returnText: {
    color: colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 16,
    borderRadius: radii.small,
    backgroundColor: colors.purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  pressed: {
    opacity: 0.55,
  },
});
