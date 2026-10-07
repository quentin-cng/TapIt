import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppScreen } from "../../components/AppScreen";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { supabase } from "../../lib/supabase";
import { colors, fonts } from "../../theme/tokens";

type RewardsProfile = {
  avatar_id?: string | null;
  total_points: number;
};

const rewardsColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  ink: "#1a1333",
  purple: "#5b3df6",
  lavender: "#f2edff",
  lavenderStrong: "#ddd1f8",
} as const;

export function RewardsScreen() {
  const [profile, setProfile] = useState<RewardsProfile | null>(null);
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

      setProfile(data as RewardsProfile);
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

  const points = profile?.total_points ?? null;
  const formattedPoints =
    points === null ? null : new Intl.NumberFormat("en-CA").format(points);

  return (
    <AppScreen
      backgroundColor={rewardsColors.background}
      showTopbar={false}
      variant="v3"
    >
      <View style={styles.header}>
        <Pressable
          accessibilityHint="Opens your account settings"
          accessibilityLabel="Open Profile"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.push("/profile")}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <TapItAvatar
            avatarId={profile?.avatar_id}
            borderColor={rewardsColors.ink}
            borderWidth={2}
            size={38}
          />
        </Pressable>

        <Text accessibilityRole="header" style={styles.headerTitle}>
          Rewards<Text style={styles.titlePeriod}>.</Text>
        </Text>

        <View
          accessible
          accessibilityLabel={
            formattedPoints === null
              ? isLoading
                ? "Loading lifetime points"
                : "Lifetime points unavailable"
              : `${points} lifetime points`
          }
          style={styles.pointsPill}
        >
          {formattedPoints !== null ? (
            <View style={styles.pointsLine}>
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={styles.pointsValue}
              >
                {formattedPoints}
              </Text>
              <Text style={styles.pointsUnit}>pts</Text>
            </View>
          ) : isLoading ? (
            <View style={styles.pointsSkeleton} />
          ) : (
            <MaterialCommunityIcons
              color={colors.textSecondary}
              name="alert-circle-outline"
              size={17}
            />
          )}
        </View>
      </View>

      <View style={styles.comingSoon}>
        <View accessibilityElementsHidden style={styles.giftSurface}>
          <MaterialCommunityIcons
            color={rewardsColors.purple}
            name="gift-outline"
            size={48}
          />
        </View>
        <Text style={styles.comingSoonTitle}>Coming soon.</Text>
        <Text style={styles.comingSoonCopy}>
          Soon, you’ll be able to use your points to get discounts.
        </Text>

        {error ? (
          <View style={styles.errorState}>
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
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerTitle: {
    position: "absolute",
    right: 92,
    left: 92,
    color: rewardsColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
    letterSpacing: -1,
    textAlign: "center",
  },
  titlePeriod: { color: rewardsColors.purple },
  pointsPill: {
    minWidth: 82,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: rewardsColors.lavenderStrong,
    borderRadius: 17,
    backgroundColor: rewardsColors.lavender,
    paddingHorizontal: 10,
  },
  pointsLine: {
    maxWidth: 112,
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  pointsValue: {
    minWidth: 0,
    flexShrink: 1,
    color: rewardsColors.purple,
    fontFamily: fonts.display,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    lineHeight: 20,
  },
  pointsUnit: {
    color: rewardsColors.purple,
    fontFamily: fonts.semibold,
    fontSize: 9,
  },
  pointsSkeleton: {
    width: 50,
    height: 12,
    borderRadius: 6,
    backgroundColor: rewardsColors.lavenderStrong,
  },
  comingSoon: {
    minHeight: 440,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingBottom: 52,
  },
  giftSurface: {
    width: 108,
    height: 108,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 54,
    backgroundColor: rewardsColors.lavender,
  },
  comingSoonTitle: {
    marginTop: 28,
    color: rewardsColors.ink,
    fontFamily: fonts.display,
    fontSize: 39,
    letterSpacing: -1.4,
    textAlign: "center",
  },
  comingSoonCopy: {
    maxWidth: 310,
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  errorState: {
    alignItems: "center",
    marginTop: 28,
  },
  error: {
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: rewardsColors.purple,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: rewardsColors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  retryButtonPressed: { opacity: 0.76 },
  pressed: { opacity: 0.68 },
});
