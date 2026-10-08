import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect } from "react";
import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
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

const ACTIVE_TIMELINE_MS = 4_000;
const RESET_TIMELINE_MS = 1;
const LOOP_PAUSE_MS = 499;
const STATIC_SUCCESS_PROGRESS = 0.62;

type NfcIntroSceneProps = {
  active: boolean;
  pagerProgress: SharedValue<number>;
  reduceMotion: boolean;
};

export function NfcIntroScene({
  active,
  pagerProgress,
  reduceMotion,
}: NfcIntroSceneProps) {
  const { width: viewportWidth } = useWindowDimensions();
  const timeline = useSharedValue(0);
  const sceneWidth = Math.min(Math.max(viewportWidth - 48, 270), 330);
  const sceneHeight = sceneWidth * 0.72;
  const phoneHeight = sceneWidth * 0.6;
  const phoneWidth = phoneHeight * 0.52;
  const plaqueSize = phoneHeight * 0.67;
  const approachX = sceneWidth * 0.42;
  const approachY = sceneHeight * -0.02;

  useEffect(() => {
    cancelAnimation(timeline);

    if (!active) {
      timeline.set(0);
      return;
    }

    if (reduceMotion) {
      timeline.set(STATIC_SUCCESS_PROGRESS);
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
              [0, 1],
              [0, -8],
              Extrapolation.CLAMP,
            ),
      },
    ],
  }));

  const phoneStyle = useAnimatedStyle(() => {
    const progress = timeline.value;

    return {
      transform: [
        {
          translateX: interpolate(
            progress,
            [0, 0.125, 0.325, 0.8, 1],
            [0, 0, approachX, approachX, 0],
            Extrapolation.CLAMP,
          ),
        },
        {
          translateY: interpolate(
            progress,
            [0, 0.125, 0.325, 0.8, 1],
            [18, 18, approachY, approachY, 18],
            Extrapolation.CLAMP,
          ),
        },
        {
          rotate: `${interpolate(
            progress,
            [0, 0.125, 0.325, 0.8, 1],
            [-5, -5, -1, -1, -5],
            Extrapolation.CLAMP,
          )}deg`,
        },
      ],
    };
  });

  const plaqueStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0, 0.325, 0.355, 0.395, 1],
          [1, 1, 0.985, 1, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const readyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.355, 0.405, 0.79, 0.86, 1],
      [1, 1, 0, 0, 1, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const successStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      timeline.value,
      [0, 0.365, 0.425, 0.79, 0.86, 1],
      [0, 0, 1, 1, 0, 0],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          timeline.value,
          [0.365, 0.425, 0.47],
          [0.78, 1.04, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  return (
    <Animated.View
      accessibilityLabel="A phone tapping a TapIt NFC plaque and checking in successfully"
      accessibilityRole="image"
      accessibilityState={{ selected: active }}
      style={[
        styles.scene,
        { height: sceneHeight, width: sceneWidth },
        sceneStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.plaqueFrame,
          {
            height: plaqueSize,
            right: sceneWidth * 0.015,
            top: sceneHeight * 0.23,
            width: plaqueSize,
          },
          plaqueStyle,
        ]}
      >
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="contain"
          source={require("../../../../assets/onboarding/nfc-plaque.png")}
          style={{ height: plaqueSize, width: plaqueSize }}
        />
      </Animated.View>

      <View
        accessibilityElementsHidden
        pointerEvents="none"
        style={[
          styles.waveCluster,
          {
            left: sceneWidth * 0.7,
            top: sceneHeight * 0.48,
          },
        ]}
      >
        <NfcPulseArc
          end={0.43}
          reduceMotion={reduceMotion}
          size={20}
          start={0.325}
          timeline={timeline}
        />
        <NfcPulseArc
          end={0.455}
          reduceMotion={reduceMotion}
          size={34}
          start={0.345}
          timeline={timeline}
        />
        <NfcPulseArc
          end={0.48}
          reduceMotion={reduceMotion}
          size={48}
          start={0.365}
          timeline={timeline}
        />
      </View>

      <Animated.View
        style={[
          styles.phone,
          {
            height: phoneHeight,
            left: sceneWidth * 0.03,
            top: sceneHeight * 0.06,
            width: phoneWidth,
          },
          phoneStyle,
        ]}
      >
        <View style={styles.speaker} />
        <View style={styles.phoneScreen}>
          <Animated.View style={[styles.phoneState, readyStyle]}>
            <MaterialCommunityIcons
              color={v3Colors.purple}
              name="cellphone-nfc"
              size={32}
            />
            <Text style={styles.phoneStateLabel}>Ready</Text>
          </Animated.View>
          <Animated.View style={[styles.phoneState, successStyle]}>
            <View style={styles.successMark}>
              <MaterialCommunityIcons color="#fffaf1" name="check" size={25} />
            </View>
            <Text style={styles.successLabel}>Checked in</Text>
          </Animated.View>
        </View>
        <View style={styles.homeIndicator} />
      </Animated.View>
    </Animated.View>
  );
}

function NfcPulseArc({
  end,
  reduceMotion,
  size,
  start,
  timeline,
}: {
  end: number;
  reduceMotion: boolean;
  size: number;
  start: number;
  timeline: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    if (reduceMotion) {
      return { opacity: 0.25, transform: [{ scale: 1 }] };
    }

    const middle = start + (end - start) * 0.46;
    return {
      opacity: interpolate(
        timeline.value,
        [start, middle, end],
        [0, 0.5, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          scale: interpolate(
            timeline.value,
            [start, end],
            [0.82, 1.08],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.waveArc,
        {
          borderRadius: size / 2,
          height: size,
          marginLeft: -size,
          marginTop: -size / 2,
          width: size,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    alignSelf: "center",
  },
  plaqueFrame: {
    position: "absolute",
    zIndex: 1,
  },
  waveCluster: {
    position: "absolute",
    zIndex: 4,
    width: 1,
    height: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  waveArc: {
    position: "absolute",
    borderRightWidth: 1.8,
    borderColor: v3Colors.purple,
  },
  phone: {
    position: "absolute",
    zIndex: 3,
    alignItems: "center",
    borderWidth: 5,
    borderColor: v3Colors.ink,
    borderRadius: 24,
    backgroundColor: "#f9eddd",
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 7,
  },
  speaker: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: v3Colors.ink,
  },
  phoneScreen: {
    position: "relative",
    flex: 1,
    alignSelf: "stretch",
    marginTop: 6,
    overflow: "hidden",
    borderRadius: 15,
    backgroundColor: "#fff9ef",
  },
  phoneState: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  phoneStateLabel: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  successMark: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: v3Colors.purple,
  },
  successLabel: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  homeIndicator: {
    width: 24,
    height: 3,
    marginTop: 5,
    borderRadius: 2,
    backgroundColor: "#a698a5",
  },
});
