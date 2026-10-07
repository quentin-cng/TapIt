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
            <Block style={styles.weekEyebrow} />
            <Block style={styles.weekGoalLabel} />
          </View>
          <Block style={styles.weekTitle} />
          <View style={styles.dotRow}>
            {Array.from({ length: 4 }, (_, index) => (
              <Block key={index} style={styles.dot} />
            ))}
          </View>
        </View>

        <View style={styles.socialCard}>
          <Block style={styles.socialIcon} />
          <View style={styles.socialCopy}>
            <Block style={styles.socialMessage} />
            <Block style={styles.socialDetail} />
          </View>
          <Block style={styles.chevron} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Block style={styles.summaryIcon} />
            <View style={styles.summaryCopy}>
              <Block style={styles.summaryTitle} />
              <Block style={styles.summarySubtitle} />
            </View>
          </View>
          <View style={styles.summaryCard}>
            <Block style={styles.summaryIcon} />
            <View style={styles.summaryCopy}>
              <Block style={styles.summaryTitle} />
              <Block style={styles.summarySubtitle} />
            </View>
          </View>
        </View>

        <Block style={styles.rewardsCta} />
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
    marginTop: -28,
    marginHorizontal: -20,
    gap: 12,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: skeleton.cream,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 18,
  },
  weekCard: {
    minHeight: 154,
    borderWidth: 1,
    borderColor: skeleton.base,
    borderRadius: 18,
    backgroundColor: skeleton.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekEyebrow: {
    width: 72,
    height: 10,
    borderRadius: 5,
  },
  weekGoalLabel: {
    width: 76,
    height: 11,
    borderRadius: 5,
  },
  weekTitle: {
    width: 185,
    height: 27,
    marginTop: 8,
    borderRadius: 8,
  },
  dotRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  socialCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: skeleton.base,
    borderRadius: 18,
    backgroundColor: skeleton.surface,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  socialCopy: {
    minWidth: 0,
    flex: 1,
    gap: 7,
  },
  socialMessage: {
    width: "88%",
    height: 15,
    borderRadius: 6,
  },
  socialDetail: {
    width: "70%",
    height: 10,
    borderRadius: 5,
  },
  chevron: {
    width: 8,
    height: 20,
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    minWidth: 0,
    minHeight: 88,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: skeleton.base,
    borderRadius: 18,
    backgroundColor: skeleton.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  summaryCopy: {
    minWidth: 0,
    flex: 1,
    gap: 7,
  },
  summaryTitle: {
    width: "86%",
    height: 14,
    borderRadius: 6,
  },
  summarySubtitle: {
    width: "72%",
    height: 10,
    borderRadius: 5,
  },
  rewardsCta: {
    minHeight: 70,
    borderRadius: 17,
    backgroundColor: "#d8cfc7",
  },
});
