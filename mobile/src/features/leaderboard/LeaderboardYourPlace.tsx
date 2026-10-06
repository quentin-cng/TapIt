import { StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { fonts } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type PlacementRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

export function LeaderboardYourPlace({ row }: { row: PlacementRow }) {
  const identityKey = row.username ?? `${row.displayName}-${row.rank}`;

  return (
    <View
      accessibilityLabel={`Your rank is ${row.rank} with ${row.totalPoints} points`}
      style={styles.row}
    >
      <Text style={styles.rank}>{row.rank}</Text>
      <V3InitialAvatar
        identityKey={identityKey}
        name={row.displayName}
        size="small"
      />
      <View style={styles.identity}>
        <Text style={styles.name}>You</Text>
        <Text numberOfLines={1} style={styles.secondary}>
          Your place
        </Text>
      </View>
      <Text style={styles.points}>
        {new Intl.NumberFormat("en-CA").format(row.totalPoints)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#cfc0f6",
    borderRadius: 17,
    backgroundColor: "#f2edff",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  rank: {
    width: 23,
    color: "#5b3df6",
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    textAlign: "center",
  },
  identity: { minWidth: 0, flex: 1 },
  name: {
    color: "#1a1333",
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  secondary: {
    marginTop: 1,
    color: "#777386",
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  points: {
    color: "#5b3df6",
    fontFamily: fonts.bold,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
});
