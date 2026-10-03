import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { colors, fonts, v3Colors } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type PodiumRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

function PodiumParticipant({
  featured,
  row,
}: {
  featured: boolean;
  row: PodiumRow;
}) {
  const identityKey = row.username ?? `${row.displayName}-${row.rank}`;

  return (
    <View
      accessibilityLabel={`Rank ${row.rank}, ${row.displayName}, ${row.totalPoints} points${row.isCurrentUser ? ", you" : ""}`}
      style={[styles.participant, featured && styles.featuredParticipant]}
    >
      <View
        style={[
          styles.avatarRing,
          featured && styles.featuredAvatarRing,
          row.isCurrentUser && !featured && styles.currentUserAvatarRing,
        ]}
      >
        {featured ? (
          <View style={styles.trophy}>
            <MaterialCommunityIcons color="#d79628" name="trophy" size={17} />
          </View>
        ) : null}
        <V3InitialAvatar
          identityKey={identityKey}
          name={row.displayName}
          size={featured ? "large" : "medium"}
        />
      </View>

      <View style={[styles.rankBadge, featured && styles.featuredRankBadge]}>
        <Text style={[styles.rankText, featured && styles.featuredRankText]}>
          #{row.rank}
        </Text>
      </View>

      <View style={styles.nameLine}>
        <Text numberOfLines={1} style={styles.name}>
          {row.displayName}
        </Text>
        {row.isCurrentUser ? <Text style={styles.youLabel}>You</Text> : null}
      </View>
      <Text style={[styles.points, featured && styles.featuredPoints]}>
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)} pts
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
    <View
      style={[
        styles.container,
        visualRows.length === 1 && styles.singleContainer,
        visualRows.length === 2 && styles.twoParticipantContainer,
      ]}
    >
      {visualRows.map(({ row, featured }) => (
        <View
          key={row.key}
          style={[
            styles.slot,
            visualRows.length === 1 && styles.singleSlot,
            visualRows.length === 2 && styles.twoParticipantSlot,
          ]}
        >
          <PodiumParticipant featured={featured} row={row} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 206,
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 22,
    paddingHorizontal: 2,
    paddingTop: 28,
    paddingBottom: 5,
  },
  singleContainer: {
    justifyContent: "center",
  },
  twoParticipantContainer: {
    justifyContent: "center",
    gap: 22,
  },
  slot: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
  },
  singleSlot: {
    maxWidth: "44%",
    flex: 0,
    flexBasis: "44%",
  },
  twoParticipantSlot: {
    maxWidth: "36%",
    flex: 0,
    flexBasis: "36%",
  },
  participant: {
    width: "100%",
    alignItems: "center",
  },
  featuredParticipant: {
    paddingBottom: 29,
  },
  avatarRing: {
    padding: 3,
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 999,
  },
  featuredAvatarRing: {
    padding: 4,
    borderColor: "#efb953",
  },
  currentUserAvatarRing: {
    borderColor: v3Colors.purple,
  },
  trophy: {
    position: "absolute",
    top: -24,
    right: 0,
    left: 0,
    alignItems: "center",
  },
  rankBadge: {
    minWidth: 32,
    alignItems: "center",
    marginTop: -7,
    borderRadius: 999,
    backgroundColor: v3Colors.lavenderStrong,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  featuredRankBadge: {
    backgroundColor: "#fff0cb",
  },
  rankText: {
    color: v3Colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  featuredRankText: {
    color: "#a7650d",
  },
  nameLine: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  name: {
    minWidth: 0,
    flexShrink: 1,
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  youLabel: {
    borderRadius: 999,
    backgroundColor: v3Colors.lavenderStrong,
    paddingHorizontal: 5,
    paddingVertical: 2,
    color: v3Colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 7,
    textTransform: "uppercase",
  },
  points: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
  },
  featuredPoints: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
  },
});
