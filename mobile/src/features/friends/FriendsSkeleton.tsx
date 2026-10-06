import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";

const skeletonColors = {
  background: "#fff8f1",
  block: "#eadfd4",
  ink: "#1a1333",
} as const;

function Block({ style }: { style: object }) {
  return <View style={[styles.block, style]} />;
}

export function FriendsSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading friends" style={styles.screen}>
      <View style={styles.header}>
        <Block style={styles.headerCircle} />
        <Text style={styles.title}>
          Friends<Text style={styles.titlePeriod}>.</Text>
        </Text>
        <Block style={styles.headerCircle} />
      </View>

      <View style={styles.rows}>
        {Array.from({ length: 4 }, (_, index) => (
          <View key={index} style={styles.row}>
            <Block style={styles.avatar} />
            <View style={styles.rowContent}>
              <Block style={styles.name} />
              <View style={styles.progressRow}>
                <Block style={styles.progress} />
                <Block style={styles.count} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <Block style={styles.cta} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: skeletonColors.background },
  block: { backgroundColor: skeletonColors.block },
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  headerCircle: { width: 38, height: 38, borderRadius: 19 },
  title: {
    color: skeletonColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
  },
  titlePeriod: { color: "#5b3df6" },
  rows: {
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: skeletonColors.block,
  },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: skeletonColors.block,
    paddingVertical: 11,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  rowContent: { flex: 1 },
  name: { width: 105, height: 13, borderRadius: 5 },
  progressRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progress: { height: 8, flex: 1, borderRadius: 4 },
  count: { width: 28, height: 10, borderRadius: 4 },
  cta: { height: 54, marginTop: 20, borderRadius: 20 },
});
