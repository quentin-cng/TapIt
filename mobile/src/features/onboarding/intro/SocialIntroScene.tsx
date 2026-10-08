import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  ReduceMotion,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { TapItAvatar } from "../../../components/identity/TapItAvatar";
import { fonts, v3Colors } from "../../../theme/tokens";

const ACTIVE_TIMELINE_MS = 4_400;
const RESET_TIMELINE_MS = 1;
const LOOP_PAUSE_MS = 399;
const STATIC_FINAL_PROGRESS = 0.7;
const ROW_STEP = 60;

type SocialIntroSceneProps = {
  active: boolean;
  pagerProgress: SharedValue<number>;
  reduceMotion: boolean;
};

export function SocialIntroScene({
  active,
  pagerProgress,
  reduceMotion,
}: SocialIntroSceneProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const timeline = useSharedValue(0);
  const sceneWidth = Math.min(Math.max(viewportWidth - 48, 270), 330);

  useEffect(() => {
    cancelAnimation(timeline);

    if (!active) {
      timeline.set(0);
      return;
    }

    if (reduceMotion) {
      timeline.set(STATIC_FINAL_PROGRESS);
      return;
    }

    timeline.set(0);
    timeline.set(
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: ACTIVE_TIMELINE_MS,
            easing: Easing.linear,
            reduceMotion: ReduceMotion.Never,
          }),
          withTiming(0, {
            duration: RESET_TIMELINE_MS,
            reduceMotion: ReduceMotion.Never,
          }),
          withDelay(
            LOOP_PAUSE_MS,
            withTiming(0, {
              duration: RESET_TIMELINE_MS,
              reduceMotion: ReduceMotion.Never,
            }),
          ),
        ),
        -1,
        false,
        undefined,
        ReduceMotion.Never,
      ),
    );

    return () => {
      cancelAnimation(timeline);
      timeline.set(0);
    };
  }, [active, reduceMotion, timeline]);

  const sceneStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: reduceMotion
          ? 0
          : interpolate(
              pagerProgress.value,
              [1, 2],
              [8, 0],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  const alexRowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: ROW_STEP * getReorderProgress(timeline.value) },
    ],
  }));

  const youRowStyle = useAnimatedStyle(() => {
    const reorderProgress = getReorderProgress(timeline.value);

    return {
      transform: [
        { translateY: -ROW_STEP * reorderProgress },
        {
          scale: interpolate(
            timeline.value,
            [0, 0.47, 0.53, 0.59, 1],
            [1, 1, 1.025, 1, 1],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const initialPointsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.27, 0.36, 0.84, 0.92, 1],
      [1, 1, 0, 0, 1, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const finalPointsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.27, 0.36, 0.84, 0.92, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          timeline.value,
          [0.27, 0.36],
          [4, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const rewardStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] };
    }

    return {
      opacity: interpolate(
        timeline.value,
        [0, 0.205, 0.25, 0.31, 0.37, 1],
        [0, 0, 1, 1, 0, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            timeline.value,
            [0.205, 0.25, 0.29],
            [0.9, 1.03, 1],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            timeline.value,
            [0.205, 0.29, 0.37],
            [9, 0, -6],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const settleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.47, 0.55, 0.84, 0.94, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          timeline.value,
          [0.47, 0.55],
          [6, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel="You earn 10 points, move from third to second, and pass a friend on the leaderboard"
      accessibilityRole="image"
      accessibilityState={{ selected: active }}
      style={[styles.scene, { width: sceneWidth }, sceneStyle]}
    >
      <Text style={styles.eyebrow}>FRIENDS</Text>

      <View style={styles.rankingStage}>
        <View style={[styles.separator, { top: ROW_STEP }]} />
        <View style={[styles.separator, { top: ROW_STEP * 2 }]} />

        <SocialRow
          avatarId="sunset"
          name="Maya"
          points="120"
          rank="1"
          style={styles.firstRow}
        />
        <Animated.View style={[styles.positionedRow, styles.secondRow, alexRowStyle]}>
          <RankTransition
            finalRank="3"
            initialRank="2"
            timeline={timeline}
          />
          <TapItAvatar avatarId="forest" size={38} />
          <Text style={styles.name}>Alex</Text>
          <Text style={styles.points}>110</Text>
        </Animated.View>
        <Animated.View style={[styles.positionedRow, styles.youRow, youRowStyle]}>
          <RankTransition
            finalRank="2"
            initialRank="3"
            timeline={timeline}
          />
          <TapItAvatar avatarId="default" size={38} />
          <View style={styles.youIdentity}>
            <Text style={styles.name}>You</Text>
            <Text style={styles.youLabel}>YOU</Text>
          </View>
          <View style={styles.pointsFrame}>
            <Animated.Text
              style={[styles.points, styles.pointsOverlay, initialPointsStyle]}
            >
              105
            </Animated.Text>
            <Animated.Text
              style={[styles.points, styles.pointsOverlay, finalPointsStyle]}
            >
              115
            </Animated.Text>
          </View>
          <Animated.Text style={[styles.reward, rewardStyle]}>+10</Animated.Text>
        </Animated.View>
      </View>

      <Animated.Text style={[styles.settleLabel, settleStyle]}>
        Nice — you moved up
      </Animated.Text>
    </Animated.View>
  );
}

function SocialRow({
  avatarId,
  name,
  points,
  rank,
  style,
}: {
  avatarId: string;
  name: string;
  points: string;
  rank: string;
  style: object;
}) {
  return (
    <View style={[styles.positionedRow, style]}>
      <Text style={styles.rank}>{rank}</Text>
      <TapItAvatar avatarId={avatarId} size={38} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.points}>{points}</Text>
    </View>
  );
}

function RankTransition({
  finalRank,
  initialRank,
  timeline,
}: {
  finalRank: string;
  initialRank: string;
  timeline: SharedValue<number>;
}) {
  const initialStyle = useAnimatedStyle(() => ({
    opacity: 1 - getReorderProgress(timeline.value),
  }));
  const finalStyle = useAnimatedStyle(() => ({
    opacity: getReorderProgress(timeline.value),
  }));

  return (
    <View style={styles.rankFrame}>
      <Animated.Text
        style={[styles.rank, styles.rankTransitionText, initialStyle]}
      >
        {initialRank}
      </Animated.Text>
      <Animated.Text
        style={[styles.rank, styles.rankTransitionText, finalStyle]}
      >
        {finalRank}
      </Animated.Text>
    </View>
  );
}

function getReorderProgress(value: number) {
  "worklet";

  if (value < 0.84) {
    return Easing.inOut(Easing.cubic)(
      interpolate(value, [0.34, 0.5], [0, 1], Extrapolation.CLAMP),
    );
  }

  return (
    1 -
    Easing.inOut(Easing.cubic)(
      interpolate(value, [0.84, 1], [0, 1], Extrapolation.CLAMP),
    )
  );
}

const styles = StyleSheet.create({
  scene: {
    minHeight: 244,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    alignSelf: "flex-start",
    marginBottom: 8,
    color: "#786b7b",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  rankingStage: {
    position: "relative",
    width: "100%",
    height: ROW_STEP * 3,
  },
  separator: {
    position: "absolute",
    right: 0,
    left: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#dfd3c7",
  },
  positionedRow: {
    position: "absolute",
    right: 0,
    left: 0,
    zIndex: 1,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: 16,
    paddingHorizontal: 10,
  },
  firstRow: { top: 0 },
  secondRow: { top: ROW_STEP, zIndex: 2 },
  youRow: {
    top: ROW_STEP * 2,
    zIndex: 3,
    borderWidth: 1,
    borderColor: "#d5c6f1",
    backgroundColor: "#eee7fb",
  },
  rankFrame: {
    position: "relative",
    width: 20,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rank: {
    width: 20,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 20,
    textAlign: "center",
  },
  rankTransitionText: {
    position: "absolute",
  },
  name: {
    minWidth: 0,
    flex: 1,
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  youIdentity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  youLabel: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 8,
    letterSpacing: 0.8,
  },
  pointsFrame: {
    position: "relative",
    width: 36,
    height: 20,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  points: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  pointsOverlay: {
    position: "absolute",
    right: 0,
  },
  reward: {
    position: "absolute",
    top: -17,
    right: 5,
    color: v3Colors.purple,
    fontFamily: fonts.display,
    fontSize: 23,
  },
  settleLabel: {
    minHeight: 25,
    marginTop: 11,
    color: v3Colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
});
