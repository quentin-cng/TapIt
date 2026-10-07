import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts } from "../../theme/tokens";
import type { FriendView } from "./useFriendsData";

const rowColors = {
  ink: "#1a1333",
  border: "#eadccd",
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
        <Text numberOfLines={1} style={styles.name}>
          {displayName}
        </Text>
        <Text numberOfLines={1} style={styles.username}>
          @{friend.profile.username}
        </Text>
        {stat ? (
          <View style={styles.streak}>
            <MaterialCommunityIcons
              color={rowColors.flame}
              name="fire"
              size={16}
            />
            <Text style={styles.streakValue}>
              {stat.currentWeeklyGoalStreak} week streak
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.pointsBlock}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.points}>
          {new Intl.NumberFormat("en-CA").format(friend.profile.total_points)}
        </Text>
        <Text style={styles.pointsLabel}>points</Text>
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
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: rowColors.border,
    paddingVertical: 12,
  },
  content: { minWidth: 0, flex: 1 },
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
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  streakValue: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  pointsBlock: {
    width: 62,
    alignItems: "flex-end",
  },
  points: {
    maxWidth: "100%",
    color: rowColors.ink,
    fontFamily: fonts.display,
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
  pointsLabel: {
    marginTop: -1,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 9,
  },
  pressed: { opacity: 0.62 },
});
