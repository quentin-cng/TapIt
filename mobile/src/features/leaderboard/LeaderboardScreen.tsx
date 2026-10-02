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
import { LeaderboardPodium } from "./LeaderboardPodium";
import { LeaderboardRankingRow } from "./LeaderboardRankingRow";
import { LeaderboardSegmentedControl } from "./LeaderboardSegmentedControl";
import {
  type LeaderboardData,
  type LeaderboardView,
  useLeaderboardData,
} from "./useLeaderboardData";

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
  const podiumRows = data.rows.slice(0, 3);
  const remainingRows = data.rows.slice(3);

  return (
    <>
      {activeView === "general" ? (
        <View style={styles.generalControls}>
          <View style={styles.generalCopy}>
            <Text style={styles.generalTitle}>General top 100</Text>
            <Text style={styles.generalDescription}>
              Lifetime points across TapIt
            </Text>
          </View>
          <GeneralLeaderboardPrivacyToggle
            isSaving={isSavingPreference}
            message={preferenceMessage}
            onChange={(value) => void onPreferenceChange(value)}
            value={generalPreference}
          />
        </View>
      ) : null}

      {data.rows.length ? (
        <>
          <LeaderboardPodium rows={podiumRows} />
          <Text style={styles.commentary}>{commentary}</Text>

          {remainingRows.length ? (
            <View style={styles.rankingList}>
              {remainingRows.map((row) => (
                <LeaderboardRankingRow
                  key={row.key}
                  row={row}
                  view={activeView}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyInitial}>
            <Text style={styles.emptyInitialText}>—</Text>
          </View>
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

      <LeaderboardSegmentedControl
        onChange={setActiveView}
        value={activeView}
      />

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
    marginBottom: 17,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -1.8,
    lineHeight: 38,
  },
  generalControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 12,
  },
  generalCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  generalTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  generalDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  commentary: {
    marginTop: 13,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  rankingList: {
    marginTop: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 18,
    borderRadius: radii.large,
    backgroundColor: "#f0ebfc",
    paddingHorizontal: 22,
    paddingVertical: 40,
  },
  emptyInitial: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 31,
    backgroundColor: "#ded3f8",
  },
  emptyInitialText: {
    color: colors.purple,
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  emptyTitle: {
    marginTop: 15,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  emptyCopy: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  note: {
    marginTop: 14,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
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
    marginTop: 24,
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
