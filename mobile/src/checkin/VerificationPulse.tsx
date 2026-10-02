import { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fonts } from "../theme/tokens";

export function VerificationPulse({ message }: { message: string }) {
  const [progress] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

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
    if (reduceMotion === null || reduceMotion) return;

    const animation = Animated.loop(
      Animated.timing(progress, {
        duration: 1450,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
    );
    animation.start();

    return () => animation.stop();
  }, [progress, reduceMotion]);

  const outerScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1.7],
  });
  const outerOpacity = progress.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.48, 0.12, 0],
  });
  const innerScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1.25],
  });

  return (
    <View accessible accessibilityLabel={message} style={styles.container}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.pulseArea}
      >
        {!reduceMotion ? (
          <Animated.View
            style={[
              styles.outerRing,
              { opacity: outerOpacity, transform: [{ scale: outerScale }] },
            ]}
          />
        ) : null}
        <Animated.View
          style={[
            styles.innerRing,
            !reduceMotion && { transform: [{ scale: innerScale }] },
          ]}
        >
          <View style={styles.core} />
        </Animated.View>
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: 38,
  },
  pulseArea: {
    width: 138,
    height: 138,
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderWidth: 2,
    borderColor: "#8b67ed",
    borderRadius: 55,
  },
  innerRing: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#7653d9",
    borderRadius: 44,
    backgroundColor: "#251d3d",
  },
  core: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#8b67ed",
  },
  message: {
    color: "#ffffff",
    fontFamily: fonts.semibold,
    fontSize: 18,
    letterSpacing: -0.3,
  },
});
