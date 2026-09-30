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
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { formatPreviousWeekRange } from "../../domain/recap-week";
import {
  getWeeklyRecapMessage,
  type SocialWeeklyStat,
} from "../../domain/social-weekly";
import { colors, fonts, radii } from "../../theme/tokens";
import { useWeeklyRecapData } from "./useWeeklyRecapData";

type ResultStatus = "hit" | "missed";

function RecapPersonRow({
  currentUserId,
  stat,
  status,
}: {
  currentUserId: string;
  stat: SocialWeeklyStat;
  status: ResultStatus;
}) {
  const isCurrentUser = stat.userId === currentUserId;

  return (
    <View style={[styles.personRow, isCurrentUser && styles.currentUserRow]}>
      <View
        accessibilityElementsHidden
        style={[
          styles.statusMark,
          status === "missed" && styles.statusMarkMissed,
        ]}
      >
        <Text
          style={[
            styles.statusMarkText,
            status === "missed" && styles.statusMarkTextMissed,
          ]}
        >
          {status === "hit" ? "✓" : "•"}
        </Text>
      </View>

      <View style={styles.identity}>
        <View style={styles.identityLine}>
          <Text numberOfLines={1} style={styles.displayName}>
            {stat.displayName}
          </Text>
          {isCurrentUser ? <Text style={styles.youLabel}>You</Text> : null}
        </View>
        <Text numberOfLines={1} style={styles.username}>
          @{stat.username}
        </Text>
      </View>

      <View style={styles.progress}>
        <Text style={styles.progressValue}>
          {stat.previousSessions} / {stat.previousGoal}
        </Text>
        <Text style={styles.progressLabel}>Sessions</Text>
      </View>
    </View>
  );
}

function ResultSection({
  currentUserId,
  emptyMessage,
  stats,
  status,
}: {
  currentUserId: string;
  emptyMessage: string;
  stats: SocialWeeklyStat[];
  status: ResultStatus;
}) {
  const isHit = status === "hit";

  return (
    <View
      style={[
        styles.resultSection,
        isHit ? styles.hitSection : styles.missedSection,
      ]}
    >
      <View style={styles.sectionHeading}>
        <View>
          <Text
            style={[
              styles.sectionLabel,
              isHit ? styles.hitText : styles.missedText,
            ]}
          >
            {isHit ? "Goals hit" : "Missed"}
          </Text>
          <Text style={styles.sectionTitle}>
            {isHit ? "Commitments completed" : "Goals not reached"}
          </Text>
        </View>
        <Text
          accessibilityLabel={`${stats.length} ${isHit ? "goals hit" : "goals missed"}`}
          style={[
            styles.groupCount,
            isHit ? styles.hitText : styles.missedText,
          ]}
        >
          {stats.length}
        </Text>
      </View>

      {stats.length ? (
        <View style={styles.peopleList}>
          {stats.map((stat) => (
            <RecapPersonRow
              currentUserId={currentUserId}
              key={stat.userId}
              stat={stat}
              status={status}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyGroup}>{emptyMessage}</Text>
      )}
    </View>
  );
}

function BestStreakSection({ stats }: { stats: SocialWeeklyStat[] }) {
  const streakValue = stats[0]?.bestWeeklyGoalStreak ?? 0;

  if (streakValue <= 0) return null;

  return (
    <View style={styles.streakSection}>
      <Text style={styles.streakEyebrow}>All-time consistency</Text>
      <Text style={styles.streakTitle}>Best weekly-goal streak</Text>
      <View style={styles.streakList}>
        {stats.map((stat) => (
          <View key={stat.userId} style={styles.streakRow}>
            <View style={styles.streakIdentity}>
              <Text numberOfLines={1} style={styles.streakName}>
                {stat.displayName}
              </Text>
              <Text numberOfLines={1} style={styles.username}>
                @{stat.username}
              </Text>
            </View>
            <Text style={styles.streakValue}>
              {streakValue} {streakValue === 1 ? "week" : "weeks"}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function WeeklyRecapScreen() {
  const { session } = useSession();
  const { data, error, isLoading, isRefreshing, load, refresh } =
    useWeeklyRecapData(session!.user.id);

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
            accessibilityLabel="Loading weekly recap"
            color={colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading weekly recap…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl}>
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Recap unavailable
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

  const hasGoalResults =
    data.recap.goalsHit.length > 0 || data.recap.goalsMissed.length > 0;

  return (
    <AppScreen refreshControl={refreshControl}>
      <Text style={styles.eyebrow}>Last week</Text>
      <Text accessibilityRole="header" style={styles.title}>
        Weekly Recap
      </Text>
      <Text style={styles.weekRange}>
        {formatPreviousWeekRange(data.previousWeekStart)}
      </Text>

      {hasGoalResults ? (
        <View style={styles.results}>
          <ResultSection
            currentUserId={data.currentUser.userId}
            emptyMessage="No completed goals this week."
            stats={data.recap.goalsHit}
            status="hit"
          />
          <ResultSection
            currentUserId={data.currentUser.userId}
            emptyMessage="Everyone with a goal made it."
            stats={data.recap.goalsMissed}
            status="missed"
          />
        </View>
      ) : null}

      <Text style={styles.commentary}>
        {getWeeklyRecapMessage(data.recap)}
      </Text>

      <BestStreakSection stats={data.recap.bestStreak} />
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
    marginTop: 7,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 46,
    letterSpacing: -2.8,
    lineHeight: 49,
  },
  weekRange: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  results: {
    gap: 18,
    marginTop: 32,
  },
  resultSection: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  hitSection: {
    borderColor: "#bddfc9",
    backgroundColor: "#f5fbf7",
  },
  missedSection: {
    borderColor: "#edc8ce",
    backgroundColor: "#fff7f8",
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 14,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  hitText: {
    color: colors.success,
  },
  missedText: {
    color: colors.danger,
  },
  sectionTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.45,
  },
  groupCount: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
  },
  peopleList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  personRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 11,
  },
  currentUserRow: {
    borderLeftWidth: 3,
    borderLeftColor: colors.purple,
    backgroundColor: "#f1edfb",
    paddingLeft: 7,
  },
  statusMark: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#e8f4ed",
  },
  statusMarkMissed: {
    backgroundColor: "#f9e9ec",
  },
  statusMarkText: {
    color: colors.success,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  statusMarkTextMissed: {
    color: colors.danger,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  identityLine: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  displayName: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  youLabel: {
    borderRadius: radii.small,
    backgroundColor: colors.purple,
    paddingHorizontal: 6,
    paddingVertical: 3,
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 8,
    textTransform: "uppercase",
  },
  progress: {
    alignItems: "flex-end",
    gap: 2,
  },
  progressValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  progressLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  emptyGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 18,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  commentary: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 18,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  streakSection: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 20,
  },
  streakEyebrow: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  streakTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  streakList: {
    marginTop: 14,
  },
  streakRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 11,
  },
  streakIdentity: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  streakName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  streakValue: {
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
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
    borderRadius: radii.small,
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
