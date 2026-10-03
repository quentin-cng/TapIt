import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { SessionDots } from "../../components/consistency/SessionDots";
import { StreakFlame } from "../../components/consistency/StreakFlame";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import { useHomeData } from "./useHomeData";

function getProfileInitials(name: string) {
  const words = name.trim().split(/\s+/u).filter(Boolean);

  if (words.length > 1) {
    return `${Array.from(words[0])[0] ?? ""}${Array.from(words.at(-1) ?? "")[0] ?? ""}`.toLocaleUpperCase(
      "en-CA",
    );
  }

  return Array.from(words[0] ?? "T")
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("en-CA");
}

export function HomeScreen() {
  const { session } = useSession();
  const userId = session!.user.id;
  const { data, error, isLoading, isRefreshing, load, refresh } =
    useHomeData(userId);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refreshControl = (
    <RefreshControl
      colors={[v3Colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={v3Colors.purple}
    />
  );

  if (isLoading && !data) {
    return (
      <AppScreen refreshControl={refreshControl} variant="v3">
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading Home"
            color={v3Colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading your week…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl} variant="v3">
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Home unavailable
          </Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const { profile, weeklyProgress, weeklyStreaks } = data;
  const displayName = resolveDisplayName(
    profile.display_name,
    profile.username,
  );
  const formattedPoints = new Intl.NumberFormat("en-CA").format(
    profile.total_points,
  );
  const accountControl = (
    <Pressable
      accessibilityLabel="Open Profile"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => router.push("/profile")}
      style={({ pressed }) => [
        styles.accountControl,
        pressed && styles.accountControlPressed,
      ]}
    >
      <Text style={styles.accountInitials}>
        {getProfileInitials(displayName)}
      </Text>
    </Pressable>
  );

  return (
    <AppScreen
      refreshControl={refreshControl}
      topbarAccessory={accountControl}
      variant="v3"
    >
      {data.hasPersonalDataError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          Some weekly data could not be loaded. Pull down to try again.
        </Text>
      ) : null}

      <View style={styles.pointsHero}>
        <Text style={styles.pointsLabel}>Your points</Text>
        <Text
          accessibilityLabel={`${profile.total_points} points`}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={styles.pointsValue}
        >
          {formattedPoints}
        </Text>
        <Pressable
          accessibilityHint="Opens the Rewards coming soon page"
          accessibilityRole="button"
          onPress={() => router.push("/rewards")}
          style={({ pressed }) => [
            styles.rewardsButton,
            pressed && styles.rewardsButtonPressed,
          ]}
        >
          <Text style={styles.rewardsButtonText}>View rewards</Text>
          <MaterialCommunityIcons
            color={colors.surface}
            name="arrow-right"
            size={17}
          />
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.weekSection}>
        <View style={styles.weekHeader}>
          <Text style={styles.sectionTitle}>Weekly goal</Text>
          <Pressable
            accessibilityHint="Opens Profile where you can change your weekly goal"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [
              styles.editGoal,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.editGoalText}>Edit</Text>
            <MaterialCommunityIcons
              color={v3Colors.purple}
              name="pencil-outline"
              size={15}
            />
          </Pressable>
        </View>

        {weeklyProgress ? (
          <>
            <View style={styles.weekSummary}>
              <Text style={styles.visitsValue}>
                {weeklyProgress.sessionsCompleted}
                <Text style={styles.visitsTarget}>
                  {" "}/ {weeklyProgress.targetSessions} visits
                </Text>
              </Text>
              <Text
                style={[
                  styles.remaining,
                  weeklyProgress.isComplete && styles.goalComplete,
                ]}
              >
                {weeklyProgress.isComplete
                  ? "Goal complete"
                  : `${weeklyProgress.remainingSessions} to go`}
              </Text>
            </View>
            <View style={styles.progressDots}>
              <SessionDots
                completed={weeklyProgress.sessionsCompleted}
                target={weeklyProgress.targetSessions}
                variant="v3"
              />
            </View>
          </>
        ) : (
          <View style={styles.noGoalState}>
            <Text style={styles.noGoalTitle}>No weekly goal yet.</Text>
            <Text style={styles.noGoalCopy}>
              Use Edit to set your weekly commitment in Profile.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.streakCard}>
        <StreakFlame
          message={
            weeklyStreaks.currentStreak > 0
              ? "Keep it alive this week."
              : "Complete your goal to start one."
          }
          streak={weeklyStreaks.currentStreak}
          variant="v3"
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  accountControl: {
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: v3Colors.lavenderStrong,
    paddingHorizontal: 8,
  },
  accountControlPressed: {
    opacity: 0.68,
  },
  accountInitials: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  inlineError: {
    marginBottom: 16,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  pointsHero: {
    alignItems: "center",
    paddingTop: 8,
  },
  pointsLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  pointsValue: {
    maxWidth: "100%",
    marginTop: 2,
    color: v3Colors.purple,
    fontFamily: fonts.extraBold,
    fontSize: 104,
    fontVariant: ["tabular-nums"],
    letterSpacing: -7.2,
    lineHeight: 108,
    textAlign: "center",
  },
  rewardsButton: {
    minHeight: 42,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: v3Colors.purple,
    paddingHorizontal: 20,
  },
  rewardsButtonPressed: {
    backgroundColor: v3Colors.purpleDark,
    opacity: 0.92,
  },
  rewardsButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 31,
    backgroundColor: colors.border,
  },
  weekSection: {
    paddingTop: 19,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
    letterSpacing: -0.35,
  },
  editGoal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  editGoalText: {
    color: v3Colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  weekSummary: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 16,
  },
  visitsValue: {
    minWidth: 0,
    flexShrink: 1,
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 29,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1.2,
  },
  visitsTarget: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0,
  },
  remaining: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  goalComplete: {
    color: v3Colors.purple,
    fontFamily: fonts.semibold,
  },
  progressDots: {
    marginTop: 15,
  },
  noGoalState: {
    marginTop: 16,
  },
  noGoalTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  noGoalCopy: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  streakCard: {
    marginTop: 27,
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  loadingState: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  errorState: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  errorTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -1.2,
  },
  errorCopy: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 20,
    borderRadius: radii.small,
    backgroundColor: v3Colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
