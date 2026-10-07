import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import {
  normalizeProfileAvatarId,
  PROFILE_AVATAR_IDS,
  type ProfileAvatarId,
} from "../../domain/profile-avatar";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import type {
  AvatarMutationResult,
  ProfileMutationResult,
} from "./useProfileData";

const avatarLabels: Record<ProfileAvatarId, string> = {
  default: "Default",
  mountain: "Mountain",
  sunset: "Sunset",
  forest: "Forest",
  moon: "Moon",
};

type ProfileAvatarPickerProps = {
  avatarId?: string | null;
  onCancel: () => void;
  onSave: (avatarId: ProfileAvatarId) => Promise<AvatarMutationResult>;
  onSaved: () => void;
};

export function ProfileAvatarPicker({
  avatarId,
  onCancel,
  onSave,
  onSaved,
}: ProfileAvatarPickerProps) {
  const persistedAvatarId = normalizeProfileAvatarId(avatarId);
  const [draftAvatarId, setDraftAvatarId] =
    useState<ProfileAvatarId>(persistedAvatarId);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<ProfileMutationResult | null>(null);
  const hasChanged = draftAvatarId !== persistedAvatarId;

  async function save() {
    if (isSaving || !hasChanged) return;

    setNotice(null);
    setIsSaving(true);
    const result = await onSave(draftAvatarId);

    if (result.status === "success") {
      onSaved();
      return;
    }

    setNotice(result);
    setIsSaving(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile picture</Text>

      <View accessibilityRole="radiogroup" style={styles.grid}>
        {PROFILE_AVATAR_IDS.map((optionId) => {
          const isSelected = draftAvatarId === optionId;
          const label = avatarLabels[optionId];

          return (
            <Pressable
              accessibilityLabel={`${label} profile picture`}
              accessibilityRole="radio"
              accessibilityState={{
                disabled: isSaving,
                selected: isSelected,
              }}
              disabled={isSaving}
              key={optionId}
              onPress={() => {
                setDraftAvatarId(optionId);
                setNotice(null);
              }}
              style={({ pressed }) => [
                styles.choice,
                isSelected && styles.choiceSelected,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.avatarWrap}>
                <TapItAvatar avatarId={optionId} size={68} />
                {isSelected ? (
                  <View accessibilityElementsHidden style={styles.check}>
                    <MaterialCommunityIcons
                      color={colors.surface}
                      name="check"
                      size={14}
                    />
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {notice ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {notice.message}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Cancel profile picture changes"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onCancel}
          style={({ pressed }) => [
            styles.cancelButton,
            isSaving && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="Save profile picture"
          accessibilityRole="button"
          accessibilityState={{ disabled: isSaving || !hasChanged }}
          disabled={isSaving || !hasChanged}
          onPress={() => void save()}
          style={({ pressed }) => [
            styles.saveButton,
            (isSaving || !hasChanged) && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
  },
  title: {
    paddingRight: 48,
    color: v3Colors.ink,
    fontFamily: fonts.bold,
    fontSize: 23,
    letterSpacing: -0.8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  choice: {
    width: "31%",
    minHeight: 112,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 18,
    backgroundColor: "#f8f0e6",
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  choiceSelected: {
    borderColor: v3Colors.purple,
    backgroundColor: v3Colors.lavender,
  },
  avatarWrap: {
    position: "relative",
  },
  check: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff8f1",
    borderRadius: 12,
    backgroundColor: v3Colors.purple,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  labelSelected: {
    color: v3Colors.purpleDark,
    fontFamily: fonts.semibold,
  },
  error: {
    marginTop: 14,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#dfd1c2",
    borderRadius: radii.small,
    backgroundColor: "#fffcf6",
  },
  cancelText: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  saveButton: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.small,
    backgroundColor: v3Colors.ink,
  },
  saveText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.72,
  },
});
