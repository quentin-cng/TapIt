import {
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

const podiumArtwork = require("../../../assets/illustrations/leaderboard-background.png");

type PodiumRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

function PodiumParticipant({
  featured = false,
  row,
}: {
  featured?: boolean;
  row: PodiumRow;
}) {
  const visibleName = row.isCurrentUser ? "You" : row.displayName;

  return (
    <View
      accessible
      accessibilityLabel={`Rank ${row.rank}, ${visibleName}, ${row.totalPoints} points`}
      style={styles.participant}
    >
      <View
        style={[
          styles.avatarRing,
          featured && styles.featuredAvatarRing,
          row.isCurrentUser && styles.currentUserAvatarRing,
        ]}
      >
        <TapItAvatar avatarId={row.avatarId} size={featured ? 56 : 38} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.name, featured && styles.featuredName]}
      >
        {visibleName}
      </Text>
      <Text
        adjustsFontSizeToFit
        numberOfLines={1}
        style={[styles.points, featured && styles.featuredPoints]}
      >
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)}
        <Text style={styles.pointsSuffix}> pts</Text>
      </Text>
    </View>
  );
}

export function LeaderboardPodium({ rows }: { rows: PodiumRow[] }) {
  const { width } = useWindowDimensions();
  const heroHeight = Math.max(292, Math.min(350, width * (1199 / 1312)));
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  return (
    <View style={[styles.hero, { height: heroHeight }]}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={podiumArtwork}
        style={styles.artwork}
      />

      {second ? (
        <View style={[styles.slot, styles.secondSlot]}>
          <PodiumParticipant row={second} />
        </View>
      ) : null}
      {first ? (
        <View style={[styles.slot, styles.firstSlot]}>
          <PodiumParticipant featured row={first} />
        </View>
      ) : null}
      {third ? (
        <View style={[styles.slot, styles.thirdSlot]}>
          <PodiumParticipant row={third} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
  slot: {
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
  participant: {
    width: "100%",
    alignItems: "center",
  },
  avatarRing: {
    padding: 2,
    borderWidth: 2,
    borderColor: "rgba(255, 248, 241, 0.88)",
    borderRadius: 999,
    backgroundColor: "rgba(255, 248, 241, 0.28)",
  },
  featuredAvatarRing: {
    padding: 3,
    borderColor: "#ffc85c",
  },
  currentUserAvatarRing: {
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  name: {
    width: "94%",
    color: "#fff8f1",
    fontFamily: fonts.semibold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
  featuredName: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 19,
  },
  points: {
    width: "90%",
    marginTop: 1,
    color: "rgba(255, 248, 241, 0.9)",
    fontFamily: fonts.display,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  featuredPoints: {
    color: "#ffffff",
    fontSize: 17,
  },
  pointsSuffix: {
    fontFamily: fonts.regular,
    fontSize: 9,
  },
});
