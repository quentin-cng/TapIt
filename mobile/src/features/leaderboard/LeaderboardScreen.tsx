import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { colors, fonts, radii } from "../../theme/tokens";
import { PenguinProfileArtwork } from "../home/HomeArtwork";
import { GeneralLeaderboardPrivacyToggle } from "./GeneralLeaderboardPrivacyToggle";
import { LeaderboardPodium } from "./LeaderboardPodium";
import { LeaderboardRankingRow } from "./LeaderboardRankingRow";
import { LeaderboardSegmentedControl } from "./LeaderboardSegmentedControl";
import { LeaderboardSkeleton } from "./LeaderboardSkeleton";
import { LeaderboardYourPlace } from "./LeaderboardYourPlace";
import {
  type LeaderboardData,
  type LeaderboardView,
  useLeaderboardData,
} from "./useLeaderboardData";

const leaderboardColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  ink: "#1a1333",
  purple: "#5b3df6",
  border: "#eadccd",
} as const;

function LeaderboardHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityHint="Opens your account settings"
        accessibilityLabel="Open Profile"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <PenguinProfileArtwork />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        Leaderboard<Text style={styles.titlePeriod}>.</Text>
      </Text>
      <View style={styles.headerBalance} />
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
  const podiumRows = data.rows.slice(0, 3);
  const currentUserOutsidePodium = data.rows
    .slice(3)
    .find((row) => row.isCurrentUser);
  const remainingRows = data.rows
    .slice(3)
    .filter((row) => !row.isCurrentUser);
  const hasStandings = Boolean(
    currentUserOutsidePodium || remainingRows.length > 0,
  );

  return (
    <>
      {activeView === "general" ? (
        <View style={styles.generalControls}>
          <View style={styles.generalCopy}>
            <Text style={styles.generalTitle}>General top 100</Text>
            <Text style={styles.generalDescription}>Lifetime TapIt points</Text>
          </View>
          <GeneralLeaderboardPrivacyToggle
            isSaving={isSavingPreference}
            message={preferenceMessage}
            onChange={(value) => void onPreferenceChange(value)}
            value={generalPreference}
          />
        </View>
      ) : null}

      <LeaderboardPodium rows={podiumRows} />

      <View style={styles.rankingSurface}>
        {data.rows.length ? (
          hasStandings ? (
            <View style={styles.standingsSection}>
              {currentUserOutsidePodium ? (
                <LeaderboardYourPlace row={currentUserOutsidePodium} />
              ) : null}

              {remainingRows.length > 0 ? (
                <View style={styles.rankingList}>
                  {remainingRows.map((row) => (
                    <LeaderboardRankingRow key={row.key} row={row} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.completePodiumState}>
              <Text style={styles.completePodiumTitle}>
                {activeView === "friends" && data.rows.length === 1
                  ? "Add friends to build your standings."
                  : "That’s everyone for now."}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyMark}>—</Text>
            <Text style={styles.emptyTitle}>No rankings yet.</Text>
            <Text style={styles.emptyCopy}>
              Points from the first check-in will appear here.
            </Text>
          </View>
        )}
      </View>
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
      colors={[leaderboardColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={leaderboardColors.purple}
    />
  );

  return (
    <AppScreen
      backgroundColor={leaderboardColors.background}
      refreshControl={refreshControl}
      showTopbar={false}
      variant="v3"
    >
      <LeaderboardHeader />
      <LeaderboardSegmentedControl
        onChange={setActiveView}
        value={activeView}
      />

      {!data && (isLoading || !error) ? (
        <LeaderboardSkeleton />
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
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    position: "absolute",
    right: 46,
    left: 46,
    color: leaderboardColors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -1.1,
    textAlign: "center",
  },
  titlePeriod: { color: leaderboardColors.purple },
  headerBalance: { width: 38, height: 38 },
  rankingSurface: {
    zIndex: 2,
    minHeight: 180,
    marginTop: -12,
    marginHorizontal: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: leaderboardColors.background,
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  generalControls: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: leaderboardColors.border,
    paddingBottom: 8,
  },
  generalCopy: { minWidth: 0, flex: 1, gap: 1 },
  generalTitle: {
    color: leaderboardColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  generalDescription: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  standingsSection: { marginTop: 0 },
  rankingList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: leaderboardColors.border,
  },
  completePodiumState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 10,
  },
  completePodiumTitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 5,
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  emptyMark: {
    color: leaderboardColors.purple,
    fontFamily: fonts.display,
    fontSize: 38,
  },
  emptyTitle: {
    marginTop: 8,
    color: leaderboardColors.ink,
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
  errorState: {
    marginTop: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: leaderboardColors.border,
    paddingTop: 24,
  },
  errorTitle: {
    color: leaderboardColors.ink,
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
    backgroundColor: leaderboardColors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: leaderboardColors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: { opacity: 0.7 },
});
