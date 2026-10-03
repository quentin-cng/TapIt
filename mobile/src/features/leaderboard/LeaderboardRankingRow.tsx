import { StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type RankingRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardRankingRow({ row }: { row: RankingRow }) {
  const identityKey = row.username ?? `${row.displayName}-${row.rank}`;

  return (
    <View style={[styles.container, row.isCurrentUser && styles.currentUserRow]}>
      <Text style={[styles.rank, row.isCurrentUser && styles.currentRank]}>
        {row.rank}
      </Text>
      <V3InitialAvatar
        identityKey={identityKey}
        name={row.displayName}
        size="small"
      />
      <View style={styles.identity}>
        <View style={styles.nameLine}>
          <Text numberOfLines={1} style={styles.name}>
            {row.displayName}
          </Text>
          {row.isCurrentUser ? <Text style={styles.youLabel}>You</Text> : null}
        </View>
      </View>
      <Text style={[styles.points, row.isCurrentUser && styles.currentPoints]}>
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)}{" "}
        <Text style={styles.pointsUnit}>pts</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 7,
    paddingVertical: 9,
  },
  currentUserRow: {
    marginHorizontal: -4,
    borderBottomColor: "transparent",
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
    paddingHorizontal: 11,
  },
  rank: {
    width: 24,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  currentRank: {
    color: v3Colors.purple,
    fontFamily: fonts.bold,
  },
  identity: {
    minWidth: 0,
    flex: 1,
  },
  nameLine: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    minWidth: 0,
    flexShrink: 1,
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  youLabel: {
    borderRadius: 999,
    backgroundColor: v3Colors.lavenderStrong,
    paddingHorizontal: 6,
    paddingVertical: 2,
    color: v3Colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 7,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  points: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  currentPoints: {
    color: v3Colors.purple,
  },
  pointsUnit: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
});
