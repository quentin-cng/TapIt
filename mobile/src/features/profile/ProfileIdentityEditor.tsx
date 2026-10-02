import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { colors, fonts, radii } from "../../theme/tokens";
import type { IdentityMutationResult } from "./useProfileData";

type ProfileIdentityEditorProps = {
  displayName: string;
  onCancel: () => void;
  onSave: (
    displayName: string,
    username: string,
  ) => Promise<IdentityMutationResult>;
  username: string;
};

export function ProfileIdentityEditor({
  displayName: initialDisplayName,
  onCancel,
  onSave,
  username: initialUsername,
}: ProfileIdentityEditorProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const incomingSource = `${initialDisplayName}\u0000${initialUsername}`;
  const [source, setSource] = useState(incomingSource);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<IdentityMutationResult | null>(null);

  if (!isSaving && source !== incomingSource) {
    setSource(incomingSource);
    setDisplayName(initialDisplayName);
    setUsername(initialUsername);
  }

  async function save() {
    if (isSaving) return;

    setNotice(null);
    setIsSaving(true);
    const result = await onSave(displayName, username);
    setDisplayName(result.values.displayName);
    setUsername(result.values.username);
    if (result.status === "success") {
      setSource(`${result.values.displayName}\u0000${result.values.username}`);
    }
    setNotice(result);
    setIsSaving(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View style={styles.heading}>
          <Text style={styles.title}>Edit profile</Text>
          <Text style={styles.copy}>
            Your display name is what people see. Your username stays unique.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.cancelText}>Close</Text>
        </Pressable>
      </View>

      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            editable={!isSaving}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={displayName}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <View style={styles.usernameField}>
            <Text style={styles.atSign}>@</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              editable={!isSaving}
              maxLength={30}
              onChangeText={setUsername}
              placeholder="username"
              placeholderTextColor={colors.textMuted}
              spellCheck={false}
              style={styles.usernameInput}
              value={username}
            />
          </View>
        </View>
      </View>

      {notice ? (
        <Text
          accessibilityRole={notice.status === "error" ? "alert" : "text"}
          style={[
            styles.notice,
            notice.status === "error" ? styles.error : styles.success,
          ]}
        >
          {notice.message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={isSaving}
        onPress={() => void save()}
        style={({ pressed }) => [
          styles.saveButton,
          isSaving && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        {isSaving ? (
          <ActivityIndicator color={colors.surface} size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save profile</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 20,
    paddingBottom: 4,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  heading: {
    minWidth: 0,
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.4,
  },
  copy: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  cancelText: {
    color: colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  fields: {
    gap: 14,
  },
  field: {
    gap: 7,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  usernameField: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.small,
    backgroundColor: colors.surface,
    paddingLeft: 12,
  },
  atSign: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  usernameInput: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 3,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  notice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  success: {
    color: colors.success,
  },
  error: {
    color: colors.danger,
  },
  saveButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.small,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
  },
  saveButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.75,
  },
});
