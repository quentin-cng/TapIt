import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const skeleton = {
  base: "#eadfd4",
  cream: "#fff8f1",
  surface: "#fffcf6",
} as const;

function Block({ style }: { style: object }) {
  return <View style={[styles.block, style]} />;
}

export function HomeSkeleton() {
  const insets = useSafeAreaInsets();
  const heroTopOffset = insets.top + 20;
  const heroHeight = 342 + heroTopOffset;

  return (
    <View accessible accessibilityLabel="Loading Home" style={styles.container}>
      <View style={[styles.hero, { height: heroHeight }]}>
        <View style={[styles.topbar, { paddingTop: heroTopOffset }]}>
          <Block style={styles.avatar} />
        </View>
        <View style={[styles.points, { top: heroTopOffset + 55 }]}>
          <Block style={styles.pointsValue} />
          <Block style={styles.pointsLabel} />
          <Block style={styles.rewardsLink} />
        </View>
        <Block style={styles.illustration} />
      </View>

      <View style={styles.contentPanel}>
        <View style={styles.weekCard}>
          <View style={styles.row}>
            <Block style={styles.weekTitle} />
            <Block style={styles.weekCount} />
          </View>
          <View style={styles.weekProgress}>
            <View style={styles.dotRow}>
              {Array.from({ length: 4 }, (_, index) => (
                <Block key={index} style={styles.dot} />
              ))}
            </View>
            <Block style={styles.remaining} />
          </View>
        </View>

        <View style={styles.streakCard}>
          <Block style={styles.flame} />
          <View style={styles.streakCopy}>
            <Block style={styles.streakTitle} />
            <Block style={styles.streakMessage} />
          </View>
        </View>

        <Block style={styles.cta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: skeleton.cream,
  },
  block: {
    backgroundColor: skeleton.base,
  },
  topbar: {
    zIndex: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  hero: {
    marginHorizontal: -20,
    overflow: "hidden",
  },
  points: {
    position: "absolute",
    zIndex: 1,
    left: 24,
  },
  pointsValue: {
    width: 127,
    height: 62,
    borderRadius: 12,
  },
  pointsLabel: {
    width: 64,
    height: 18,
    marginTop: 5,
    borderRadius: 8,
  },
  rewardsLink: {
    width: 87,
    height: 11,
    marginTop: 9,
    borderRadius: 5,
  },
  illustration: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  contentPanel: {
    zIndex: 2,
    marginTop: -26,
    marginHorizontal: -20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: skeleton.surface,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  weekCard: {
    paddingHorizontal: 4,
    paddingBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekTitle: {
    width: 86,
    height: 20,
    borderRadius: 7,
  },
  weekCount: {
    width: 51,
    height: 25,
    borderRadius: 7,
  },
  weekProgress: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  dotRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dot: {
    width: 23,
    height: 23,
    borderRadius: 12,
  },
  remaining: {
    width: 42,
    height: 11,
    borderRadius: 5,
  },
  streakCard: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: skeleton.base,
    paddingHorizontal: 4,
  },
  flame: {
    width: 42,
    height: 42,
    borderRadius: 14,
  },
  streakCopy: {
    gap: 8,
  },
  streakTitle: {
    width: 113,
    height: 17,
    borderRadius: 6,
  },
  streakMessage: {
    width: 151,
    height: 12,
    borderRadius: 5,
  },
  cta: {
    height: 54,
    marginTop: 8,
    borderRadius: 19,
  },
});
