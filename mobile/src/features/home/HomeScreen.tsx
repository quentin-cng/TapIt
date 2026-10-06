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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { SessionDots } from "../../components/consistency/SessionDots";
import { StreakFlame } from "../../components/consistency/StreakFlame";
import { colors, fonts } from "../../theme/tokens";
import {
  HomeHeroArtwork,
  PenguinProfileArtwork,
} from "./HomeArtwork";
import { HomeSkeleton } from "./HomeSkeleton";
import { useHomeData } from "./useHomeData";

const homeColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  border: "#ebddcf",
  ink: "#1a1333",
  purple: "#5b3df6",
  purpleDark: "#1a1333",
} as const;

function HomeTopBar() {
  return (
    <View style={styles.topbar}>
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
    </View>
  );
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
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
      colors={[homeColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={homeColors.purple}
    />
  );
  const heroTopOffset = insets.top + 20;
  const heroHeight = 342 + heroTopOffset;

  if (isLoading && !data) {
    return (
      <AppScreen
        backgroundColor={homeColors.background}
        extendUnderTopInset
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <HomeSkeleton />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen
        backgroundColor={homeColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <HomeTopBar />
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
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const { profile, weeklyProgress, weeklyStreaks } = data;
  const formattedPoints = new Intl.NumberFormat("en-CA").format(
    profile.total_points,
  );

  return (
    <AppScreen
      backgroundColor={homeColors.background}
      extendUnderTopInset
      refreshControl={refreshControl}
      showTopbar={false}
      variant="v3"
    >
      {data.hasPersonalDataError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          Some weekly data could not be loaded. Pull down to try again.
        </Text>
      ) : null}

      <View style={[styles.hero, { height: heroHeight }]}>
        <HomeHeroArtwork height={heroHeight} />
        <View style={[styles.heroTopbar, { paddingTop: heroTopOffset }]}>
          <HomeTopBar />
        </View>
        <Pressable
          accessibilityHint="Opens Rewards"
          accessibilityLabel={`${profile.total_points} points. View rewards.`}
          accessibilityRole="button"
          onPress={() => router.push("/rewards")}
          style={({ pressed }) => [
            styles.pointsBlock,
            { top: heroTopOffset + 48 },
            pressed && styles.pressed,
          ]}
        >
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.pointsValue}
          >
            {formattedPoints}
          </Text>
          <Text style={styles.pointsLabel}>points</Text>
          <View style={styles.rewardsLink}>
            <Text style={styles.rewardsLinkText}>View rewards</Text>
            <MaterialCommunityIcons
              color={homeColors.purple}
              name="arrow-right"
              size={14}
            />
          </View>
        </Pressable>
      </View>

      <View style={styles.contentPanel}>
        <View style={styles.weekCard}>
          <View style={styles.weekHeader}>
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
              <Text style={styles.sectionTitle}>This week</Text>
              <MaterialCommunityIcons
                color={homeColors.purple}
                name="pencil-outline"
                size={13}
              />
            </Pressable>
            {weeklyProgress ? (
              <Text style={styles.weekCount}>
                {weeklyProgress.sessionsCompleted} / {weeklyProgress.targetSessions}
              </Text>
            ) : null}
          </View>

          {weeklyProgress ? (
            <View style={styles.sessionRow}>
              <View style={styles.sessionDots}>
                <SessionDots
                  accentColor={homeColors.purple}
                  completed={weeklyProgress.sessionsCompleted}
                  target={weeklyProgress.targetSessions}
                  variant="v3"
                />
              </View>
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
          ) : (
            <View style={styles.noGoalState}>
              <Text style={styles.noGoalTitle}>No weekly goal yet.</Text>
              <Text style={styles.noGoalCopy}>
                Set a weekly commitment to start tracking your consistency.
              </Text>
            </View>
          )}

          <Pressable
            accessibilityHint="Opens your recap from last week"
            accessibilityLabel="View weekly recap"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.push("/recap")}
            style={({ pressed }) => [
              styles.recapLink,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.recapLinkText}>View recap</Text>
            <MaterialCommunityIcons
              color={homeColors.purple}
              name="arrow-right"
              size={14}
            />
          </Pressable>
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
          <MaterialCommunityIcons
            color={homeColors.ink}
            name="chevron-right"
            size={22}
          />
        </View>

        <Pressable
          accessibilityHint="Opens a visual preview of the future TapIt NFC reader"
          accessibilityLabel="Tap to check in"
          accessibilityRole="button"
          onPress={() => router.push("/ready-to-tap")}
          style={({ pressed }) => [
            styles.checkinCta,
            pressed && styles.checkinCtaPressed,
          ]}
        >
          <MaterialCommunityIcons
            color={homeColors.surface}
            name="contactless-payment"
            size={29}
          />
          <Text style={styles.checkinCtaText}>Tap to check in</Text>
          <MaterialCommunityIcons
            color={homeColors.surface}
            name="chevron-right"
            size={25}
          />
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  topbar: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  inlineError: {
    marginTop: 4,
    marginBottom: 8,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  hero: {
    marginHorizontal: -20,
    overflow: "hidden",
  },
  heroTopbar: {
    paddingHorizontal: 24,
  },
  pointsBlock: {
    position: "absolute",
    zIndex: 1,
    left: 24,
    maxWidth: "55%",
  },
  pointsValue: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 94,
    fontVariant: ["tabular-nums"],
    letterSpacing: -3.5,
    lineHeight: 96,
  },
  pointsLabel: {
    marginTop: -3,
    color: homeColors.ink,
    fontFamily: fonts.medium,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  rewardsLink: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  rewardsLinkText: {
    color: homeColors.purple,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  contentPanel: {
    zIndex: 2,
    marginTop: -26,
    marginHorizontal: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: homeColors.surface,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  weekCard: {
    paddingHorizontal: 4,
    paddingBottom: 14,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 16,
  },
  sectionTitle: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
    letterSpacing: -0.5,
  },
  weekCount: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
    fontVariant: ["tabular-nums"],
  },
  remaining: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  goalComplete: {
    color: homeColors.purple,
    fontFamily: fonts.semibold,
  },
  sessionRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  sessionDots: {
    minWidth: 0,
    flex: 1,
  },
  editGoal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noGoalState: {
    marginTop: 15,
  },
  noGoalTitle: {
    color: homeColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  noGoalCopy: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  recapLink: {
    alignSelf: "flex-end",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  recapLinkText: {
    color: homeColors.purple,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  streakCard: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: homeColors.border,
    paddingRight: 4,
    paddingLeft: 4,
  },
  checkinCta: {
    minHeight: 54,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 19,
    backgroundColor: homeColors.purpleDark,
    paddingHorizontal: 20,
  },
  checkinCtaText: {
    color: homeColors.surface,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  checkinCtaPressed: {
    opacity: 0.86,
  },
  errorState: {
    marginTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: homeColors.border,
    paddingTop: 24,
  },
  errorTitle: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -1,
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
    borderRadius: 10,
    backgroundColor: homeColors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    opacity: 0.75,
  },
  retryButtonText: {
    color: homeColors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});
