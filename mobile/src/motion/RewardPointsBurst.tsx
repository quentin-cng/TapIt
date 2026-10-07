import { useEffect, useRef, type ReactNode } from "react";
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

type RewardPointsBurstProps = {
  animationKey: string;
  children: ReactNode;
  delayMs?: number;
};

export function RewardPointsBurst({
  animationKey,
  children,
  delayMs = 0,
}: RewardPointsBurstProps) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(reduceMotion ? 1 : 0);
  const scale = useSharedValue(reduceMotion ? 1 : 0.76);
  const translateY = useSharedValue(reduceMotion ? 0 : 12);
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
    cancelAnimation(scale);
    cancelAnimation(translateY);

    if (reduceMotion) {
      opacity.set(1);
      scale.set(1);
      translateY.set(0);
      return;
    }

    opacity.set(0);
    scale.set(0.76);
    translateY.set(12);

    opacity.set(
      withDelay(
        delayMs,
        withTiming(1, {
          duration: 170,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    translateY.set(
      withDelay(
        delayMs,
        withTiming(0, {
          duration: 360,
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );
    scale.set(
      withDelay(
        delayMs,
        withSequence(
          withSpring(1.06, {
            damping: 17,
            mass: 0.45,
            overshootClamping: false,
            reduceMotion: ReduceMotion.System,
            stiffness: 330,
          }),
          withTiming(1, {
            duration: 150,
            easing: Easing.out(Easing.cubic),
            reduceMotion: ReduceMotion.System,
          }),
        ),
      ),
    );

    return () => {
      cancelAnimation(opacity);
      cancelAnimation(scale);
      cancelAnimation(translateY);
    };
  }, [animationKey, delayMs, opacity, reduceMotion, scale, translateY]);

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
