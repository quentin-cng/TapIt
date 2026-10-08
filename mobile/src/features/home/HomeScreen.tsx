import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { AnimatedPoints } from "../../motion/AnimatedPoints";
import {
  type HomeRewardEvent,
  useRewardEvents,
} from "../../motion/RewardEventProvider";
import { TapPressable } from "../../motion/TapPressable";
import { colors, fonts } from "../../theme/tokens";
import { HomeHeroArtwork } from "./HomeArtwork";
import { HomeAmbientParticles } from "./HomeAmbientParticles";
import { HomeSkeleton } from "./HomeSkeleton";
import { type HomeData, useHomeData } from "./useHomeData";
import { useHomeSocialNudge } from "./useHomeSocialNudge";

const homeColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  softSurface: "#f8f0e6",
  border: "#ebddcf",
  ink: "#1a1333",
  purple: "#5b3df6",
  dark: "#24152f",
} as const;

function HomeTopBar({ avatarId }: { avatarId?: string | null }) {
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
        <TapItAvatar
          avatarId={avatarId}
          borderColor={homeColors.ink}
          borderWidth={2}
          size={38}
        />
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
  const {
    data: socialNudge,
    hasError: hasSocialDataError,
    isLoading: isSocialLoading,
    isRefreshing: isSocialRefreshing,
    load: loadSocialNudge,
    refresh: refreshSocialNudge,
  } = useHomeSocialNudge(userId);
  const { consumeRewardEvent, getPendingRewardEvent } = useRewardEvents();
  const [confirmedReward, setConfirmedReward] =
    useState<HomeRewardEvent | null>(null);

  const reconcileRewardEvent = useCallback(
    (nextData: HomeData | null) => {
      if (!nextData) return;

      const event = getPendingRewardEvent();
      if (!event) return;

      const weeklyStateMatches =
        event.finalWeeklySessions === null || event.weeklyGoal === null
          ? nextData.weeklyProgress === null
          : nextData.weeklyProgress?.sessionsCompleted ===
              event.finalWeeklySessions &&
            nextData.weeklyProgress.targetSessions === event.weeklyGoal;
      const isConfirmed =
        event.userId === userId &&
        !nextData.hasPersonalDataError &&
        nextData.profile.total_points === event.finalTotalPoints &&
        weeklyStateMatches;

      setConfirmedReward(isConfirmed ? event : null);
      consumeRewardEvent(event.checkinId);
    },
    [consumeRewardEvent, getPendingRewardEvent, userId],
  );

  const loadAndReconcile = useCallback(async () => {
    reconcileRewardEvent(await load());
  }, [load, reconcileRewardEvent]);

  const refreshAndReconcile = useCallback(async () => {
    const [nextData] = await Promise.all([refresh(), refreshSocialNudge()]);
    reconcileRewardEvent(nextData);
  }, [reconcileRewardEvent, refresh, refreshSocialNudge]);

  useFocusEffect(
    useCallback(() => {
      void loadAndReconcile();
      void loadSocialNudge();
    }, [loadAndReconcile, loadSocialNudge]),
  );

  const refreshControl = (
    <RefreshControl
      colors={[homeColors.purple]}
      onRefresh={() => void refreshAndReconcile()}
      refreshing={isRefreshing || isSocialRefreshing}
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
  const confirmedPointsReward =
    confirmedReward?.userId === userId &&
    confirmedReward.finalTotalPoints === profile.total_points
      ? confirmedReward
      : null;
  const confirmedWeeklyReward =
    confirmedPointsReward &&
    weeklyProgress &&
    confirmedPointsReward.finalWeeklySessions ===
      weeklyProgress.sessionsCompleted &&
    confirmedPointsReward.weeklyGoal === weeklyProgress.targetSessions
      ? confirmedPointsReward
      : null;
  const animatedPointsFontSize = formattedPoints.length > 4 ? 78 : 94;

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
        <HomeAmbientParticles />
        <View style={[styles.heroTopbar, { paddingTop: heroTopOffset }]}>
          <HomeTopBar avatarId={profile.avatar_id} />
        </View>
        <View style={[styles.pointsBlock, { top: heroTopOffset + 48 }]}>
          {confirmedPointsReward ? (
            <AnimatedPoints
              accessibilityLabel={`${profile.total_points} points`}
              animationKey={confirmedPointsReward.checkinId}
              containerStyle={styles.animatedPointsContainer}
              delayMs={40}
              endValue={confirmedPointsReward.finalTotalPoints}
              format="grouped"
              startValue={confirmedPointsReward.previousTotalPoints}
              style={[
                styles.pointsValue,
                styles.animatedPointsValue,
                {
                  fontSize: animatedPointsFontSize,
                  lineHeight: animatedPointsFontSize + 2,
                },
              ]}
            />
          ) : (
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={styles.pointsValue}
            >
              {formattedPoints}
            </Text>
          )}
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </View>

      <View style={styles.contentPanel}>
        <TapPressable
          accessibilityHint="Opens Profile where you can change your weekly goal"
          accessibilityLabel={
            weeklyProgress
              ? `${weeklyProgress.sessionsCompleted} of ${weeklyProgress.targetSessions} sessions this week. Weekly goal.`
              : "No weekly goal. Set your weekly goal."
          }
          accessibilityRole="button"
          haptic="press"
          onPress={() => router.push("/profile")}
          style={({ pressed }) => [
            styles.weekCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.weekHeader}>
            <Text style={styles.weekEyebrow}>THIS WEEK</Text>
            <Text
              style={[
                styles.weekGoalLabel,
                weeklyProgress?.isComplete && styles.goalComplete,
              ]}
            >
              {weeklyProgress?.isComplete ? "Goal complete" : "Weekly goal"}
            </Text>
          </View>

          {weeklyProgress ? (
            <>
              <View style={styles.weekTitleRow}>
                <Text style={styles.weekCount}>
                  {weeklyProgress.sessionsCompleted} / {weeklyProgress.targetSessions} sessions
                </Text>
                <MaterialCommunityIcons
                  color={homeColors.ink}
                  name="chevron-right"
                  size={25}
                />
              </View>
              <View style={styles.sessionDots}>
                <SessionDots
                  accentColor="#9c7ae8"
                  completed={weeklyProgress.sessionsCompleted}
                  completionAnimation={
                    confirmedWeeklyReward &&
                    confirmedWeeklyReward.previousWeeklySessions !== null &&
                    confirmedWeeklyReward.finalWeeklySessions !== null &&
                    confirmedWeeklyReward.finalWeeklySessions <=
                      weeklyProgress.targetSessions
                      ? {
                          delayMs: 180,
                          eventKey: confirmedWeeklyReward.checkinId,
                          index:
                            confirmedWeeklyReward.finalWeeklySessions - 1,
                        }
                      : undefined
                  }
                  target={weeklyProgress.targetSessions}
                  variant="home"
                />
              </View>
            </>
          ) : (
            <View style={styles.noGoalState}>
              <View style={styles.weekTitleRow}>
                <Text style={styles.noGoalTitle}>Set your weekly goal</Text>
                <MaterialCommunityIcons
                  color={homeColors.ink}
                  name="chevron-right"
                  size={25}
                />
              </View>
              <Text style={styles.noGoalCopy}>
                Choose how many sessions you want to show up for.
              </Text>
            </View>
          )}
        </TapPressable>

        <TapPressable
          accessibilityHint={
            socialNudge?.kind === "no-friends"
              ? "Opens Friends where you can add someone"
              : "Opens your friends’ weekly progress"
          }
          accessibilityLabel={
            socialNudge
              ? `${socialNudge.message} ${socialNudge.actionLabel}`
              : "Friends this week. View friends"
          }
          accessibilityRole="button"
          haptic="press"
          onPress={() =>
            socialNudge?.kind === "no-friends"
              ? router.push({ pathname: "/friends", params: { add: "1" } })
              : router.push("/friends")
          }
          style={({ pressed }) => [
            styles.socialCard,
            pressed && styles.cardPressed,
          ]}
        >
          <View style={styles.socialIcon}>
            <MaterialCommunityIcons
              color={homeColors.dark}
              name="account-group"
              size={29}
            />
          </View>
          <View style={styles.socialNudgeCopy}>
            {isSocialLoading && !socialNudge ? (
              <View accessibilityLabel="Loading friends’ weekly progress">
                <View style={styles.socialNudgeLoading} />
                <View style={styles.socialDetailLoading} />
              </View>
            ) : (
              <>
                <Text numberOfLines={2} style={styles.socialNudgeMessage}>
                  {socialNudge?.message ??
                    (hasSocialDataError
                      ? "Weekly friend updates are unavailable right now."
                      : "See how your friends are showing up this week.")}
                </Text>
                <Text numberOfLines={1} style={styles.socialNudgeDetail}>
                  {socialNudge?.supportingText ??
                    "Open Friends to see everyone’s progress."}
                </Text>
              </>
            )}
          </View>
          <MaterialCommunityIcons
            color={homeColors.ink}
            name="chevron-right"
            size={25}
          />
        </TapPressable>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCell}>
            <View
              accessible
              accessibilityLabel={`${weeklyStreaks.currentStreak} week streak. Current streak.`}
              style={styles.summaryCard}
            >
              <MaterialCommunityIcons
                color="#ff9a37"
                name="fire"
                size={38}
              />
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>
                  {weeklyStreaks.currentStreak} {weeklyStreaks.currentStreak === 1 ? "week" : "weeks"}
                </Text>
                <Text style={styles.summarySubtitle}>Current streak</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryCell}>
            <TapPressable
              accessibilityHint="Opens your recap from last week"
              accessibilityLabel="View weekly recap. See your activity."
              accessibilityRole="button"
              haptic="press"
              onPress={() => router.push("/recap")}
              style={({ pressed }) => [
                styles.summaryCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.recapIcon}>
                <MaterialCommunityIcons
                  color={homeColors.dark}
                  name="chart-bar"
                  size={25}
                />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>View recap</Text>
                <Text style={styles.summarySubtitle}>See your activity</Text>
              </View>
            </TapPressable>
          </View>
        </View>

        <TapPressable
          accessibilityHint="Opens Rewards"
          accessibilityLabel={`${profile.total_points} points. View rewards.`}
          accessibilityRole="button"
          haptic="press"
          onPress={() => router.push("/rewards")}
          style={({ pressed }) => [
            styles.rewardsCta,
            pressed && styles.rewardsCtaPressed,
          ]}
        >
          <MaterialCommunityIcons
            color={homeColors.surface}
            name="gift"
            size={27}
          />
          <Text style={styles.rewardsCtaText}>View rewards</Text>
          <MaterialCommunityIcons
            color={homeColors.surface}
            name="chevron-right"
            size={25}
          />
        </TapPressable>
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
    width: "55%",
  },
  pointsValue: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 94,
    fontVariant: ["tabular-nums"],
    letterSpacing: -3.5,
    lineHeight: 96,
  },
  animatedPointsValue: {
    width: "100%",
    height: 100,
  },
  animatedPointsContainer: {
    width: "100%",
  },
  pointsLabel: {
    marginTop: -3,
    color: homeColors.ink,
    fontFamily: fonts.medium,
    fontSize: 24,
    letterSpacing: -0.4,
  },
  contentPanel: {
    zIndex: 2,
    marginTop: -28,
    marginHorizontal: -20,
    gap: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: homeColors.background,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 18,
  },
  weekCard: {
    minHeight: 154,
    borderWidth: 1,
    borderColor: homeColors.border,
    borderRadius: 18,
    backgroundColor: homeColors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  weekEyebrow: {
    color: homeColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 12,
    letterSpacing: 1.35,
  },
  weekGoalLabel: {
    color: homeColors.ink,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  weekTitleRow: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  weekCount: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 31,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  goalComplete: {
    color: homeColors.purple,
    fontFamily: fonts.semibold,
  },
  sessionDots: {
    marginTop: 10,
  },
  noGoalState: {
    marginTop: 4,
  },
  noGoalTitle: {
    color: homeColors.ink,
    fontFamily: fonts.display,
    fontSize: 27,
  },
  noGoalCopy: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  socialCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: homeColors.border,
    borderRadius: 18,
    backgroundColor: homeColors.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  socialIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: homeColors.softSurface,
  },
  socialNudgeCopy: {
    minWidth: 0,
    flex: 1,
  },
  socialNudgeMessage: {
    color: homeColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 16,
    lineHeight: 21,
  },
  socialNudgeDetail: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
  },
  socialNudgeLoading: {
    width: "84%",
    height: 14,
    borderRadius: 6,
    backgroundColor: "#eadfd4",
  },
  socialDetailLoading: {
    width: "68%",
    height: 10,
    marginTop: 7,
    borderRadius: 5,
    backgroundColor: "#eadfd4",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCell: {
    minWidth: 0,
    flex: 1,
  },
  summaryCard: {
    width: "100%",
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: homeColors.border,
    borderRadius: 18,
    backgroundColor: homeColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  recapIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: homeColors.softSurface,
  },
  summaryCopy: {
    minWidth: 0,
    flex: 1,
  },
  summaryTitle: {
    color: homeColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 17,
    lineHeight: 21,
  },
  summarySubtitle: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  cardPressed: {
    opacity: 0.7,
  },
  rewardsCta: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 17,
    backgroundColor: homeColors.dark,
    paddingHorizontal: 20,
  },
  rewardsCtaText: {
    flex: 1,
    marginLeft: 22,
    color: homeColors.surface,
    fontFamily: fonts.semibold,
    fontSize: 18,
  },
  rewardsCtaPressed: {
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
