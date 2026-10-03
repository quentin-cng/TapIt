import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type {
  FriendActionMode,
  FriendActionResult,
} from "./useFriendsData";

const labels: Record<FriendActionMode, string> = {
  send: "Add friend",
  cancel: "Cancel",
  accept: "Accept",
  decline: "Decline",
  remove: "Remove friend",
};

type FriendActionButtonProps = {
  entityId: string;
  mode: FriendActionMode;
  onAction: (
    mode: FriendActionMode,
    entityId: string,
  ) => Promise<FriendActionResult>;
  onResult: (result: FriendActionResult) => void;
  presentation?: "default" | "sheet";
};

export function FriendActionButton({
  entityId,
  mode,
  onAction,
  onResult,
  presentation = "default",
}: FriendActionButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const isPrimary = mode === "send" || mode === "accept";
  const isDestructive = mode === "remove";

  async function handlePress() {
    if (isPending) return;

    setIsPending(true);
    const result = await onAction(mode, entityId);
    onResult(result);
    setIsPending(false);
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isPending}
      onPress={() => void handlePress()}
      style={({ pressed }) => [
        presentation === "sheet"
          ? styles.sheetButton
          : isPrimary
            ? styles.primaryButton
            : styles.textButton,
        pressed && styles.pressed,
        isPending && styles.disabled,
      ]}
    >
      {isPending ? (
        <ActivityIndicator
          color={
            presentation === "sheet"
              ? colors.danger
              : isPrimary
                ? colors.surface
                : colors.textSecondary
          }
          size="small"
        />
      ) : (
        <Text
          style={[
            presentation === "sheet"
              ? styles.sheetLabel
              : isPrimary
                ? styles.primaryLabel
                : styles.textLabel,
            isDestructive && styles.destructiveLabel,
          ]}
        >
          {labels[mode]}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.small,
    backgroundColor: v3Colors.purple,
    paddingHorizontal: 12,
  },
  primaryLabel: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  textButton: {
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  textLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  destructiveLabel: {
    color: colors.danger,
    textDecorationLine: "none",
  },
  sheetButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  sheetLabel: {
    color: colors.danger,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
