import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { formatPreviousWeekRange } from "../../domain/recap-week";
import {
  getWeeklyRecapMessage,
  type SocialWeeklyStat,
} from "../../domain/social-weekly";
import { colors, fonts, radii } from "../../theme/tokens";
import { useWeeklyRecapData } from "./useWeeklyRecapData";
import { WeeklyRecapSkeleton } from "./WeeklyRecapSkeleton";

type ResultStatus = "hit" | "missed";

const recapColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  ink: "#1a1333",
  purple: "#5b3df6",
  purpleDark: "#24143f",
  lavender: "#f2edff",
  lavenderBorder: "#ddd1f8",
  peach: "#fff0e5",
  peachBorder: "#f3d4bd",
  orange: "#b85d37",
  border: "#eadccd",
} as const;

function RecapHeader() {
  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityHint="Returns to the previous screen"
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={8}
        onPress={goBack}
        style={({ pressed }) => [
          styles.backButton,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          color={recapColors.ink}
          name="arrow-left"
          size={23}
        />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        Recap<Text style={styles.titlePeriod}>.</Text>
      </Text>
      <View style={styles.headerBalance} />
    </View>
  );
}

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
      <View style={styles.avatarWrap}>
        <TapItAvatar avatarId={stat.avatarId} size={38} />
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
        <View style={styles.sectionCopy}>
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
            <TapItAvatar avatarId={stat.avatarId} size={38} />
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
      colors={[recapColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={recapColors.purple}
    />
  );

  if (isLoading && !data) {
    return (
      <AppScreen
        backgroundColor={recapColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <WeeklyRecapSkeleton />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen
        backgroundColor={recapColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <RecapHeader />
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
    <AppScreen
      backgroundColor={recapColors.background}
      refreshControl={refreshControl}
      showTopbar={false}
      variant="v3"
    >
      <RecapHeader />

      <View style={styles.weekHeading}>
        <Text style={styles.eyebrow}>Last week</Text>
        <Text style={styles.weekRange}>
          {formatPreviousWeekRange(data.previousWeekStart)}
        </Text>
      </View>

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
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerTitle: {
    position: "absolute",
    right: 46,
    left: 46,
    color: recapColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
    letterSpacing: -1,
    textAlign: "center",
  },
  titlePeriod: { color: recapColors.purple },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: recapColors.border,
    borderRadius: 19,
    backgroundColor: recapColors.surface,
  },
  headerBalance: { width: 38, height: 38 },
  weekHeading: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  eyebrow: {
    color: recapColors.purple,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  weekRange: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  results: { gap: 14, marginTop: 18 },
  resultSection: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  hitSection: {
    borderColor: recapColors.lavenderBorder,
    backgroundColor: recapColors.lavender,
  },
  missedSection: {
    borderColor: recapColors.peachBorder,
    backgroundColor: recapColors.peach,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    paddingBottom: 13,
  },
  sectionCopy: { minWidth: 0, flex: 1 },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  hitText: { color: recapColors.purple },
  missedText: { color: recapColors.orange },
  sectionTitle: {
    marginTop: 5,
    color: recapColors.ink,
    fontFamily: fonts.display,
    fontSize: 19,
    letterSpacing: -0.45,
  },
  groupCount: {
    fontFamily: fonts.display,
    fontSize: 25,
    fontVariant: ["tabular-nums"],
    lineHeight: 28,
  },
  peopleList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: recapColors.border,
  },
  personRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: recapColors.border,
    paddingVertical: 10,
  },
  currentUserRow: {
    marginHorizontal: -7,
    borderLeftWidth: 2,
    borderLeftColor: recapColors.purple,
    backgroundColor: "rgba(255, 252, 246, 0.62)",
    paddingHorizontal: 7,
  },
  avatarWrap: { position: "relative" },
  statusMark: {
    position: "absolute",
    right: -3,
    bottom: -2,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: recapColors.lavender,
    borderRadius: 8,
    backgroundColor: recapColors.purple,
  },
  statusMarkMissed: {
    borderColor: recapColors.peach,
    backgroundColor: recapColors.orange,
  },
  statusMarkText: {
    color: recapColors.surface,
    fontFamily: fonts.bold,
    fontSize: 8,
    lineHeight: 9,
  },
  statusMarkTextMissed: { color: recapColors.surface },
  identity: { minWidth: 0, flex: 1, gap: 2 },
  identityLine: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  displayName: {
    flexShrink: 1,
    color: recapColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  youLabel: {
    borderRadius: 8,
    backgroundColor: recapColors.purple,
    paddingHorizontal: 5,
    paddingVertical: 2,
    color: recapColors.surface,
    fontFamily: fonts.bold,
    fontSize: 7,
    textTransform: "uppercase",
  },
  progress: { alignItems: "flex-end", gap: 1 },
  progressValue: {
    color: recapColors.ink,
    fontFamily: fonts.display,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
  },
  progressLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyGroup: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: recapColors.border,
    paddingVertical: 17,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  commentary: {
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: recapColors.border,
    paddingVertical: 16,
    color: recapColors.ink,
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 25,
  },
  streakSection: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: recapColors.surface,
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  streakEyebrow: {
    color: recapColors.purple,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  streakTitle: {
    marginTop: 5,
    color: recapColors.ink,
    fontFamily: fonts.display,
    fontSize: 19,
    letterSpacing: -0.5,
  },
  streakList: { marginTop: 11 },
  streakRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: recapColors.border,
    paddingVertical: 10,
  },
  streakIdentity: { minWidth: 0, flex: 1, gap: 2 },
  streakName: {
    color: recapColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  streakValue: {
    color: recapColors.purpleDark,
    fontFamily: fonts.display,
    fontSize: 16,
    fontVariant: ["tabular-nums"],
  },
  errorState: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: recapColors.border,
    paddingTop: 24,
  },
  errorTitle: {
    color: recapColors.ink,
    fontFamily: fonts.display,
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
    backgroundColor: recapColors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: recapColors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
});
