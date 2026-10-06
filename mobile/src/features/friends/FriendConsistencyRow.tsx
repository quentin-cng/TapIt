import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts } from "../../theme/tokens";
import type { FriendView } from "./useFriendsData";

const rowColors = {
  ink: "#1a1333",
  purple: "#5b3df6",
  complete: "#16845a",
  border: "#eadccd",
  track: "#e9dece",
  flame: "#ef6a33",
} as const;

export function FriendConsistencyRow({
  friend,
  onOpen,
}: {
  friend: FriendView;
  onOpen: (friend: FriendView) => void;
}) {
  const displayName = resolveDisplayName(
    friend.profile.display_name,
    friend.profile.username,
  );
  const stat = friend.weeklyStat;
  const isComplete = Boolean(
    stat?.currentGoal && stat.currentSessions >= stat.currentGoal,
  );
  const progressWidth = stat?.currentGoal
    ? (`${Math.min(100, Math.round((stat.currentSessions / stat.currentGoal) * 100))}%` as const)
    : "0%";

  return (
    <Pressable
      accessibilityHint="Opens friend details"
      accessibilityLabel={`${displayName}, @${friend.profile.username}`}
      accessibilityRole="button"
      onPress={() => onOpen(friend)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <V3InitialAvatar
        identityKey={friend.profile.username}
        name={displayName}
        size="small"
      />

      <View style={styles.content}>
        <View style={styles.identityRow}>
          <View style={styles.identity}>
            <Text numberOfLines={1} style={styles.name}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.username}>
              @{friend.profile.username}
            </Text>
          </View>
          {stat ? (
            <View style={styles.streak}>
              <MaterialCommunityIcons
                color={rowColors.flame}
                name="fire"
                size={17}
              />
              <Text style={styles.streakValue}>
                {stat.currentWeeklyGoalStreak}
              </Text>
            </View>
          ) : null}
        </View>

        {!stat ? (
          <Text style={styles.unavailable}>Progress unavailable</Text>
        ) : stat.currentGoal ? (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  isComplete && styles.completeFill,
                  { width: progressWidth },
                ]}
              />
            </View>
            <Text
              style={[
                styles.progressText,
                isComplete && styles.completeText,
              ]}
            >
              {stat.currentSessions} / {stat.currentGoal}
            </Text>
          </View>
        ) : (
          <Text style={styles.unavailable}>No weekly goal</Text>
        )}
      </View>

      <MaterialCommunityIcons
        color={colors.textMuted}
        name="chevron-right"
        size={18}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: rowColors.border,
    paddingVertical: 11,
  },
  content: { minWidth: 0, flex: 1 },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  identity: { minWidth: 0, flex: 1 },
  name: {
    color: rowColors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
    letterSpacing: -0.25,
  },
  username: {
    marginTop: 1,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  streakValue: {
    minWidth: 14,
    color: rowColors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  progressRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressTrack: {
    height: 8,
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    borderRadius: 4,
    backgroundColor: rowColors.track,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: rowColors.purple,
  },
  completeFill: { backgroundColor: rowColors.complete },
  progressText: {
    minWidth: 31,
    color: rowColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  completeText: { color: rowColors.complete },
  unavailable: {
    marginTop: 7,
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  pressed: { opacity: 0.62 },
});
