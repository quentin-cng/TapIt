import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type ParticleDefinition = {
  duration: number;
  driftX: number;
  driftY: number;
  left: `${number}%`;
  opacity: number;
  phase: number;
  size: number;
  top: `${number}%`;
};

const HOME_PARTICLES: readonly ParticleDefinition[] = [
  { left: "60%", top: "18%", size: 2, opacity: 0.3, driftX: 13, driftY: -38, duration: 9200, phase: 0.22 },
  { left: "82%", top: "27%", size: 3, opacity: 0.36, driftX: -17, driftY: 43, duration: 12800, phase: 0.67 },
  { left: "70%", top: "42%", size: 4, opacity: 0.28, driftX: 15, driftY: 35, duration: 11200, phase: 0.41 },
  { left: "91%", top: "51%", size: 2, opacity: 0.42, driftX: -12, driftY: -34, duration: 7800, phase: 0.76 },
  { left: "55%", top: "64%", size: 3, opacity: 0.33, driftX: -14, driftY: -46, duration: 13800, phase: 0.54 },
  { left: "77%", top: "73%", size: 5, opacity: 0.26, driftX: 18, driftY: 40, duration: 12100, phase: 0.13 },
  { left: "89%", top: "12%", size: 2, opacity: 0.38, driftX: 12, driftY: 33, duration: 8600, phase: 0.88 },
  { left: "48%", top: "32%", size: 3, opacity: 0.29, driftX: -13, driftY: 37, duration: 10400, phase: 0.35 },
  { left: "65%", top: "79%", size: 2, opacity: 0.4, driftX: 14, driftY: -36, duration: 9700, phase: 0.72 },
  { left: "95%", top: "67%", size: 4, opacity: 0.27, driftX: -18, driftY: 42, duration: 13200, phase: 0.18 },
  { left: "40%", top: "22%", size: 2, opacity: 0.34, driftX: 12, driftY: -35, duration: 11800, phase: 0.61 },
  { left: "73%", top: "57%", size: 3, opacity: 0.31, driftX: -15, driftY: 39, duration: 8900, phase: 0.28 },
  { left: "52%", top: "84%", size: 4, opacity: 0.25, driftX: 17, driftY: -41, duration: 13600, phase: 0.81 },
] as const;

function AmbientParticle({ particle }: { particle: ParticleDefinition }) {
  const progress = useSharedValue(particle.phase);

  useEffect(() => {
    cancelAnimation(progress);
    progress.set(particle.phase);

    const firstTarget = particle.phase < 0.5 ? 1 : 0;
    const oppositeTarget = firstTarget === 1 ? 0 : 1;
    const firstDuration = Math.max(
      500,
      particle.duration * Math.abs(firstTarget - particle.phase),
    );

    progress.set(
      withSequence(
        withTiming(firstTarget, {
          duration: firstDuration,
          easing: Easing.inOut(Easing.sin),
          reduceMotion: ReduceMotion.System,
        }),
        withRepeat(
          withTiming(oppositeTarget, {
            duration: particle.duration,
            easing: Easing.inOut(Easing.sin),
            reduceMotion: ReduceMotion.System,
          }),
          -1,
          true,
          undefined,
          ReduceMotion.System,
        ),
      ),
    );

    return () => cancelAnimation(progress);
  }, [particle, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [0, particle.driftX],
        ),
      },
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [0, particle.driftY],
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.left,
          top: particle.top,
          width: particle.size,
          height: particle.size,
          borderRadius: particle.size / 2,
          opacity: particle.opacity,
        },
        animatedStyle,
      ]}
    />
  );
}

export function HomeAmbientParticles() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={styles.layer}
    >
      {HOME_PARTICLES.map((particle, index) => (
        <AmbientParticle key={index} particle={particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  particle: {
    position: "absolute",
    backgroundColor: "#8f72da",
  },
});
