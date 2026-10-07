import {
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const podiumArtwork = require("../../../assets/illustrations/leaderboard-background.png");
const block = "#e3d5c8";

function Block({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.block, style]} />;
}

function PodiumPlaceholder({ featured = false }: { featured?: boolean }) {
  return (
    <View style={styles.podiumPlaceholder}>
      <Block style={featured ? styles.avatarLarge : styles.avatarSmall} />
      <Block style={styles.podiumName} />
      <Block style={styles.podiumPoints} />
    </View>
  );
}

export function LeaderboardSkeleton() {
  const { width } = useWindowDimensions();
  const heroHeight = Math.max(292, Math.min(350, width * (1199 / 1312)));

  return (
    <View accessible accessibilityLabel="Loading leaderboard">
      <View style={[styles.hero, { height: heroHeight }]}>
        <Image
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          source={podiumArtwork}
          style={styles.artwork}
        />
        <View style={[styles.podiumSlot, styles.secondSlot]}>
          <PodiumPlaceholder />
        </View>
        <View style={[styles.podiumSlot, styles.firstSlot]}>
          <PodiumPlaceholder featured />
        </View>
        <View style={[styles.podiumSlot, styles.thirdSlot]}>
          <PodiumPlaceholder />
        </View>
      </View>

      <View style={styles.rankingSurface}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: block,
    opacity: 0.82,
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    marginTop: 12,
    marginHorizontal: -20,
    backgroundColor: "#fff8ef",
  },
  artwork: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: [{ translateY: -20 }, { scale: 1.1 }],
  },
  podiumSlot: {
    position: "absolute",
    width: "31%",
    alignItems: "center",
  },
  secondSlot: {
    left: "5.5%",
    bottom: 12,
  },
  firstSlot: {
    left: "34.5%",
    bottom: 33,
  },
  thirdSlot: {
    right: "5.5%",
    bottom: 12,
  },
  podiumPlaceholder: {
    width: "100%",
    alignItems: "center",
    gap: 5,
  },
  avatarSmall: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarLarge: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  podiumName: {
    width: 56,
    height: 10,
    borderRadius: 5,
  },
  podiumPoints: {
    width: 40,
    height: 9,
    borderRadius: 4,
  },
  rankingSurface: {
    zIndex: 2,
    minHeight: 250,
    marginTop: -12,
    marginHorizontal: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff8f1",
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heading: {
    width: 80,
    height: 18,
    marginBottom: 8,
    borderRadius: 6,
  },
  row: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: block,
  },
  rank: {
    width: 20,
    height: 11,
    borderRadius: 4,
  },
  rowAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  rowName: {
    width: 92,
    height: 12,
    borderRadius: 5,
  },
  rowPoints: {
    width: 43,
    height: 11,
    marginLeft: "auto",
    borderRadius: 4,
  },
});
