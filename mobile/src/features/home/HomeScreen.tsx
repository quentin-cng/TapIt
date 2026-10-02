import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { SessionDots } from "../../components/consistency/SessionDots";
import { StreakFlame } from "../../components/consistency/StreakFlame";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii } from "../../theme/tokens";
import { useHomeData } from "./useHomeData";

function getMontrealGreeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-CA", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Montreal",
    }).format(new Date()),
  );

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getSafeInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase("en-CA") ?? "T";
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
      colors={[colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={colors.purple}
    />
  );

  if (isLoading && !data) {
    return (
      <AppScreen refreshControl={refreshControl}>
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading Home"
            color={colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading your week…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl}>
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Home unavailable
          </Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
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
      <Text style={styles.accountInitial}>{getSafeInitial(displayName)}</Text>
    </Pressable>
  );

  return (
    <AppScreen
      refreshControl={refreshControl}
      topbarAccessory={accountControl}
    >
      <View style={styles.greeting}>
        <Text style={styles.greetingPrefix}>{getMontrealGreeting()},</Text>
        <Text accessibilityRole="header" style={styles.greetingName}>
          {displayName}.
        </Text>
      </View>

      {data.hasPersonalDataError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          Some weekly data could not be loaded. Pull down to try again.
        </Text>
      ) : null}

      <Pressable
        accessibilityHint="Opens the Rewards coming soon page"
        accessibilityLabel={`${profile.total_points} points. View Rewards.`}
        accessibilityRole="button"
        onPress={() => router.push("/rewards")}
        style={({ pressed }) => [
          styles.rewardsSurface,
          pressed && styles.rewardsSurfacePressed,
        ]}
      >
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.pointsValue}>
          {profile.total_points}
        </Text>
        <Text style={styles.pointsLabel}>Points</Text>
        <View style={styles.rewardsFooter}>
          <Text style={styles.rewardsCopy}>Rewards are coming.</Text>
          <View style={styles.rewardsAction}>
            <Text style={styles.rewardsLink}>View Rewards →</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.weekSection}>
        <Text style={styles.sectionLabel}>This week</Text>
        {weeklyProgress ? (
          <>
            <Text style={styles.weekMetric}>
              {weeklyProgress.sessionsCompleted} / {weeklyProgress.targetSessions}
            </Text>
            <SessionDots
              completed={weeklyProgress.sessionsCompleted}
              target={weeklyProgress.targetSessions}
            />
            <Text style={styles.weekCopy}>
              {weeklyProgress.isComplete
                ? "Commitment complete.\nKeep showing up."
                : `${weeklyProgress.remainingSessions} more ${weeklyProgress.remainingSessions === 1 ? "session" : "sessions"}.\nShow up.`}
            </Text>
          </>
        ) : (
          <View style={styles.noGoalState}>
            <Text style={styles.noGoalTitle}>No weekly goal yet.</Text>
            <Text style={styles.noGoalCopy}>
              Set your weekly commitment from Profile.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.streakSection}>
        <StreakFlame
          message={
            weeklyStreaks.currentStreak > 0
              ? "Keep it alive."
              : "Complete your weekly goal to start."
          }
          streak={weeklyStreaks.currentStreak}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  accountControl: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  accountControlPressed: {
    borderColor: colors.purple,
    opacity: 0.7,
  },
  accountInitial: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  greeting: {
    marginTop: 2,
    marginBottom: 22,
  },
  greetingPrefix: {
    marginBottom: 3,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  greetingName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -1.9,
    lineHeight: 37,
  },
  inlineError: {
    marginBottom: 18,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  rewardsSurface: {
    minHeight: 202,
    borderRadius: radii.large,
    backgroundColor: "#ece6fb",
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  rewardsSurfacePressed: {
    opacity: 0.92,
  },
  pointsValue: {
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 78,
    fontVariant: ["tabular-nums"],
    letterSpacing: -5.5,
    lineHeight: 80,
  },
  pointsLabel: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  rewardsFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 26,
  },
  rewardsCopy: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
  rewardsAction: {
    borderRadius: 999,
    backgroundColor: colors.purple,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  rewardsLink: {
    color: colors.surface,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  weekSection: {
    marginTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 21,
  },
  weekMetric: {
    marginTop: 15,
    marginBottom: 15,
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 51,
    fontVariant: ["tabular-nums"],
    letterSpacing: -3.6,
    lineHeight: 54,
  },
  weekCopy: {
    marginTop: 15,
    color: colors.textPrimary,
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  noGoalState: {
    marginTop: 22,
  },
  noGoalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  noGoalCopy: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  streakSection: {
    marginTop: 28,
    borderRadius: radii.large,
    backgroundColor: "#fff0df",
    paddingHorizontal: 20,
    paddingVertical: 17,
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
    color: colors.textPrimary,
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
    borderRadius: 6,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.75,
  },
});
