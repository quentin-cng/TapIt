import { useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type AnimatedPointsProps = {
  accessibilityLabel: string;
  animationKey: string;
  containerStyle?: StyleProp<ViewStyle>;
  delayMs?: number;
  endValue: number;
  format?: "grouped" | "plain";
  startValue: number;
  style?: StyleProp<TextStyle>;
};

function getDuration(startValue: number, endValue: number) {
  const delta = Math.abs(endValue - startValue);
  return Math.min(700, 450 + Math.round(Math.log10(delta + 1) * 100));
}

export function AnimatedPoints({
  accessibilityLabel,
  animationKey,
  containerStyle,
  delayMs = 0,
  endValue,
  format = "plain",
  startValue,
  style,
}: AnimatedPointsProps) {
  const reduceMotion = useReducedMotion();
  const value = useSharedValue(reduceMotion ? endValue : startValue);
  const lastAnimationKey = useRef<string | null>(null);

  const animatedProps = useAnimatedProps(() => {
    const roundedValue = Math.round(value.value);
    const text =
      format === "grouped"
        ? formatGroupedInteger(roundedValue)
        : String(roundedValue);
    return { defaultValue: text, text };
  });

  useEffect(() => {
    if (lastAnimationKey.current === animationKey) return;
    lastAnimationKey.current = animationKey;
    cancelAnimation(value);

    if (reduceMotion || startValue === endValue) {
      value.set(endValue);
      return;
    }

    value.set(startValue);
    value.set(
      withDelay(
        delayMs,
        withTiming(endValue, {
          duration: getDuration(startValue, endValue),
          easing: Easing.out(Easing.cubic),
          reduceMotion: ReduceMotion.System,
        }),
      ),
    );

    return () => cancelAnimation(value);
  }, [animationKey, delayMs, endValue, reduceMotion, startValue, value]);

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      style={containerStyle}
    >
      <AnimatedTextInput
        accessibilityElementsHidden
        animatedProps={animatedProps}
        caretHidden
        editable={false}
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[styles.value, style]}
        underlineColorAndroid="transparent"
      />
    </View>
  );
}

function formatGroupedInteger(value: number) {
  "worklet";
  const sign = value < 0 ? "-" : "";
  let remaining = String(Math.abs(value));
  let grouped = "";

  while (remaining.length > 3) {
    grouped = `,${remaining.slice(-3)}${grouped}`;
    remaining = remaining.slice(0, -3);
  }

  return `${sign}${remaining}${grouped}`;
}

const styles = StyleSheet.create({
  value: {
    margin: 0,
    padding: 0,
  },
});
