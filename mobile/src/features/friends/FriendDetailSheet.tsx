import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SessionDots } from "../../components/consistency/SessionDots";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import { FriendActionButton } from "./FriendActionButton";
import type {
  FriendActionResult,
  FriendView,
  useFriendsData,
} from "./useFriendsData";

type ActionHandler = ReturnType<typeof useFriendsData>["performAction"];

export function FriendDetailSheet({
  friend,
  onAction,
  onClose,
  onRemoved,
}: {
  friend: FriendView | null;
  onAction: ActionHandler;
  onClose: () => void;
  onRemoved: (result: FriendActionResult) => void;
}) {
  const [removalError, setRemovalError] = useState("");
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(72));
  const isClosing = useRef(false);
  const friendId = friend?.profile.profile_id ?? null;

  useEffect(() => {
    if (!friendId) return;

    isClosing.current = false;
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(72);

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 150,
        easing: Easing.out(Easing.quad),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, friendId, sheetTranslateY]);

  if (!friend) return null;

  const displayName = resolveDisplayName(
    friend.profile.display_name,
    friend.profile.username,
  );
  const stat = friend.weeklyStat;
  const isComplete = Boolean(
    stat?.currentGoal && stat.currentSessions >= stat.currentGoal,
  );

  function animateOut(onFinished: () => void) {
    if (isClosing.current) return;
    isClosing.current = true;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        duration: 160,
        easing: Easing.in(Easing.quad),
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        duration: 210,
        easing: Easing.in(Easing.cubic),
        toValue: 72,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isClosing.current = false;
      onFinished();
    });
  }

  function close() {
    animateOut(() => {
      setRemovalError("");
      onClose();
    });
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <Animated.View
          pointerEvents="none"
          style={[styles.backdropDim, { opacity: backdropOpacity }]}
        />
        <Pressable
          accessibilityLabel="Close friend details"
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheetSafeArea}>
            <ScrollView
              contentContainerStyle={styles.sheet}
              showsVerticalScrollIndicator={false}
            >
            <View style={styles.handle} />
            <Pressable
              accessibilityLabel="Close friend details"
              accessibilityRole="button"
              hitSlop={8}
              onPress={close}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialCommunityIcons
                color={v3Colors.ink}
                name="close"
                size={23}
              />
            </Pressable>

            <View style={styles.identity}>
              <TapItAvatar avatarId={friend.profile.avatar_id} size={72} />
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.username}>@{friend.profile.username}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons
                    color="#ff7b3d"
                    name="fire"
                    size={19}
                  />
                  <Text style={styles.statValue}>
                    {stat ? stat.currentWeeklyGoalStreak : "—"}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Week streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <View style={styles.statValueRow}>
                  <MaterialCommunityIcons
                    color={v3Colors.purple}
                    name="lightning-bolt"
                    size={19}
                  />
                  <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
                    {new Intl.NumberFormat("en-CA").format(
                      friend.profile.total_points,
                    )}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>

            <View style={styles.goalSection}>
              <View style={styles.goalHeading}>
                <Text style={styles.sectionTitle}>Weekly goal</Text>
                {stat?.currentGoal ? (
                  <Text style={styles.goalCount}>
                    {stat.currentSessions} / {stat.currentGoal}
                  </Text>
                ) : null}
              </View>

              {!stat ? (
                <Text style={styles.unavailable}>
                  Weekly progress is unavailable.
                </Text>
              ) : stat.currentGoal ? (
                <>
                  <View style={styles.goalDots}>
                    <SessionDots
                      accentColor={
                        isComplete ? "#16845a" : v3Colors.purple
                      }
                      completed={stat.currentSessions}
                      target={stat.currentGoal}
                      variant="v3"
                    />
                  </View>
                  <Text
                    style={[
                      styles.goalStatus,
                      isComplete && styles.goalComplete,
                    ]}
                  >
                    {isComplete
                      ? "Weekly goal complete"
                      : `${Math.max(0, stat.currentGoal - stat.currentSessions)} to go`}
                  </Text>
                </>
              ) : (
                <Text style={styles.unavailable}>No weekly goal</Text>
              )}
            </View>

            <View style={styles.removeSection}>
              <FriendActionButton
                entityId={friend.profile.profile_id}
                mode="remove"
                onAction={onAction}
                onResult={(result) => {
                  if (result.status === "success") {
                    animateOut(() => {
                      setRemovalError("");
                      onRemoved(result);
                    });
                  } else {
                    setRemovalError(result.message);
                  }
                }}
                presentation="sheet"
              />
              {removalError ? (
                <Text accessibilityRole="alert" style={styles.removalError}>
                  {removalError}
                </Text>
              ) : null}
            </View>
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropDim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(36, 20, 63, 0.36)",
  },
  sheetContainer: {
    maxHeight: "82%",
  },
  sheetSafeArea: {
    maxHeight: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  sheet: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  closeButton: {
    position: "absolute",
    top: 17,
    right: 20,
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: v3Colors.lavender,
    zIndex: 1,
  },
  identity: {
    alignItems: "center",
    marginTop: 26,
  },
  name: {
    marginTop: 12,
    color: v3Colors.ink,
    fontFamily: fonts.display,
    fontSize: 24,
    letterSpacing: -1,
    textAlign: "center",
  },
  username: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  statsRow: {
    minHeight: 78,
    marginTop: 21,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
  },
  stat: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 13,
    backgroundColor: v3Colors.lavenderStrong,
  },
  statValueRow: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  statValue: {
    maxWidth: "80%",
    color: v3Colors.purple,
    fontFamily: fonts.display,
    fontSize: 22,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.8,
  },
  statLabel: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  goalSection: {
    marginTop: 25,
  },
  goalHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 16,
  },
  goalCount: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  goalDots: {
    marginTop: 14,
  },
  goalStatus: {
    marginTop: 9,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  goalComplete: {
    color: "#16845a",
  },
  unavailable: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  removeSection: {
    marginTop: 30,
  },
  removalError: {
    marginTop: 9,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  pressed: {
    opacity: 0.65,
  },
});
