import { Pressable, StyleSheet, Text, View } from "react-native";
import { SessionDots } from "../../components/consistency/SessionDots";
import {
  getV3AvatarPalette,
  V3InitialAvatar,
} from "../../components/identity/V3InitialAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type { FriendView } from "./useFriendsData";

const completedColor = "#16845a";

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
  const palette = getV3AvatarPalette(friend.profile.username);
  const stat = friend.weeklyStat;
  const isComplete = Boolean(
    stat?.currentGoal && stat.currentSessions >= stat.currentGoal,
  );

  return (
    <Pressable
      accessibilityHint="Opens friend details"
      accessibilityLabel={`${displayName}, @${friend.profile.username}`}
      accessibilityRole="button"
      onPress={() => onOpen(friend)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface },
        pressed && styles.pressed,
      ]}
    >
      <V3InitialAvatar
        identityKey={friend.profile.username}
        name={displayName}
      />
      <Text numberOfLines={1} style={styles.name}>
        {displayName}
      </Text>
      <Text numberOfLines={1} style={styles.username}>
        @{friend.profile.username}
      </Text>

      <View style={styles.progressBlock}>
        {!stat ? (
          <Text style={styles.unavailable}>Progress unavailable</Text>
        ) : stat.currentGoal ? (
          <>
            <Text
              style={[
                styles.progressText,
                isComplete && styles.completeText,
              ]}
            >
              {stat.currentSessions} / {stat.currentGoal}
            </Text>
            <SessionDots
              accentColor={isComplete ? completedColor : v3Colors.purple}
              compact
              completed={stat.currentSessions}
              target={stat.currentGoal}
              variant="v3"
            />
            <Text
              style={[
                styles.statusText,
                isComplete && styles.completeText,
              ]}
            >
              {isComplete ? "Goal complete" : "In progress"}
            </Text>
          </>
        ) : (
          <Text style={styles.unavailable}>No weekly goal</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 190,
    alignItems: "center",
    borderRadius: radii.large,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  name: {
    width: "100%",
    marginTop: 10,
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  username: {
    width: "100%",
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
    textAlign: "center",
  },
  progressBlock: {
    width: "100%",
    minHeight: 54,
    marginTop: 11,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },
  progressText: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  statusText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 9,
  },
  completeText: {
    color: completedColor,
  },
  unavailable: {
    color: colors.textMuted,
    fontFamily: fonts.medium,
    fontSize: 10,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
