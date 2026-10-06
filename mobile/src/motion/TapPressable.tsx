import { useRef } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
} from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { triggerTapHaptic, type TapHaptic } from "./haptics";

type TapPressableProps = PressableProps & {
  haptic?: TapHaptic;
};

export function TapPressable({
  disabled = false,
  haptic,
  onPressIn,
  onPressOut,
  style,
  ...props
}: TapPressableProps) {
  const scale = useSharedValue(1);
  const reduceMotion = useReducedMotion();
  const isPressed = useRef(false);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn(event: GestureResponderEvent) {
    if (disabled || isPressed.current) return;

    isPressed.current = true;
    scale.set(
      reduceMotion
        ? 1
        : withTiming(0.97, {
            duration: 65,
            reduceMotion: ReduceMotion.System,
          }),
    );

    if (haptic) triggerTapHaptic(haptic);
    onPressIn?.(event);
  }

  function handlePressOut(event: GestureResponderEvent) {
    if (!isPressed.current) return;

    isPressed.current = false;
    scale.set(
      reduceMotion
        ? 1
        : withSpring(1, {
            damping: 24,
            mass: 0.42,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System,
            stiffness: 420,
          }),
    );
    onPressOut?.(event);
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={style}
      />
    </Animated.View>
  );
}
