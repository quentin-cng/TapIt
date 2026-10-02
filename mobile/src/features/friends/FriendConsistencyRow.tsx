import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SessionDots } from "../../components/consistency/SessionDots";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts } from "../../theme/tokens";
import type { FriendView } from "./useFriendsData";

export function FriendConsistencyRow({
  friend,
  onOpenActions,
}: {
  friend: FriendView;
  onOpenActions: (friend: FriendView) => void;
}) {
  const displayName = resolveDisplayName(
    friend.profile.display_name,
    friend.profile.username,
  );
  const stat = friend.weeklyStat;
  const streak = stat?.currentWeeklyGoalStreak ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.identity}>
          <View style={styles.initial}>
            <Text style={styles.initialText}>
              {Array.from(displayName.trim())[0]?.toLocaleUpperCase("en-CA") ?? "T"}
            </Text>
          </View>
          <View style={styles.identityCopy}>
            <Text numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.username}>
              @{friend.profile.username}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel={`More actions for ${displayName}`}
          accessibilityRole="button"
          hitSlop={10}
          onPress={() => onOpenActions(friend)}
          style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons
            color={colors.textSecondary}
            name="dots-horizontal"
            size={21}
          />
        </Pressable>
      </View>

      {!stat ? (
        <Text style={styles.unavailable}>Weekly progress unavailable</Text>
      ) : stat.currentGoal ? (
        <View style={styles.consistencyLine}>
          <SessionDots
            compact
            completed={stat.currentSessions}
            target={stat.currentGoal}
          />
          <Text style={styles.progressText}>
            {stat.currentSessions} / {stat.currentGoal}
          </Text>
        </View>
      ) : (
        <Text style={styles.noGoal}>No weekly goal</Text>
      )}

      {stat ? (
        <Text style={styles.streakText}>
          {streak > 0
            ? `${streak} ${streak === 1 ? "week" : "weeks"} streak`
            : "No active streak"}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 15,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  identity: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  initial: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "#e5dcfa",
  },
  initialText: {
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  identityCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 15,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  consistencyLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 13,
    marginLeft: 53,
  },
  progressText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  noGoal: {
    marginTop: 12,
    marginLeft: 53,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  unavailable: {
    marginTop: 12,
    marginLeft: 53,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  streakText: {
    marginTop: 7,
    marginLeft: 53,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  pressed: {
    opacity: 0.55,
  },
});
