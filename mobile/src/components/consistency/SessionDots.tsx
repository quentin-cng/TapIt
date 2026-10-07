import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Fragment, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors, v3Colors } from "../../theme/tokens";

export type SessionDotCompletionAnimation = {
  delayMs?: number;
  eventKey: string;
  index: number;
};

type SessionDotsProps = {
  accentColor?: string;
  compact?: boolean;
  completed: number;
  completionAnimation?: SessionDotCompletionAnimation;
  target: number;
  tone?: "dark" | "light";
  variant?: "default" | "home" | "v3";
};

export function SessionDots({
  accentColor = v3Colors.purple,
  compact = false,
  completed,
  completionAnimation,
  target,
  tone = "light",
  variant = "default",
}: SessionDotsProps) {
  const safeTarget = Math.max(1, Math.min(7, target));
  const filled = Math.min(Math.max(0, completed), safeTarget);
  const animatedIndex =
    completionAnimation &&
    completionAnimation.index >= 0 &&
    completionAnimation.index < filled &&
    completionAnimation.index < safeTarget
      ? completionAnimation.index
      : null;

  if (variant === "home") {
    const dotSize = safeTarget >= 7 ? 32 : safeTarget === 6 ? 36 : 44;
    const dotGap = safeTarget >= 7 ? 4 : safeTarget === 6 ? 7 : 10;

    return (
      <View
        accessibilityLabel={`${completed} of ${target} weekly sessions completed`}
        style={[styles.homeRow, { gap: dotGap }]}
      >
        {Array.from({ length: safeTarget }, (_, index) => {
          const isFilled = index < filled;

          return index === animatedIndex ? (
            <AnimatedCompletionDot
              accentColor={accentColor}
              animation={completionAnimation!}
              compact={false}
              homeSize={dotSize}
              key={index}
              tone={tone}
              variant="home"
            />
          ) : (
            <View
              key={index}
              style={[
                styles.homeDot,
                { height: dotSize, width: dotSize },
                isFilled && styles.homeFilledDot,
                isFilled && {
                  backgroundColor: accentColor,
                  borderColor: accentColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  }

  if (variant === "v3") {
    return (
      <View
        accessibilityLabel={`${completed} of ${target} weekly sessions completed`}
        style={styles.v3Row}
      >
        {Array.from({ length: safeTarget }, (_, index) => {
          const isFilled = index < filled;

          return (
            <Fragment key={index}>
              {index === animatedIndex ? (
                <AnimatedCompletionDot
                  accentColor={accentColor}
                  animation={completionAnimation!}
                  compact={compact}
                  tone={tone}
                  variant="v3"
                />
              ) : (
                <View
                  style={[
                    styles.v3Dot,
                    compact && styles.v3CompactDot,
                    isFilled && styles.v3FilledDot,
                    isFilled && {
                      backgroundColor: accentColor,
                      borderColor: accentColor,
                    },
                  ]}
                >
                  {isFilled ? (
                    <MaterialCommunityIcons
                      color={colors.surface}
                      name="check"
                      size={compact ? 8 : 13}
                    />
                  ) : null}
                </View>
              )}
              {index < safeTarget - 1 ? (
                <View
                  style={[
                    styles.v3Connector,
                    compact && styles.v3CompactConnector,
                    index < filled - 1 && {
                      backgroundColor: accentColor,
                    },
                  ]}
                />
              ) : null}
            </Fragment>
          );
        })}
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${completed} of ${target} weekly sessions completed`}
      style={[styles.row, compact && styles.compactRow]}
    >
      {Array.from({ length: safeTarget }, (_, index) =>
        index === animatedIndex ? (
          <AnimatedCompletionDot
            accentColor={accentColor}
            animation={completionAnimation!}
            compact={compact}
            key={index}
            tone={tone}
            variant="default"
          />
        ) : (
          <View
            key={index}
            style={[
              styles.dot,
              compact && styles.compactDot,
              tone === "dark" && styles.darkDot,
              index < filled && styles.filledDot,
              index < filled && tone === "dark" && styles.darkFilledDot,
            ]}
          />
        ),
      )}
    </View>
  );
}

function AnimatedCompletionDot({
  accentColor,
  animation,
  compact,
  homeSize,
  tone,
  variant,
}: {
  accentColor: string;
  animation: SessionDotCompletionAnimation;
  compact: boolean;
  homeSize?: number;
  tone: "dark" | "light";
  variant: "default" | "home" | "v3";
}) {
  const reduceMotion = useReducedMotion();
  const fillScale = useSharedValue(reduceMotion ? 1 : 0);
  const popScale = useSharedValue(1);
  const checkOpacity = useSharedValue(
    reduceMotion && variant === "v3" ? 1 : 0,
  );
  const checkScale = useSharedValue(reduceMotion ? 1 : 0.7);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fillScale.value }],
  }));
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: popScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  useEffect(() => {
    cancelAnimation(fillScale);
    cancelAnimation(popScale);
    cancelAnimation(checkOpacity);
    cancelAnimation(checkScale);

    if (reduceMotion) {
      fillScale.set(1);
      popScale.set(1);
      checkOpacity.set(variant === "v3" ? 1 : 0);
      checkScale.set(1);
      return;
    }

    const delay = animation.delayMs ?? 0;
    fillScale.set(0);
    popScale.set(1);
    checkOpacity.set(0);
    checkScale.set(0.7);

    fillScale.set(
      withDelay(
        delay,
        withTiming(1, {
          duration: 170,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    popScale.set(
      withDelay(
        delay + 170,
        withSequence(
          withSpring(1.14, {
            damping: 16,
            mass: 0.36,
            reduceMotion: ReduceMotion.System,
            stiffness: 390,
          }),
          withTiming(1, {
            duration: 140,
            reduceMotion: ReduceMotion.System,
          }),
        ),
      ),
    );
    checkOpacity.set(
      withDelay(
        delay + 170,
        withSequence(
          withTiming(1, { duration: 90, reduceMotion: ReduceMotion.System }),
          withDelay(
            170,
            withTiming(variant === "v3" ? 1 : 0, {
              duration: 110,
              reduceMotion: ReduceMotion.System,
            }),
          ),
        ),
      ),
    );
    checkScale.set(
      withDelay(
        delay + 170,
        withSpring(1, {
          damping: 17,
          mass: 0.35,
          reduceMotion: ReduceMotion.System,
          stiffness: 410,
        }),
      ),
    );

    return () => {
      cancelAnimation(fillScale);
      cancelAnimation(popScale);
      cancelAnimation(checkOpacity);
      cancelAnimation(checkScale);
    };
  }, [
    animation.delayMs,
    animation.eventKey,
    checkOpacity,
    checkScale,
    fillScale,
    popScale,
    reduceMotion,
    variant,
  ]);

  const isHome = variant === "home";
  const isV3 = variant === "v3";
  const fillColor =
    tone === "dark" && !isV3 ? "#8b67ed" : accentColor;

  return (
    <Animated.View
      style={[
        isV3 ? styles.v3Dot : isHome ? styles.homeDot : styles.dot,
        isHome && { height: homeSize, width: homeSize },
        compact && (isV3 ? styles.v3CompactDot : styles.compactDot),
        !isV3 && tone === "dark" && styles.darkDot,
        styles.animatedDot,
        popStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.animatedFill,
          isV3 && styles.v3AnimatedFill,
          { backgroundColor: fillColor },
          fillStyle,
        ]}
      />
      <Animated.View style={[styles.animatedCheck, checkStyle]}>
        <MaterialCommunityIcons
          color={colors.surface}
          name="check"
          size={compact ? 8 : isV3 ? 13 : isHome ? 19 : 16}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 10,
  },
  compactRow: {
    gap: 5,
  },
  dot: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surfaceElevated,
  },
  compactDot: {
    width: 8,
    height: 8,
  },
  darkDot: {
    borderColor: "#484451",
    backgroundColor: "#28252f",
  },
  filledDot: {
    borderColor: colors.purple,
    backgroundColor: colors.purple,
  },
  darkFilledDot: {
    borderColor: "#8b67ed",
    backgroundColor: "#8b67ed",
  },
  animatedDot: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  animatedFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
  },
  v3AnimatedFill: {
    top: -4,
    right: -4,
    bottom: -4,
    left: -4,
  },
  animatedCheck: {
    alignItems: "center",
    justifyContent: "center",
  },
  v3Row: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  v3Dot: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: v3Colors.progressTrack,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  v3FilledDot: {
    borderWidth: 0,
    borderColor: v3Colors.purple,
    backgroundColor: v3Colors.purple,
  },
  v3CompactDot: {
    width: 14,
    height: 14,
    borderWidth: 3,
  },
  v3Connector: {
    height: 4,
    flex: 1,
    backgroundColor: v3Colors.progressTrack,
  },
  v3CompactConnector: {
    height: 3,
  },
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  homeDot: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    borderWidth: 1.5,
    borderColor: "#77717d",
    borderRadius: 999,
    backgroundColor: "transparent",
  },
  homeFilledDot: {
    borderWidth: 0,
  },
});
