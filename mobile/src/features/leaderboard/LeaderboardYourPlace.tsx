import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";

type PlacementRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

function getComparisonCopy(rows: PlacementRow[], currentIndex: number) {
  const currentUser = rows[currentIndex];

  if (currentIndex === 0 || currentUser.rank === 1) {
    return "You’re leading.";
  }

  const userAbove = rows[currentIndex - 1];
  const pointsGap = userAbove.totalPoints - currentUser.totalPoints;

  if (pointsGap < 1) return null;

  return `${new Intl.NumberFormat("en-CA").format(pointsGap)} ${pointsGap === 1 ? "pt" : "pts"} to pass ${userAbove.displayName}`;
}

export function LeaderboardYourPlace({ rows }: { rows: PlacementRow[] }) {
  const currentIndex = rows.findIndex((row) => row.isCurrentUser);

  if (currentIndex < 0) return null;

  const currentUser = rows[currentIndex];
  const comparisonCopy = getComparisonCopy(rows, currentIndex);

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>Your place</Text>
      <View style={styles.card}>
        <Text style={styles.rank}>#{currentUser.rank}</Text>
        <View style={styles.copy}>
          <Text style={styles.title}>Your place</Text>
          {comparisonCopy ? (
            <Text numberOfLines={2} style={styles.comparison}>
              {comparisonCopy}
            </Text>
          ) : null}
        </View>
        <Text style={styles.points}>
          {new Intl.NumberFormat("en-CA").format(currentUser.totalPoints)}
          <Text style={styles.pointsUnit}> pts</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  card: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  rank: {
    color: v3Colors.purple,
    fontFamily: fonts.extraBold,
    fontSize: 25,
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  copy: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  comparison: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 9,
    lineHeight: 13,
  },
  points: {
    color: v3Colors.purple,
    fontFamily: fonts.extraBold,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
  },
  pointsUnit: {
    fontFamily: fonts.medium,
    fontSize: 9,
  },
});
