import { StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { colors, fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type RankingRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardRankingRow({ row }: { row: RankingRow }) {
  const identityKey = row.username ?? `${row.displayName}-${row.rank}`;

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{row.rank}</Text>
      <V3InitialAvatar
        identityKey={identityKey}
        name={row.displayName}
        size="small"
      />
      <Text numberOfLines={1} style={styles.name}>
        {row.displayName}
      </Text>
      <Text style={styles.points}>
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eadccd",
    paddingHorizontal: 5,
    paddingVertical: 9,
  },
  rank: {
    width: 23,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  name: {
    minWidth: 0,
    flex: 1,
    color: "#1a1333",
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  points: {
    color: "#1a1333",
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
});
