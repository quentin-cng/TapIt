import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { AppScreen } from "../../components/AppScreen";
import { ProgressBar } from "../../components/ProgressBar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { formatWeekCount } from "../../domain/weekly-goals";
import { useSession } from "../../auth/SessionProvider";
import { colors, fonts } from "../../theme/tokens";
import { useHomeData } from "./useHomeData";

const activityFormatter = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Montreal",
});

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

export function HomeScreen() {
  const { session } = useSession();
  const { data, error, isLoading, isRefreshing, load, refresh } = useHomeData(
    session!.user.id,
  );

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

  const { profile, recentActivity, weeklyProgress, weeklyStreaks } = data;

  return (
    <AppScreen refreshControl={refreshControl}>
      <View style={styles.greeting}>
        <Text style={styles.greetingPrefix}>{getMontrealGreeting()},</Text>
        <Text accessibilityRole="header" style={styles.greetingName}>
          {resolveDisplayName(profile.display_name, profile.username)}
        </Text>
      </View>

      {data.hasDataError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          Some activity data could not be loaded. Pull down to try again.
        </Text>
      ) : null}

      <View accessibilityLabel="Points and weekly progress" style={styles.hero}>
        <View style={styles.pointsSection}>
          <Text style={styles.sectionLabel}>Total points</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.pointsValue}>
            {profile.total_points}
          </Text>
          <Text style={styles.pointsUnit}>Points</Text>
        </View>

        <View style={styles.weekSection}>
          <View style={styles.weekHeading}>
            <Text style={styles.sectionLabel}>This week</Text>
            {weeklyProgress?.isComplete ? (
              <Text style={styles.completeLabel}>Goal complete</Text>
            ) : null}
          </View>

          {weeklyProgress ? (
            <>
              <View style={styles.weekMetric}>
                <Text style={styles.weekMetricValue}>
                  {weeklyProgress.sessionsCompleted}
                </Text>
                <Text style={styles.weekMetricTarget}>
                  / {weeklyProgress.targetSessions} sessions
                </Text>
              </View>
              <ProgressBar
                label={`${weeklyProgress.sessionsCompleted} of ${weeklyProgress.targetSessions} weekly sessions completed`}
                max={weeklyProgress.targetSessions}
                value={weeklyProgress.sessionsCompleted}
              />
              <Text style={styles.weekNote}>
                {weeklyProgress.isComplete
                  ? "Weekly commitment complete."
                  : `${weeklyProgress.remainingSessions} ${weeklyProgress.remainingSessions === 1 ? "session" : "sessions"} remaining.`}
              </Text>
            </>
          ) : (
            <Text style={styles.unavailableNote}>
              A weekly goal has not been configured for this account.
            </Text>
          )}
        </View>
      </View>

      <View style={styles.activitySection}>
        <View style={styles.activityHeading}>
          <Text style={styles.activityTitle}>Recent activity</Text>
          {recentActivity.length ? (
            <Text style={styles.activityCount}>{recentActivity.length} latest</Text>
          ) : null}
        </View>

        <View style={styles.activityList}>
          {recentActivity.length ? (
            recentActivity.map((checkin, index) => (
              <View
                key={`${checkin.location_id}-${checkin.created_at}`}
                style={styles.activityRow}
              >
                <View style={styles.activityDetails}>
                  <Text numberOfLines={1} style={styles.activityLocation}>
                    {checkin.locationName}
                  </Text>
                  <Text style={styles.activityTime}>
                    {activityFormatter.format(new Date(checkin.created_at))}
                    {index === 0 ? " · Latest" : ""}
                  </Text>
                </View>
                <Text style={styles.activityPoints}>+{checkin.points_awarded}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyTitle}>No check-ins yet</Text>
              <Text style={styles.emptyCopy}>
                Your first rewarded visit will appear here.
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.streakSection}>
        <Text style={styles.sectionLabel}>Weekly streak</Text>
        <Text style={styles.streakValue}>
          {formatWeekCount(weeklyStreaks.currentStreak)}
        </Text>
        <Text style={styles.streakCopy}>
          {weeklyStreaks.currentStreak > 0
            ? "Keep your commitment going."
            : "Complete this week to start your streak."}
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginBottom: 48,
  },
  greetingPrefix: {
    marginBottom: 6,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  greetingName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 48,
    letterSpacing: -3.1,
    lineHeight: 49,
  },
  inlineError: {
    marginBottom: 20,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  hero: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pointsSection: {
    paddingVertical: 42,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  pointsValue: {
    marginTop: 20,
    marginBottom: 10,
    color: colors.textPrimary,
    fontFamily: fonts.extraBold,
    fontSize: 96,
    fontVariant: ["tabular-nums"],
    letterSpacing: -8,
    lineHeight: 98,
  },
  pointsUnit: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  weekSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 38,
  },
  weekHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  completeLabel: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  weekMetric: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 24,
    marginBottom: 18,
  },
  weekMetricValue: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 58,
    fontVariant: ["tabular-nums"],
    letterSpacing: -4,
    lineHeight: 61,
  },
  weekMetricTarget: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 17,
  },
  weekNote: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  unavailableNote: {
    marginTop: 24,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  activitySection: {
    marginTop: 48,
  },
  activityHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  activityTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  activityCount: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  activityList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  activityRow: {
    minHeight: 69,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 15,
  },
  activityDetails: {
    flex: 1,
    gap: 5,
  },
  activityLocation: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  activityTime: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  activityPoints: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  emptyActivity: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptyCopy: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  streakSection: {
    marginTop: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  streakValue: {
    marginTop: 24,
    marginBottom: 12,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -1.7,
  },
  streakCopy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
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
