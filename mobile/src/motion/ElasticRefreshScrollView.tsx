import { useMemo, type PropsWithChildren } from "react";
import {
  type LayoutChangeEvent,
  Platform,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const MAX_ELASTIC_TRANSLATION = 68;
const RESISTANCE_DISTANCE = 72;
const EDGE_TOLERANCE = 1;
const ACTIVATION_DISTANCE = 4;
const HORIZONTAL_FAIL_DISTANCE = 12;

const EDGE_NONE = 0;
const EDGE_TOP = 1;
const EDGE_BOTTOM = -1;

type ElasticRefreshScrollViewProps = PropsWithChildren<
  Omit<ScrollViewProps, "onScroll">
>;

export function ElasticRefreshScrollView({
  children,
  onContentSizeChange,
  onLayout,
  refreshControl,
  scrollEventThrottle,
  ...props
}: ElasticRefreshScrollViewProps) {
  const reduceMotion = useReducedMotion();
  const scrollY = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const touchStartX = useSharedValue(0);
  const touchStartY = useSharedValue(0);
  const edgeStartY = useSharedValue(0);
  const activeEdge = useSharedValue(EDGE_NONE);
  const translationY = useSharedValue(0);
  const shouldAddElasticity =
    Platform.OS === "android" && Boolean(refreshControl) && !reduceMotion;

  const animatedContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translationY.value }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(Math.max(0, event.contentOffset.y));
    },
  });

  const gesture = useMemo(() => {
    const nativeGesture = Gesture.Native();
    const pullGesture = Gesture.Pan()
      .enabled(shouldAddElasticity)
      .manualActivation(true)
      .cancelsTouchesInView(false)
      .onTouchesDown((event) => {
        const touch = event.allTouches[0];
        if (!touch) return;

        touchStartX.set(touch.absoluteX);
        touchStartY.set(touch.absoluteY);
        edgeStartY.set(touch.absoluteY);
        activeEdge.set(EDGE_NONE);
      })
      .onTouchesMove((event, stateManager) => {
        const touch = event.allTouches[0];
        if (!touch || activeEdge.value !== EDGE_NONE) return;

        const deltaX = touch.absoluteX - touchStartX.value;
        const deltaY = touch.absoluteY - touchStartY.value;
        const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

        if (
          Math.abs(deltaX) > HORIZONTAL_FAIL_DISTANCE &&
          Math.abs(deltaX) >= Math.abs(deltaY)
        ) {
          stateManager.fail();
          return;
        }

        if (!isVertical || Math.abs(deltaY) < ACTIVATION_DISTANCE) return;

        const isAtTop = scrollY.value <= EDGE_TOLERANCE;
        const isAtBottom =
          viewportHeight.value > 0 &&
          contentHeight.value > 0 &&
          scrollY.value + viewportHeight.value >=
            contentHeight.value - EDGE_TOLERANCE;

        if (isAtTop && deltaY > 0) {
          activeEdge.set(EDGE_TOP);
          edgeStartY.set(touch.absoluteY);
          stateManager.activate();
        } else if (isAtBottom && deltaY < 0) {
          activeEdge.set(EDGE_BOTTOM);
          edgeStartY.set(touch.absoluteY);
          stateManager.activate();
        }
      })
      .onUpdate((event) => {
        const edge = activeEdge.value;
        const rawDistance =
          edge === EDGE_TOP
            ? Math.max(0, event.absoluteY - edgeStartY.value)
            : Math.max(0, edgeStartY.value - event.absoluteY);
        const resistedDistance =
          (MAX_ELASTIC_TRANSLATION * rawDistance) /
          (rawDistance + RESISTANCE_DISTANCE);

        translationY.set(
          edge === EDGE_BOTTOM ? -resistedDistance : resistedDistance,
        );
      })
      .onFinalize(() => {
        activeEdge.set(EDGE_NONE);
        translationY.set(
          withSpring(0, {
            damping: 22,
            mass: 0.45,
            overshootClamping: true,
            reduceMotion: ReduceMotion.System,
            stiffness: 260,
          }),
        );
      });

    return Gesture.Simultaneous(pullGesture, nativeGesture);
  }, [
    activeEdge,
    contentHeight,
    edgeStartY,
    scrollY,
    shouldAddElasticity,
    touchStartX,
    touchStartY,
    translationY,
    viewportHeight,
  ]);

  function handleContentSizeChange(width: number, height: number) {
    contentHeight.set(height);
    onContentSizeChange?.(width, height);
  }

  function handleLayout(event: LayoutChangeEvent) {
    viewportHeight.set(event.nativeEvent.layout.height);
    onLayout?.(event);
  }

  if (!shouldAddElasticity) {
    return (
      <ScrollView
        {...props}
        onContentSizeChange={onContentSizeChange}
        onLayout={onLayout}
        refreshControl={refreshControl}
        scrollEventThrottle={scrollEventThrottle}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <GestureDetector gesture={gesture}>
      <Animated.ScrollView
        {...props}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        onScroll={scrollHandler}
        overScrollMode="never"
        refreshControl={refreshControl}
        scrollEventThrottle={scrollEventThrottle ?? 16}
      >
        <Animated.View style={[styles.contentSurface, animatedContentStyle]}>
          {children}
        </Animated.View>
      </Animated.ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  contentSurface: {
    flexGrow: 1,
  },
});
