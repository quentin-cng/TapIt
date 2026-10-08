import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRef, useState } from "react";
import {
  Pressable,
  type ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  type SharedValue,
  useAnimatedScrollHandler,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { fonts, v3Colors } from "../../theme/tokens";
import { NfcIntroScene } from "./intro/NfcIntroScene";
import { SocialIntroScene } from "./intro/SocialIntroScene";
import { WeeklyGoalIntroScene } from "./intro/WeeklyGoalIntroScene";

const SLIDE_COUNT = 3;

export type IntroSceneMotionProps = {
  active: boolean;
  pagerProgress: SharedValue<number>;
  reduceMotion: boolean;
};

type IntroPagerProps = {
  onComplete: () => void;
  onExit?: () => void;
  onSignIn: () => void;
  preview?: boolean;
};

export function IntroPager({
  onComplete,
  onExit,
  onSignIn,
  preview = false,
}: IntroPagerProps) {
  const { width } = useWindowDimensions();
  const pagerRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerProgress = useSharedValue(0);
  const reducedMotion = Boolean(useReducedMotion());
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      pagerProgress.set(event.contentOffset.x / Math.max(width, 1));
    },
  });

  function moveTo(index: number) {
    pagerRef.current?.scrollTo({ animated: !reducedMotion, x: index * width });
    setActiveIndex(index);
    if (reducedMotion) pagerProgress.set(index);
  }

  function continueForward() {
    if (activeIndex === SLIDE_COUNT - 1) {
      onComplete();
      return;
    }

    moveTo(activeIndex + 1);
  }

  const motionProps = (index: number): IntroSceneMotionProps => ({
    active: activeIndex === index,
    pagerProgress,
    reduceMotion: reducedMotion,
  });
  const slideMotion = [motionProps(0), motionProps(1), motionProps(2)];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>
          Tap<Text style={styles.wordmarkAccent}>It</Text>
        </Text>
        {onExit ? (
          <Pressable
            accessibilityLabel="Close onboarding preview"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onExit}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              color={v3Colors.ink}
              name="close"
              size={24}
            />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.signInTop}>Sign in</Text>
          </Pressable>
        )}
      </View>

      {preview ? <Text style={styles.previewLabel}>DEV PREVIEW</Text> : null}

      <Animated.ScrollView
        ref={pagerRef}
        accessibilityLabel="TapIt introduction"
        bounces={false}
        decelerationRate="fast"
        horizontal
        onMomentumScrollEnd={(event) => {
          setActiveIndex(
            Math.max(
              0,
              Math.min(
                SLIDE_COUNT - 1,
                Math.round(
                  event.nativeEvent.contentOffset.x / Math.max(width, 1),
                ),
              ),
            ),
          );
        }}
        onScroll={scrollHandler}
        pagingEnabled
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        <IntroSlide
          copy="Tap your phone at your fitness spot to check in."
          index={0}
          motion={slideMotion[0]}
          title="Welcome to TapIt"
          width={width}
        >
          <NfcIntroScene {...slideMotion[0]} />
        </IntroSlide>
        <IntroSlide
          copy="Set a weekly goal and earn points for showing up."
          index={1}
          motion={slideMotion[1]}
          title="Build consistency"
          width={width}
        >
          <WeeklyGoalIntroScene {...slideMotion[1]} />
        </IntroSlide>
        <IntroSlide
          copy="Compete with friends and keep each other going."
          index={2}
          motion={slideMotion[2]}
          title="Better together"
          width={width}
        >
          <SocialIntroScene {...slideMotion[2]} />
        </IntroSlide>
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View accessibilityLabel={`Slide ${activeIndex + 1} of ${SLIDE_COUNT}`} style={styles.dots}>
          {Array.from({ length: SLIDE_COUNT }, (_, index) => (
            <Pressable
              accessibilityLabel={`Go to slide ${index + 1}`}
              accessibilityRole="button"
              hitSlop={8}
              key={index}
              onPress={() => moveTo(index)}
              style={[
                styles.dot,
                index === activeIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={continueForward}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {activeIndex === SLIDE_COUNT - 1 ? "Get started" : "Continue"}
          </Text>
          <MaterialCommunityIcons
            color="#fffaf1"
            name="arrow-right"
            size={20}
          />
        </Pressable>
        {!onExit ? (
          <Pressable
            accessibilityRole="button"
            onPress={onSignIn}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.existingAccount}>
              I already have an account
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function IntroSlide({
  children,
  copy,
  index,
  motion,
  title,
  width,
}: {
  children: React.ReactNode;
  copy: string;
  index: number;
  motion: IntroSceneMotionProps;
  title: string;
  width: number;
}) {
  return (
    <View
      accessibilityElementsHidden={!motion.active}
      importantForAccessibility={motion.active ? "auto" : "no-hide-descendants"}
      style={[styles.slide, { width }]}
    >
      <View style={styles.scene}>{children}</View>
      <View style={styles.slideCopy}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}<Text style={styles.period}>.</Text>
        </Text>
        <Text style={styles.copy}>{copy}</Text>
        <Text style={styles.slideNumber}>0{index + 1}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff8ed" },
  topBar: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
  },
  wordmark: {
    color: v3Colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -1,
  },
  wordmarkAccent: { color: v3Colors.purple },
  signInTop: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 13,
    paddingVertical: 8,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    alignSelf: "center",
    color: v3Colors.purple,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  slide: { flex: 1, paddingHorizontal: 24, paddingTop: 8 },
  scene: {
    minHeight: 260,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  slideCopy: { minHeight: 180, justifyContent: "center" },
  title: {
    maxWidth: 350,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 42,
    letterSpacing: -2,
    lineHeight: 46,
  },
  period: { color: v3Colors.purple },
  copy: {
    maxWidth: 330,
    marginTop: 10,
    color: "#6f6475",
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 23,
  },
  slideNumber: {
    position: "absolute",
    right: 2,
    bottom: 18,
    color: "#d5c8e5",
    fontFamily: fonts.display,
    fontSize: 34,
  },
  footer: { gap: 14, paddingHorizontal: 24, paddingBottom: 18 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 7 },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#d8cee2",
  },
  dotActive: { width: 22, backgroundColor: v3Colors.purple },
  primaryButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 17,
    backgroundColor: v3Colors.ink,
  },
  primaryButtonText: {
    color: "#fffaf1",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  existingAccount: {
    alignSelf: "center",
    color: v3Colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 13,
    paddingVertical: 4,
  },
  pressed: { opacity: 0.68 },
});
