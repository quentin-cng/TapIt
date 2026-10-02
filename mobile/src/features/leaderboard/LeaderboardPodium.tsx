import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii } from "../../theme/tokens";
import type {
  FriendsLeaderboardRow,
  GeneralLeaderboardRow,
} from "./useLeaderboardData";
import { getAvatarColors, getInitials } from "./leaderboard-visuals";

type PodiumRow = FriendsLeaderboardRow | GeneralLeaderboardRow;

function PodiumParticipant({
  featured,
  row,
}: {
  featured: boolean;
  row: PodiumRow;
}) {
  const avatarColors = getAvatarColors(row.username ?? row.displayName);

  return (
    <View
      accessibilityLabel={`Rank ${row.rank}, ${row.displayName}, ${row.totalPoints} points${row.isCurrentUser ? ", you" : ""}`}
      style={[styles.participant, featured && styles.featuredParticipant]}
    >
      <View
        style={[
          styles.avatar,
          featured && styles.featuredAvatar,
          row.isCurrentUser && styles.currentUserAvatar,
          { backgroundColor: avatarColors.background },
        ]}
      >
        <Text
          style={[
            styles.initials,
            featured && styles.featuredInitials,
            { color: avatarColors.foreground },
          ]}
        >
          {getInitials(row.displayName)}
        </Text>
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
      <Text style={styles.points}>{row.totalPoints} pts</Text>
    </View>
  );
}

export function LeaderboardPodium({ rows }: { rows: PodiumRow[] }) {
  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  if (!first) return null;

  return (
    <View style={styles.container}>
      <View style={styles.slot}>
        {second ? <PodiumParticipant featured={false} row={second} /> : null}
      </View>
      <View style={styles.slot}>
        <PodiumParticipant featured row={first} />
      </View>
      <View style={styles.slot}>
        {third ? <PodiumParticipant featured={false} row={third} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 235,
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 18,
    borderRadius: radii.large,
    backgroundColor: "#f0ebfc",
    paddingHorizontal: 7,
    paddingTop: 24,
    paddingBottom: 20,
  },
  slot: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
  },
  participant: {
    width: "100%",
    alignItems: "center",
  },
  featuredParticipant: {
    paddingBottom: 31,
  },
  avatar: {
    width: 65,
    height: 65,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 33,
  },
  featuredAvatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  currentUserAvatar: {
    borderColor: colors.purple,
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 23,
  },
  featuredInitials: {
    fontSize: 29,
  },
  rankBadge: {
    minWidth: 36,
    alignItems: "center",
    marginTop: -8,
    borderRadius: 999,
    backgroundColor: "#e2d9f7",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredRankBadge: {
    backgroundColor: colors.purple,
  },
  rankText: {
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  featuredRankText: {
    color: colors.surface,
  },
  nameLine: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 3,
  },
  name: {
    minWidth: 0,
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 12,
    textAlign: "center",
  },
  youLabel: {
    borderRadius: 999,
    backgroundColor: "#ded2fb",
    paddingHorizontal: 5,
    paddingVertical: 2,
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 7,
    textTransform: "uppercase",
  },
  points: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
});
