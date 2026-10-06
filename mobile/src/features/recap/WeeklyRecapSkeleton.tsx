import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";

const skeletonColors = {
  background: "#fff8f1",
  block: "#eadfd4",
  ink: "#1a1333",
  lavender: "#f2edff",
  peach: "#fff0e5",
} as const;

function Block({ style }: { style: object }) {
  return <View style={[styles.block, style]} />;
}

function ResultSkeleton({ tone }: { tone: "lavender" | "peach" }) {
  return (
    <View
      style={[
        styles.result,
        tone === "lavender" ? styles.lavender : styles.peach,
      ]}
    >
      <View style={styles.resultHeading}>
        <View style={styles.headingCopy}>
          <Block style={styles.eyebrow} />
          <Block style={styles.resultTitle} />
        </View>
        <Block style={styles.resultCount} />
      </View>
      {Array.from({ length: 2 }, (_, index) => (
        <View key={index} style={styles.row}>
          <Block style={styles.avatar} />
          <View style={styles.rowCopy}>
            <Block style={styles.name} />
            <Block style={styles.username} />
          </View>
          <Block style={styles.progress} />
        </View>
      ))}
    </View>
  );
}

export function WeeklyRecapSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading weekly recap">
      <View style={styles.header}>
        <Block style={styles.headerCircle} />
        <Text style={styles.headerTitle}>
          Recap<Text style={styles.titlePeriod}>.</Text>
        </Text>
        <View style={styles.headerCircle} />
      </View>
      <View style={styles.weekHeading}>
        <Block style={styles.weekLabel} />
        <Block style={styles.weekRange} />
      </View>
      <View style={styles.results}>
        <ResultSkeleton tone="lavender" />
        <ResultSkeleton tone="peach" />
      </View>
      <Block style={styles.commentary} />
      <View style={styles.stats}>
        <Block style={styles.statsEyebrow} />
        <Block style={styles.statsTitle} />
        <Block style={styles.statsRow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: skeletonColors.block },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerCircle: { width: 38, height: 38, borderRadius: 19 },
  headerTitle: {
    color: skeletonColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
  },
  titlePeriod: { color: "#5b3df6" },
  weekHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekLabel: { width: 70, height: 10, borderRadius: 4 },
  weekRange: { width: 82, height: 10, borderRadius: 4 },
  results: { gap: 14, marginTop: 18 },
  result: {
    overflow: "hidden",
    minHeight: 180,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingTop: 16,
  },
  lavender: { backgroundColor: skeletonColors.lavender },
  peach: { backgroundColor: skeletonColors.peach },
  resultHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: 13,
  },
  headingCopy: { gap: 8 },
  eyebrow: { width: 54, height: 9, borderRadius: 4 },
  resultTitle: { width: 150, height: 17, borderRadius: 6 },
  resultCount: { width: 20, height: 24, borderRadius: 6 },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: skeletonColors.block,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  rowCopy: { flex: 1, gap: 5 },
  name: { width: 86, height: 11, borderRadius: 4 },
  username: { width: 62, height: 8, borderRadius: 4 },
  progress: { width: 34, height: 17, borderRadius: 5 },
  commentary: { height: 50, marginTop: 18, borderRadius: 9 },
  stats: {
    marginTop: 18,
    borderRadius: 20,
    backgroundColor: "#fffcf6",
    padding: 15,
  },
  statsEyebrow: { width: 95, height: 8, borderRadius: 4 },
  statsTitle: { width: 176, height: 17, marginTop: 8, borderRadius: 5 },
  statsRow: { height: 45, marginTop: 14, borderRadius: 9 },
});
