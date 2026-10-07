import { StyleSheet, Text, View } from "react-native";
import { fonts } from "../../theme/tokens";
import { FriendsHero } from "./FriendsHero";

const skeletonColors = {
  background: "#faeee3",
  surface: "#fffcf6",
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
        <View style={styles.headerBalance} />
      </View>

      <FriendsHero />

      <View style={styles.contentSurface}>
        <Block style={styles.search} />

        <View style={styles.tabs}>
          <Block style={styles.activeTab} />
          <Block style={styles.inactiveTab} />
        </View>

        <View style={styles.rows}>
          {Array.from({ length: 3 }, (_, index) => (
            <View key={index} style={styles.row}>
              <Block style={styles.avatar} />
              <View style={styles.rowContent}>
                <Block style={styles.name} />
                <Block style={styles.username} />
                <Block style={styles.streak} />
              </View>
              <View style={styles.pointsBlock}>
                <Block style={styles.points} />
                <Block style={styles.pointsLabel} />
              </View>
            </View>
          ))}
        </View>
      </View>
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
    marginBottom: 2,
  },
  headerCircle: { width: 38, height: 38, borderRadius: 19 },
  headerBalance: { width: 38, height: 38 },
  title: {
    position: "absolute",
    right: 52,
    left: 52,
    color: skeletonColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
    letterSpacing: -1,
    textAlign: "center",
  },
  titlePeriod: { color: "#5b3df6" },
  contentSurface: {
    zIndex: 2,
    minHeight: 300,
    marginTop: -22,
    marginHorizontal: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff8f1",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  search: {
    height: 42,
    borderRadius: 21,
  },
  tabs: {
    minHeight: 46,
    flexDirection: "row",
    gap: 4,
    marginTop: 14,
    borderWidth: 1,
    borderColor: skeletonColors.block,
    borderRadius: 20,
    backgroundColor: skeletonColors.surface,
    padding: 3,
  },
  activeTab: { flex: 1, borderRadius: 16, backgroundColor: "#d9cde0" },
  inactiveTab: { flex: 1, borderRadius: 16 },
  rows: {
    overflow: "hidden",
    marginTop: 14,
    borderWidth: 1,
    borderColor: skeletonColors.block,
    borderRadius: 22,
    backgroundColor: skeletonColors.surface,
    paddingHorizontal: 14,
  },
  row: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: skeletonColors.block,
    paddingVertical: 12,
  },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  rowContent: { minWidth: 0, flex: 1, gap: 5 },
  name: { width: 105, height: 12, borderRadius: 5 },
  username: { width: 68, height: 8, borderRadius: 4 },
  streak: { width: 82, height: 9, borderRadius: 4 },
  pointsBlock: { width: 50, alignItems: "flex-end", gap: 4 },
  points: { width: 45, height: 14, borderRadius: 5 },
  pointsLabel: { width: 28, height: 7, borderRadius: 3 },
});
