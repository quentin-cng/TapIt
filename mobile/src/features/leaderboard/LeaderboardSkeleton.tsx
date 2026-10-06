import { StyleSheet, View } from "react-native";

const block = "#eadfd4";

function Block({ style }: { style: object }) {
  return <View style={[styles.block, style]} />;
}

export function LeaderboardSkeleton() {
  return (
    <View accessible accessibilityLabel="Loading leaderboard">
      <View style={styles.podium}>
        <View style={styles.podiumRow}>
          <View style={styles.podiumSlot}>
            <Block style={styles.avatarSmall} />
            <Block style={styles.name} />
            <Block style={styles.points} />
          </View>
          <View style={[styles.podiumSlot, styles.firstSlot]}>
            <Block style={styles.avatarLarge} />
            <Block style={styles.name} />
            <Block style={styles.points} />
          </View>
          <View style={styles.podiumSlot}>
            <Block style={styles.avatarSmall} />
            <Block style={styles.name} />
            <Block style={styles.points} />
          </View>
        </View>
      </View>

      <Block style={styles.heading} />
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.row}>
          <Block style={styles.rank} />
          <Block style={styles.rowAvatar} />
          <Block style={styles.rowName} />
          <Block style={styles.rowPoints} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: block },
  podium: {
    height: 224,
    marginTop: 13,
    borderRadius: 24,
    backgroundColor: "#f4e9df",
    paddingHorizontal: 10,
    paddingBottom: 22,
  },
  podiumRow: { flex: 1, flexDirection: "row", alignItems: "flex-end" },
  podiumSlot: { flex: 1, alignItems: "center", gap: 7 },
  firstSlot: { paddingBottom: 29 },
  avatarSmall: { width: 56, height: 56, borderRadius: 28 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36 },
  name: { width: 56, height: 11, borderRadius: 5 },
  points: { width: 40, height: 9, borderRadius: 4 },
  heading: { width: 80, height: 18, marginTop: 20, borderRadius: 6 },
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: block,
  },
  rank: { width: 20, height: 11, borderRadius: 4 },
  rowAvatar: { width: 38, height: 38, borderRadius: 19 },
  rowName: { width: 92, height: 12, borderRadius: 5 },
  rowPoints: {
    width: 43,
    height: 11,
    marginLeft: "auto",
    borderRadius: 4,
  },
});
