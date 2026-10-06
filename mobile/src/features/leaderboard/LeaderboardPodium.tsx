import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { colors, fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type PodiumRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

const podiumColors = {
  ink: "#1a1333",
  purple: "#5b3df6",
  lavender: "#e8defc",
  peach: "#ffd6b7",
  gold: "#efaa3a",
  silver: "#8b80a2",
  bronze: "#c76b45",
} as const;

function PodiumParticipant({
  featured,
  row,
}: {
  featured: boolean;
  row: PodiumRow;
}) {
  const identityKey = row.username ?? `${row.displayName}-${row.rank}`;
  const visibleName = row.isCurrentUser ? "You" : row.displayName;

  return (
    <View
      accessibilityLabel={`Rank ${row.rank}, ${visibleName}, ${row.totalPoints} points`}
      style={[styles.participant, featured && styles.featuredParticipant]}
    >
      {featured ? (
        <MaterialCommunityIcons
          color={podiumColors.gold}
          name="crown"
          size={23}
          style={styles.crown}
        />
      ) : null}

      <View
        style={[
          styles.avatarRing,
          featured && styles.featuredAvatarRing,
          row.isCurrentUser && styles.currentUserAvatarRing,
        ]}
      >
        <V3InitialAvatar
          identityKey={identityKey}
          name={row.displayName}
          size={featured ? "large" : "medium"}
        />
      </View>

      <View
        style={[
          styles.rankBadge,
          row.rank === 1
            ? styles.firstBadge
            : row.rank === 2
              ? styles.secondBadge
              : styles.thirdBadge,
        ]}
      >
        <Text style={styles.rankText}>{row.rank}</Text>
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {visibleName}
      </Text>
      <Text style={[styles.points, featured && styles.featuredPoints]}>
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)}
      </Text>
    </View>
  );
}

export function LeaderboardPodium({ rows }: { rows: PodiumRow[] }) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  if (!first) return null;

  const visualRows = second
    ? third
      ? [
          { row: second, featured: false },
          { row: first, featured: true },
          { row: third, featured: false },
        ]
      : [
          { row: second, featured: false },
          { row: first, featured: true },
        ]
    : [{ row: first, featured: true }];

  return (
    <View style={styles.hero}>
      <View style={styles.lavenderShape} />
      <View style={styles.peachShape} />
      <View style={styles.sparkleLeft} />
      <View style={styles.sparkleRight} />

      <View
        style={[
          styles.podium,
          visualRows.length === 1 && styles.singlePodium,
          visualRows.length === 2 && styles.twoPersonPodium,
        ]}
      >
        {visualRows.map(({ row, featured }) => (
          <View
            key={row.key}
            style={[
              styles.slot,
              visualRows.length === 1 && styles.singleSlot,
              visualRows.length === 2 && styles.twoPersonSlot,
            ]}
          >
            <PodiumParticipant featured={featured} row={row} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 224,
    overflow: "hidden",
    marginTop: 13,
    borderRadius: 24,
    backgroundColor: "#fff4e8",
  },
  lavenderShape: {
    position: "absolute",
    top: 24,
    right: -32,
    width: 150,
    height: 92,
    borderRadius: 75,
    backgroundColor: podiumColors.lavender,
    opacity: 0.66,
    transform: [{ rotate: "-12deg" }],
  },
  peachShape: {
    position: "absolute",
    bottom: -48,
    left: -25,
    width: 175,
    height: 120,
    borderRadius: 88,
    backgroundColor: podiumColors.peach,
    opacity: 0.56,
  },
  sparkleLeft: {
    position: "absolute",
    top: 43,
    left: 28,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: podiumColors.purple,
    opacity: 0.28,
    transform: [{ rotate: "45deg" }],
  },
  sparkleRight: {
    position: "absolute",
    top: 21,
    right: 30,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: podiumColors.gold,
    opacity: 0.55,
    transform: [{ rotate: "45deg" }],
  },
  podium: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 5,
    paddingTop: 25,
    paddingBottom: 19,
  },
  singlePodium: { justifyContent: "center" },
  twoPersonPodium: { justifyContent: "center", gap: 26 },
  slot: { minWidth: 0, flex: 1, alignItems: "center" },
  singleSlot: { maxWidth: "42%", flex: 0, flexBasis: "42%" },
  twoPersonSlot: { maxWidth: "35%", flex: 0, flexBasis: "35%" },
  participant: { width: "100%", alignItems: "center" },
  featuredParticipant: { paddingBottom: 30 },
  crown: { marginBottom: -1 },
  avatarRing: {
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 999,
    backgroundColor: "rgba(255, 252, 246, 0.72)",
  },
  featuredAvatarRing: {
    padding: 4,
    borderColor: podiumColors.gold,
  },
  currentUserAvatarRing: { borderColor: podiumColors.purple },
  rankBadge: {
    minWidth: 27,
    alignItems: "center",
    marginTop: -7,
    borderRadius: 14,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  firstBadge: { backgroundColor: "#ffd985" },
  secondBadge: { backgroundColor: "#ded9e9" },
  thirdBadge: { backgroundColor: "#ffc4a7" },
  rankText: {
    color: podiumColors.ink,
    fontFamily: fonts.display,
    fontSize: 12,
  },
  name: {
    maxWidth: "96%",
    marginTop: 7,
    color: podiumColors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  points: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.display,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  featuredPoints: { color: podiumColors.purple },
});
