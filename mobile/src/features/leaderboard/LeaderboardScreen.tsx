import { useCallback, useState } from "react";
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
import {
  getFriendsLeaderboardCommentary,
  getGeneralLeaderboardCommentary,
} from "../../domain/leaderboard-commentary";
import { colors, fonts, radii } from "../../theme/tokens";
import { GeneralLeaderboardPrivacyToggle } from "./GeneralLeaderboardPrivacyToggle";
import {
  type FriendsLeaderboardRow,
  type GeneralLeaderboardRow,
  type LeaderboardData,
  type LeaderboardView,
  useLeaderboardData,
} from "./useLeaderboardData";

type RankingRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

function LeaderboardRow({
  row,
  view,
}: {
  row: RankingRow;
  view: LeaderboardView;
}) {
  const bestStreak =
    view === "friends" && "bestWeeklyGoalStreak" in row
      ? row.bestWeeklyGoalStreak
      : null;

  return (
    <View style={[styles.row, row.isCurrentUser && styles.currentUserRow]}>
      <Text style={styles.rank}>{row.rank}</Text>
      <View style={styles.user}>
        <View style={styles.identity}>
          <Text numberOfLines={1} style={styles.displayName}>
            {row.displayName}
          </Text>
          {row.username ? (
            <Text numberOfLines={1} style={styles.username}>
              @{row.username}
            </Text>
          ) : null}
        </View>
        {row.isCurrentUser ? <Text style={styles.youLabel}>You</Text> : null}
      </View>
      <View
        style={[
          styles.rowStats,
          view === "general" && styles.generalRowStats,
        ]}
      >
        <Text style={styles.points}>
          {row.totalPoints} <Text style={styles.pointsUnit}>pts</Text>
        </Text>
        {bestStreak !== null ? (
          <Text style={styles.streak}>{bestStreak} wk</Text>
        ) : null}
      </View>
    </View>
  );
}

function LeaderboardContent({
  activeView,
  data,
  generalPreference,
  isSavingPreference,
  onPreferenceChange,
  preferenceMessage,
}: {
  activeView: LeaderboardView;
  data: LeaderboardData;
  generalPreference: boolean;
  isSavingPreference: boolean;
  onPreferenceChange: (value: boolean) => Promise<void>;
  preferenceMessage: {
    status: "success" | "error";
    message: string;
  } | null;
}) {
  const commentaryEntries = data.rows.map((row) => ({
    displayName: row.displayName,
    totalPoints: row.totalPoints,
    isCurrentUser: row.isCurrentUser,
  }));
  const commentary =
    activeView === "friends"
      ? getFriendsLeaderboardCommentary(commentaryEntries)
      : getGeneralLeaderboardCommentary(commentaryEntries);

  return (
    <>
      <Text style={styles.commentary}>{commentary}</Text>

      <View style={styles.heading}>
        <View>
          <Text style={styles.sectionLabel}>
            {activeView === "friends" ? "Your circle" : "General standings"}
          </Text>
          <Text style={styles.sectionTitle}>
            {activeView === "friends" ? "Friends ranking" : "Top 100"}
          </Text>
        </View>
        {activeView === "general" ? (
          <GeneralLeaderboardPrivacyToggle
            isSaving={isSavingPreference}
            message={preferenceMessage}
            onChange={(value) => void onPreferenceChange(value)}
            value={generalPreference}
          />
        ) : null}
      </View>

      <View style={styles.columnLabels}>
        <Text style={styles.rankColumnLabel}>Rank</Text>
        <Text style={styles.userColumnLabel}>Member</Text>
        <View
          style={[
            styles.statColumnLabels,
            activeView === "general" && styles.generalRowStats,
          ]}
        >
          <Text style={styles.columnLabel}>Points</Text>
          {activeView === "friends" ? (
            <Text style={styles.columnLabel}>Best</Text>
          ) : null}
        </View>
      </View>

      {data.rows.length ? (
        <View style={styles.list}>
          {data.rows.map((row) => (
            <LeaderboardRow key={row.key} row={row} view={activeView} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No rankings yet.</Text>
          <Text style={styles.emptyCopy}>
            Points from the first check-in will appear here.
          </Text>
        </View>
      )}

      {activeView === "friends" && data.rows.length === 1 ? (
        <Text style={styles.note}>
          Add friends to turn this into a competition.
        </Text>
      ) : null}
      {activeView === "general" ? (
        <Text style={styles.note}>
          General leaderboard: the top 100 TapIt profiles globally.
        </Text>
      ) : null}
    </>
  );
}

export function LeaderboardScreen() {
  const { session } = useSession();
  const [activeView, setActiveView] = useState<LeaderboardView>("friends");
  const {
    data,
    error,
    generalPreference,
    isLoading,
    isRefreshing,
    isSavingPreference,
    load,
    preferenceMessage,
    refresh,
    updateGeneralPreference,
  } = useLeaderboardData(activeView, session!.user.id);

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

  return (
    <AppScreen refreshControl={refreshControl}>
      <Text accessibilityRole="header" style={styles.title}>
        Leaderboard
      </Text>

      <View accessibilityRole="tablist" style={styles.selector}>
        {(["friends", "general"] as const).map((view) => {
          const selected = activeView === view;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              key={view}
              onPress={() => setActiveView(view)}
              style={({ pressed }) => [
                styles.selectorButton,
                selected && styles.selectorButtonActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.selectorLabel,
                  selected && styles.selectorLabelActive,
                ]}
              >
                {view === "friends" ? "Friends" : "General"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!data && (isLoading || !error) ? (
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading leaderboard"
            color={colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading leaderboard…</Text>
        </View>
      ) : !data ? (
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Leaderboard unavailable
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
      ) : (
        <LeaderboardContent
          activeView={activeView}
          data={data}
          generalPreference={generalPreference}
          isSavingPreference={isSavingPreference}
          onPreferenceChange={updateGeneralPreference}
          preferenceMessage={preferenceMessage}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 24,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 46,
    letterSpacing: -2.8,
    lineHeight: 49,
  },
  selector: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectorButton: {
    flex: 1,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    paddingVertical: 12,
  },
  selectorButtonActive: {
    borderBottomColor: colors.purple,
  },
  selectorLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  selectorLabelActive: {
    color: colors.purple,
  },
  commentary: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 18,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  heading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 16,
    paddingTop: 28,
    paddingBottom: 14,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 5,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  columnLabels: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
  rankColumnLabel: {
    width: 38,
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  userColumnLabel: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  statColumnLabels: {
    width: 112,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  columnLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.7,
    textAlign: "right",
    textTransform: "uppercase",
  },
  list: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  currentUserRow: {
    borderLeftColor: colors.purple,
    backgroundColor: "#f1edfb",
  },
  rank: {
    width: 35,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  user: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  identity: {
    minWidth: 0,
    flexShrink: 1,
    gap: 3,
  },
  displayName: {
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
  rowStats: {
    width: 112,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  generalRowStats: {
    width: 66,
    justifyContent: "flex-end",
  },
  points: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  pointsUnit: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  streak: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  emptyState: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 28,
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
    lineHeight: 18,
  },
  note: {
    marginTop: 16,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
