import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { fonts, v3Colors } from "../../../theme/tokens";

const ACTIVE_TIMELINE_MS = 4_400;
const RESET_TIMELINE_MS = 1;
const LOOP_PAUSE_MS = 399;
const STATIC_COMPLETE_PROGRESS = 0.7;

type WeeklyGoalIntroSceneProps = {
  active: boolean;
  pagerProgress: SharedValue<number>;
  reduceMotion: boolean;
};

export function WeeklyGoalIntroScene({
  active,
  pagerProgress,
  reduceMotion,
}: WeeklyGoalIntroSceneProps) {
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
      timeline.set(STATIC_COMPLETE_PROGRESS);
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
              [0, 1, 2],
              [8, 0, -8],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  const goalGroupStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0, 0.38, 0.43, 0.52, 1],
          [1, 1, 1.02, 1, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const initialCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.28, 0.35, 0.84, 0.92, 1],
      [1, 1, 0, 0, 1, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const completedCountStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.28, 0.35, 0.84, 0.92, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          timeline.value,
          [0.28, 0.35],
          [5, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const thirdMarkerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0, 0.27, 0.33, 0.39, 1],
          [1, 1, 1.08, 1, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const thirdFillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.27, 0.32, 0.84, 0.94, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0, 0.27, 0.36, 0.84, 1],
          [0.72, 0.72, 1, 1, 0.72],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const thirdCheckStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.32, 0.38, 0.84, 0.94, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0.32, 0.38, 0.42],
          [0.75, 1.08, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const pointsStyle = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] };
    }

    return {
      opacity: interpolate(
        timeline.value,
        [0, 0.18, 0.24, 0.34, 0.42, 1],
        [0, 0, 1, 1, 0, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            timeline.value,
            [0.18, 0.24, 0.29],
            [0.9, 1.03, 1],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            timeline.value,
            [0.18, 0.29, 0.42],
            [10, 0, -7],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const completionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.44, 0.52, 0.84, 0.94, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          timeline.value,
          [0.44, 0.52],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          timeline.value,
          [0.44, 0.52, 0.57],
          [0.95, 1.025, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel="Weekly goal progresses from 2 of 3 to 3 of 3, earning 10 points and completing the goal"
      accessibilityRole="image"
      accessibilityState={{ selected: active }}
      style={[styles.scene, { width: sceneWidth }, sceneStyle]}
    >
      <Text style={styles.eyebrow}>WEEKLY GOAL</Text>

      <Animated.View style={[styles.goalGroup, goalGroupStyle]}>
        <View style={styles.countFrame}>
          <Animated.Text style={[styles.count, initialCountStyle]}>
            2 / 3
          </Animated.Text>
          <Animated.Text style={[styles.count, completedCountStyle]}>
            3 / 3
          </Animated.Text>
        </View>

        <View style={styles.markerRow}>
          <CompletedMarker />
          <CompletedMarker />
          <Animated.View
            style={[styles.marker, styles.incompleteMarker, thirdMarkerStyle]}
          >
            <Animated.View style={[styles.thirdMarkerFill, thirdFillStyle]} />
            <Animated.View style={[styles.markerCheck, thirdCheckStyle]}>
              <MaterialCommunityIcons
                color="#fffaf1"
                name="check"
                size={25}
              />
            </Animated.View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.pointsMoment, pointsStyle]}>
        <Text style={styles.pointsValue}>+10</Text>
        <Text style={styles.pointsLabel}>points</Text>
      </Animated.View>

      <Animated.View style={[styles.completion, completionStyle]}>
        <View style={styles.completionCheck}>
          <MaterialCommunityIcons color="#fffaf1" name="check" size={16} />
        </View>
        <Text style={styles.completionText}>Goal complete</Text>
      </Animated.View>
    </Animated.View>
  );
}

function CompletedMarker() {
  return (
    <View style={[styles.marker, styles.completedMarker]}>
      <MaterialCommunityIcons color="#fffaf1" name="check" size={25} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    minHeight: 244,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "#786b7b",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  goalGroup: {
    alignItems: "center",
    marginTop: 7,
  },
  countFrame: {
    position: "relative",
    width: 132,
    height: 59,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    position: "absolute",
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 47,
    letterSpacing: -1.8,
  },
  markerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 7,
  },
  marker: {
    position: "relative",
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 29,
  },
  completedMarker: {
    backgroundColor: v3Colors.purple,
  },
  incompleteMarker: {
    borderWidth: 1.5,
    borderColor: "#9a8e9c",
    backgroundColor: "#fff9ef",
  },
  thirdMarkerFill: {
    position: "absolute",
    top: -1.5,
    right: -1.5,
    bottom: -1.5,
    left: -1.5,
    borderRadius: 31,
    backgroundColor: v3Colors.purple,
  },
  markerCheck: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pointsMoment: {
    position: "absolute",
    top: 60,
    right: 4,
    alignItems: "center",
  },
  pointsValue: {
    color: v3Colors.purple,
    fontFamily: fonts.display,
    fontSize: 29,
    lineHeight: 31,
  },
  pointsLabel: {
    color: "#786b7b",
    fontFamily: fonts.medium,
    fontSize: 9,
    letterSpacing: 0.4,
  },
  completion: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 20,
    borderRadius: 19,
    backgroundColor: "#eee7fb",
    paddingHorizontal: 15,
  },
  completionCheck: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: v3Colors.purple,
  },
  completionText: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
});
