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
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import { GeneralLeaderboardPrivacyToggle } from "./GeneralLeaderboardPrivacyToggle";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { LeaderboardRankingRow } from "./LeaderboardRankingRow";
import { LeaderboardSegmentedControl } from "./LeaderboardSegmentedControl";
import { LeaderboardYourPlace } from "./LeaderboardYourPlace";
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
  const podiumRows = data.rows.slice(0, 3);

  return (
    <>
      {activeView === "general" ? (
        <View style={styles.everyoneControls}>
          <View style={styles.everyoneCopy}>
            <Text style={styles.everyoneTitle}>Everyone top 100</Text>
            <Text style={styles.everyoneDescription}>
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
          <LeaderboardYourPlace rows={data.rows} />

          <View style={styles.standingsHeading}>
            <Text style={styles.standingsTitle}>Standings</Text>
            <Text style={styles.standingsMeta}>Total points</Text>
          </View>
          <View style={styles.rankingList}>
            {data.rows.map((row) => (
              <LeaderboardRankingRow key={row.key} row={row} />
            ))}
          </View>
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
      colors={[v3Colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={v3Colors.purple}
    />
  );

  return (
    <AppScreen refreshControl={refreshControl} showTopbar={false} variant="v3">
      <Text accessibilityRole="header" style={styles.title}>
        Leaderboard.
      </Text>

      <LeaderboardSegmentedControl
        onChange={setActiveView}
        value={activeView}
      />

      {!data && (isLoading || !error) ? (
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading leaderboard"
            color={v3Colors.purple}
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
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
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
    marginBottom: 16,
    color: v3Colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 36,
    letterSpacing: -2,
    lineHeight: 41,
  },
  everyoneControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  everyoneCopy: {
    minWidth: 0,
    flex: 1,
    gap: 1,
  },
  everyoneTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  everyoneDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  standingsHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 25,
    paddingHorizontal: 2,
  },
  standingsTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  standingsMeta: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  rankingList: {
    marginTop: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 20,
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
    paddingHorizontal: 22,
    paddingVertical: 40,
  },
  emptyInitial: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    backgroundColor: v3Colors.lavenderStrong,
  },
  emptyInitialText: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 22,
  },
  emptyTitle: {
    marginTop: 14,
    color: v3Colors.ink,
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
    opacity: 0.75,
  },
});
