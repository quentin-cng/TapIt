import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SessionDots } from "../components/consistency/SessionDots";
import { StreakFlame } from "../components/consistency/StreakFlame";
import { AnimatedPoints } from "../motion/AnimatedPoints";
import { RewardPointsBurst } from "../motion/RewardPointsBurst";
import { fonts } from "../theme/tokens";
import type { CheckinRow } from "./checkin-contract";

type CheckinSuccessViewProps = {
  onDone: () => void;
  result: CheckinRow;
  streak: number | null;
};

type RevealProps = {
  animationKey: string;
  children: ReactNode;
  delayMs: number;
  emphasis?: boolean;
  style?: ViewStyle;
};

function Reveal({
  animationKey,
  children,
  delayMs,
  emphasis = false,
  style,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const translateY = useSharedValue(reduceMotion ? 0 : 10);
  const scale = useSharedValue(reduceMotion ? 1 : emphasis ? 0.97 : 1);
  const lastAnimationKey = useRef<string | null>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    if (lastAnimationKey.current === animationKey) return;
    lastAnimationKey.current = animationKey;
    cancelAnimation(opacity);
    cancelAnimation(translateY);
    cancelAnimation(scale);

    if (reduceMotion) {
      opacity.set(1);
      translateY.set(0);
      scale.set(1);
      return;
    }

    opacity.set(0);
    translateY.set(10);
    scale.set(emphasis ? 0.97 : 1);
    opacity.set(
      withDelay(
        delayMs,
        withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    translateY.set(
      withDelay(
        delayMs,
        withTiming(0, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    if (emphasis) {
      scale.set(
        withDelay(
          delayMs,
          withSpring(1, {
            damping: 20,
            mass: 0.45,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System,
            stiffness: 280,
          }),
        ),
      );
    }

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(translateY);
      cancelAnimation(scale);
    };
  }, [
    animationKey,
    delayMs,
    emphasis,
    opacity,
    reduceMotion,
    scale,
    translateY,
  ]);

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}

export function CheckinSuccessView({
  onDone,
  result,
  streak,
}: CheckinSuccessViewProps) {
  const animationKey = useMemo(
    () =>
      result.checkin_id ??
      result.checked_in_at ??
      `${result.location_id}-${result.total_points}-${result.total_points_earned}`,
    [result],
  );
  const previousTotal =
    result.total_points === null
      ? null
      : result.total_points - result.total_points_earned;
  const hasWeeklyProgress =
    result.weekly_goal !== null && result.weekly_sessions !== null;
  const newSessionIndex =
    hasWeeklyProgress && result.weekly_sessions! > 0
      ? result.weekly_sessions! - 1
      : null;
  const canAnimateNewSession =
    newSessionIndex !== null && newSessionIndex < result.weekly_goal!;

  return (
    <View style={styles.container}>
      <Reveal animationKey={animationKey} delayMs={110}>
        <Text style={styles.successLabel}>You showed up.</Text>
        <Text accessibilityRole="header" style={styles.locationName}>
          {result.location_name ?? "TapIt location"}
        </Text>
      </Reveal>

      <View style={styles.pointsBlock}>
        <RewardPointsBurst animationKey={animationKey} delayMs={250}>
          <Text
            adjustsFontSizeToFit
            accessibilityLabel={`${result.total_points_earned} points earned`}
            numberOfLines={1}
            style={styles.pointsValue}
          >
            +{result.total_points_earned}
          </Text>
          <Text style={styles.pointsLabel}>Points</Text>
        </RewardPointsBurst>

        <Reveal animationKey={animationKey} delayMs={360}>
          {result.weekly_bonus_points > 0 ? (
            <View style={styles.breakdown}>
              <Text style={styles.breakdownText}>
                {result.points_awarded} check-in
              </Text>
              <Text style={styles.breakdownText}>
                {result.weekly_bonus_points} weekly goal bonus
              </Text>
            </View>
          ) : null}

          {result.total_points !== null && previousTotal !== null ? (
            <View style={styles.totalPointsRow}>
              <AnimatedPoints
                accessibilityLabel={`${result.total_points} total points`}
                animationKey={animationKey}
                delayMs={400}
                endValue={result.total_points}
                startValue={previousTotal}
                style={[
                  styles.totalPointsValue,
                  {
                    width: Math.max(
                      26,
                      String(result.total_points).length * 8,
                    ),
                  },
                ]}
              />
              <Text style={styles.totalPointsLabel}>total points</Text>
            </View>
          ) : null}
        </Reveal>
      </View>

      {hasWeeklyProgress ? (
        <Reveal
          animationKey={animationKey}
          delayMs={650}
          emphasis={result.weekly_goal_completed}
          style={styles.progressBlock}
        >
          <SessionDots
            completed={result.weekly_sessions!}
            completionAnimation={
              canAnimateNewSession
                ? {
                    delayMs: 760,
                    eventKey: animationKey,
                    index: newSessionIndex!,
                  }
                : undefined
            }
            target={result.weekly_goal!}
            tone="dark"
          />
          <Text style={styles.progressText}>
            {result.weekly_sessions} / {result.weekly_goal} this week
          </Text>
          {result.weekly_goal_completed ? (
            <Text style={styles.goalComplete}>Weekly goal complete</Text>
          ) : null}
        </Reveal>
      ) : null}

      {streak !== null ? (
        <Reveal animationKey={`${animationKey}-streak`} delayMs={80}>
          <StreakFlame
            message={streak > 0 ? "Keep it alive." : "Start your streak."}
            streak={streak}
            tone="dark"
          />
        </Reveal>
      ) : null}

      <Reveal
        animationKey={animationKey}
        delayMs={1020}
        style={styles.doneWrap}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onDone}
          style={({ pressed }) => [
            styles.doneButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  successLabel: {
    color: "#a98cff",
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  locationName: {
    maxWidth: 340,
    marginTop: 9,
    color: "#ffffff",
    fontFamily: fonts.display,
    fontSize: 36,
    letterSpacing: -2,
    lineHeight: 40,
  },
  pointsBlock: {
    marginTop: 34,
  },
  pointsValue: {
    color: "#ffffff",
    fontFamily: fonts.display,
    fontSize: 76,
    fontVariant: ["tabular-nums"],
    letterSpacing: -5.5,
    lineHeight: 78,
  },
  pointsLabel: {
    color: "#a98cff",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  breakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 13,
  },
  breakdownText: {
    borderWidth: 1,
    borderColor: "#3b3646",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#c8c4d0",
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  totalPointsRow: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 11,
  },
  totalPointsValue: {
    height: 20,
    color: "#85818d",
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    lineHeight: 18,
  },
  totalPointsLabel: {
    color: "#85818d",
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  progressBlock: {
    marginTop: 31,
  },
  progressText: {
    marginTop: 12,
    color: "#ffffff",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  goalComplete: {
    marginTop: 5,
    color: "#a98cff",
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  doneWrap: {
    marginTop: 34,
  },
  doneButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#7b52e8",
    paddingHorizontal: 20,
  },
  doneText: {
    color: "#ffffff",
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.72,
  },
});
