import { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SessionDots } from "../components/consistency/SessionDots";
import { StreakFlame } from "../components/consistency/StreakFlame";
import { fonts } from "../theme/tokens";
import type { CheckinRow } from "./checkin-contract";

type CheckinSuccessViewProps = {
  onDone: () => void;
  result: CheckinRow;
  streak: number | null;
};

function revealStyle(value: Animated.Value) {
  return {
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };
}

export function CheckinSuccessView({
  onDone,
  result,
  streak,
}: CheckinSuccessViewProps) {
  const [venueReveal] = useState(() => new Animated.Value(0));
  const [pointsReveal] = useState(() => new Animated.Value(0));
  const [progressReveal] = useState(() => new Animated.Value(0));
  const [streakReveal] = useState(() => new Animated.Value(0));
  const [doneReveal] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);
  const finalSessions = result.weekly_sessions;
  const [revealedSessions, setRevealedSessions] = useState(() =>
    finalSessions === null ? 0 : Math.max(0, finalSessions - 1),
  );

  const reveals = useMemo(
    () => [
      venueReveal,
      pointsReveal,
      progressReveal,
      streakReveal,
      doneReveal,
    ],
    [doneReveal, pointsReveal, progressReveal, streakReveal, venueReveal],
  );

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion === null) return;

    if (reduceMotion) {
      reveals.forEach((value) => value.setValue(1));
      return;
    }

    const animation = Animated.stagger(
      280,
      reveals.map((value) =>
        Animated.timing(value, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: true,
        }),
      ),
    );
    const dotTimer = setTimeout(() => {
      setRevealedSessions(finalSessions ?? 0);
    }, 860);
    animation.start();

    return () => {
      clearTimeout(dotTimer);
      animation.stop();
    };
  }, [finalSessions, reduceMotion, reveals]);

  useEffect(() => {
    if (streak !== null && reduceMotion !== null) {
      if (reduceMotion) streakReveal.setValue(1);
    }
  }, [reduceMotion, streak, streakReveal]);

  const hasWeeklyProgress =
    result.weekly_goal !== null && result.weekly_sessions !== null;
  const visibleSessions = reduceMotion
    ? (finalSessions ?? 0)
    : revealedSessions;

  return (
    <View style={styles.container}>
      <Animated.View style={revealStyle(venueReveal)}>
        <Text style={styles.successLabel}>You showed up.</Text>
        <Text accessibilityRole="header" style={styles.locationName}>
          {result.location_name ?? "TapIt location"}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.pointsBlock, revealStyle(pointsReveal)]}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.pointsValue}>
          +{result.total_points_earned}
        </Text>
        <Text style={styles.pointsLabel}>Points</Text>

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

        {result.total_points !== null ? (
          <Text style={styles.totalPoints}>
            {result.total_points} total points
          </Text>
        ) : null}
      </Animated.View>

      {hasWeeklyProgress ? (
        <Animated.View
          style={[styles.progressBlock, revealStyle(progressReveal)]}
        >
          <SessionDots
            completed={visibleSessions}
            target={result.weekly_goal!}
            tone="dark"
          />
          <Text style={styles.progressText}>
            {result.weekly_sessions} / {result.weekly_goal} this week
          </Text>
          {result.weekly_goal_completed ? (
            <Text style={styles.goalComplete}>Weekly goal complete</Text>
          ) : null}
        </Animated.View>
      ) : null}

      {streak !== null ? (
        <Animated.View style={revealStyle(streakReveal)}>
          <StreakFlame
            message={streak > 0 ? "Keep it alive." : "Start your streak."}
            streak={streak}
            tone="dark"
          />
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.doneWrap, revealStyle(doneReveal)]}>
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
      </Animated.View>
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
    fontFamily: fonts.bold,
    fontSize: 36,
    letterSpacing: -2,
    lineHeight: 40,
  },
  pointsBlock: {
    marginTop: 34,
  },
  pointsValue: {
    color: "#ffffff",
    fontFamily: fonts.extraBold,
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
  totalPoints: {
    marginTop: 11,
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
