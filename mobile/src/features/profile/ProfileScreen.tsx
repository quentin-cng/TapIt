import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import { PenguinProfileArtwork } from "../home/HomeArtwork";
import { ProfileBottomSheet } from "./ProfileBottomSheet";
import { ProfileIdentityEditor } from "./ProfileIdentityEditor";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { useProfileData } from "./useProfileData";
import { WeeklyGoalEditor } from "./WeeklyGoalEditor";

const profileColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  border: "#eadccd",
  iconSurface: "#f2e9de",
  ink: "#1a1333",
  purple: "#5b3df6",
} as const;

const PRIVACY_URL = "https://tap-it-pied.vercel.app/privacy";
const TERMS_URL = "https://tap-it-pied.vercel.app/terms";

type AccountRowProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress?: () => void;
  secondary?: string;
  title: string;
};

function formatMemberSince(createdAt: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    year: "numeric",
    timeZone: "America/Montreal",
  }).format(new Date(createdAt));
}

function returnHome() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}

function ProfileHeader() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="Go back"
        accessibilityRole="button"
        hitSlop={10}
        onPress={returnHome}
        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={profileColors.ink} name="arrow-left" size={23} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        Profile<Text style={styles.titlePeriod}>.</Text>
      </Text>
      <View style={styles.headerButton} />
    </View>
  );
}

function AccountRow({ icon, onPress, secondary, title }: AccountRowProps) {
  const content = (
    <>
      <View style={styles.rowIcon}>
        <MaterialCommunityIcons color={profileColors.purple} name={icon} size={20} />
      </View>
      <Text style={styles.rowTitle}>{title}</Text>
      {secondary ? <Text style={styles.rowSecondary}>{secondary}</Text> : null}
      <MaterialCommunityIcons color="#897d8e" name="chevron-right" size={20} />
    </>
  );

  if (!onPress) {
    return <View style={[styles.accountRow, styles.unavailableRow]}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.accountRow, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

function LegalSheet({
  error,
  onOpen,
}: {
  error: string;
  onOpen: (url: string) => void;
}) {
  return (
    <View style={styles.legalSheet}>
      <View style={styles.sheetHeading}>
        <View>
          <Text style={styles.sheetTitle}>Privacy & Legal</Text>
          <Text style={styles.sheetCopy}>TapIt policies and terms.</Text>
        </View>
      </View>

      <View style={styles.legalLinks}>
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpen(PRIVACY_URL)}
          style={({ pressed }) => [styles.legalRow, pressed && styles.rowPressed]}
        >
          <Text style={styles.legalRowText}>Privacy Policy</Text>
          <MaterialCommunityIcons color={profileColors.purple} name="open-in-new" size={19} />
        </Pressable>
        <Pressable
          accessibilityRole="link"
          onPress={() => onOpen(TERMS_URL)}
          style={({ pressed }) => [styles.legalRow, pressed && styles.rowPressed]}
        >
          <Text style={styles.legalRowText}>Terms of Use</Text>
          <MaterialCommunityIcons color={profileColors.purple} name="open-in-new" size={19} />
        </Pressable>
      </View>

      {error ? <Text accessibilityRole="alert" style={styles.legalError}>{error}</Text> : null}
    </View>
  );
}

export function ProfileScreen() {
  const { session } = useSession();
  const {
    data,
    deleteAccount,
    error,
    isLoading,
    isRefreshing,
    load,
    refresh,
    signOut,
    updateIdentity,
    updateWeeklyGoal,
  } = useProfileData(session!.user.id);
  const [isIdentityVisible, setIsIdentityVisible] = useState(false);
  const [isLegalVisible, setIsLegalVisible] = useState(false);
  const [isDeleteVisible, setIsDeleteVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [legalError, setLegalError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const refreshControl = (
    <RefreshControl
      colors={[profileColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={profileColors.purple}
    />
  );

  async function logout() {
    if (isSigningOut) return;
    setLogoutError("");
    setIsSigningOut(true);
    const result = await signOut();
    if (result.status === "error") {
      setLogoutError(result.message);
      setIsSigningOut(false);
    }
  }

  async function openLegalUrl(url: string) {
    setLegalError("");
    try {
      await Linking.openURL(url);
    } catch {
      setLegalError("We couldn’t open this page. Please try again.");
    }
  }

  function openDeleteConfirmation() {
    setDeleteConfirmation("");
    setDeleteError("");
    setIsDeleteVisible(true);
  }

  async function confirmDeletion() {
    if (isDeleting) return;

    setDeleteError("");
    setIsDeleting(true);
    const result = await deleteAccount(deleteConfirmation);

    if (result.status === "error") {
      setDeleteError(result.message);
      setIsDeleting(false);
    }
  }

  if (isLoading && !data) {
    return (
      <AppScreen backgroundColor={profileColors.background} refreshControl={refreshControl} showTopbar={false} variant="v3">
        <ProfileHeader />
        <ProfileSkeleton />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen backgroundColor={profileColors.background} refreshControl={refreshControl} showTopbar={false} variant="v3">
        <ProfileHeader />
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>Profile unavailable</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => void load()} style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const displayName = resolveDisplayName(data.profile.display_name, data.profile.username);

  return (
    <>
      <AppScreen backgroundColor={profileColors.background} refreshControl={refreshControl} showTopbar={false} variant="v3">
        <ProfileHeader />

        <View style={styles.identity}>
          <View style={styles.profileAvatar}>
            <View style={styles.scaledAvatar}><PenguinProfileArtwork /></View>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.username}>@{data.profile.username}</Text>
          <Text style={styles.memberSince}>Member since {formatMemberSince(data.profile.created_at)}</Text>
          <Pressable accessibilityRole="button" onPress={() => setIsIdentityVisible(true)} style={({ pressed }) => [styles.editButton, pressed && styles.rowPressed]}>
            <MaterialCommunityIcons color={profileColors.purple} name="account-edit-outline" size={17} />
            <Text style={styles.editButtonText}>Edit profile</Text>
          </Pressable>
        </View>

        <WeeklyGoalEditor
          currentGoal={data.currentGoal}
          onSave={updateWeeklyGoal}
          pendingGoal={data.pendingGoal?.goalSessions ?? null}
        />

        <View style={styles.accountSection}>
          <Text style={styles.sectionLabel}>Account</Text>
          <View style={styles.accountList}>
            <AccountRow icon="bell-outline" secondary="Coming soon" title="Notifications" />
            <AccountRow icon="shield-lock-outline" onPress={() => { setLegalError(""); setIsLegalVisible(true); }} title="Privacy & Legal" />
          </View>
        </View>

        {__DEV__ ? (
          <View style={styles.developmentSection}>
            <Text style={styles.sectionLabel}>Development</Text>
            <Pressable accessibilityRole="button" onPress={() => router.push("/dev-checkin")} style={({ pressed }) => [styles.developmentRow, pressed && styles.rowPressed]}>
              <Text style={styles.developmentText}>Check-in tester</Text>
              <MaterialCommunityIcons color="#897d8e" name="chevron-right" size={21} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sessionActions}>
          <Pressable accessibilityRole="button" disabled={isSigningOut} onPress={() => void logout()} style={({ pressed }) => [styles.logoutButton, isSigningOut && styles.disabled, pressed && styles.rowPressed]}>
            <MaterialCommunityIcons color="#9b3f45" name="logout-variant" size={19} />
            <Text style={styles.logoutText}>{isSigningOut ? "Logging out…" : "Log out"}</Text>
          </Pressable>
          {logoutError ? <Text accessibilityRole="alert" style={styles.logoutError}>{logoutError}</Text> : null}

          <View style={styles.dangerZone}>
            <Text style={styles.dangerLabel}>Destructive actions</Text>
            <Pressable
              accessibilityRole="button"
              onPress={openDeleteConfirmation}
              style={({ pressed }) => [
                styles.deleteAccountButton,
                pressed && styles.rowPressed,
              ]}
            >
              <View style={styles.deleteAccountCopy}>
                <Text style={styles.deleteAccountTitle}>Delete account</Text>
                <Text style={styles.deleteAccountSubtitle}>
                  Permanently delete your TapIt account
                </Text>
              </View>
              <MaterialCommunityIcons color="#a43d46" name="chevron-right" size={20} />
            </Pressable>
          </View>
        </View>
      </AppScreen>

      <ProfileBottomSheet accessibilityLabel="Edit profile" onClose={() => setIsIdentityVisible(false)} visible={isIdentityVisible}>
        <ProfileIdentityEditor
          displayName={displayName}
          onSave={updateIdentity}
          username={data.profile.username}
        />
      </ProfileBottomSheet>

      <ProfileBottomSheet accessibilityLabel="Privacy and legal" onClose={() => setIsLegalVisible(false)} visible={isLegalVisible}>
        <LegalSheet error={legalError} onOpen={(url) => void openLegalUrl(url)} />
      </ProfileBottomSheet>

      <ProfileBottomSheet
        accessibilityLabel="Delete account confirmation"
        closeDisabled={isDeleting}
        onClose={() => {
          setIsDeleteVisible(false);
          setDeleteConfirmation("");
          setDeleteError("");
        }}
        visible={isDeleteVisible}
      >
        <View style={styles.deleteSheet}>
          <Text style={styles.deleteSheetTitle}>Delete account?</Text>
          <Text style={styles.deleteWarning}>
            This permanently deletes your TapIt account and associated data,
            including your check-ins, goals, points, friendships, and friend
            requests. This cannot be undone.
          </Text>

          <Text style={styles.deleteInputLabel}>
            Type <Text style={styles.deleteInputEmphasis}>DELETE</Text> to confirm
          </Text>
          <TextInput
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect={false}
            editable={!isDeleting}
            onChangeText={(value) => {
              setDeleteConfirmation(value);
              setDeleteError("");
            }}
            placeholder="DELETE"
            placeholderTextColor="#a99da3"
            spellCheck={false}
            style={styles.deleteInput}
            value={deleteConfirmation}
          />

          {deleteError ? (
            <Text accessibilityRole="alert" style={styles.deleteError}>
              {deleteError}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={deleteConfirmation !== "DELETE" || isDeleting}
            onPress={() => void confirmDeletion()}
            style={({ pressed }) => [
              styles.confirmDeleteButton,
              (deleteConfirmation !== "DELETE" || isDeleting) && styles.disabled,
              pressed && styles.rowPressed,
            ]}
          >
            {isDeleting ? (
              <ActivityIndicator color="#fff8f1" size="small" />
            ) : (
              <Text style={styles.confirmDeleteText}>
                Permanently delete account
              </Text>
            )}
          </Pressable>
        </View>
      </ProfileBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: profileColors.ink, fontFamily: fonts.display, fontSize: 27, letterSpacing: -0.8 },
  titlePeriod: { color: profileColors.purple },
  identity: { alignItems: "center", paddingTop: 14 },
  profileAvatar: { width: 78, height: 78, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: profileColors.border, borderRadius: 39, backgroundColor: "#ffcfaa" },
  scaledAvatar: { transform: [{ scale: 1.95 }] },
  displayName: { marginTop: 15, color: profileColors.ink, fontFamily: fonts.display, fontSize: 28, letterSpacing: -0.8 },
  username: { marginTop: 3, color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 13 },
  memberSince: { marginTop: 5, color: "#918590", fontFamily: fonts.regular, fontSize: 11 },
  editButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, marginTop: 17, borderWidth: 1, borderColor: "#d8c9ed", borderRadius: 20, backgroundColor: v3Colors.lavender, paddingHorizontal: 17 },
  editButtonText: { color: profileColors.purple, fontFamily: fonts.semibold, fontSize: 12 },
  accountSection: { marginTop: 38 },
  sectionLabel: { marginBottom: 8, color: profileColors.ink, fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.1 },
  accountList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: profileColors.border },
  accountRow: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: profileColors.border },
  unavailableRow: { opacity: 0.7 },
  rowIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: profileColors.iconSurface },
  rowTitle: { minWidth: 0, flex: 1, color: profileColors.ink, fontFamily: fonts.semibold, fontSize: 14 },
  rowSecondary: { color: "#8c7d8b", fontFamily: fonts.medium, fontSize: 11 },
  sessionActions: { marginTop: 30 },
  logoutButton: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "#efd7d2", borderRadius: radii.large, backgroundColor: "#fff3ec" },
  logoutText: { color: "#9b3f45", fontFamily: fonts.semibold, fontSize: 13 },
  logoutError: { marginTop: 9, color: colors.danger, fontFamily: fonts.regular, fontSize: 11, textAlign: "center" },
  dangerZone: { marginTop: 26 },
  dangerLabel: { marginBottom: 7, color: "#a26a6d", fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.2 },
  deleteAccountButton: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#efd7d2" },
  deleteAccountCopy: { minWidth: 0, flex: 1, gap: 3 },
  deleteAccountTitle: { color: "#a43d46", fontFamily: fonts.semibold, fontSize: 14 },
  deleteAccountSubtitle: { color: "#9a7c7f", fontFamily: fonts.regular, fontSize: 11 },
  developmentSection: { marginTop: 34 },
  developmentRow: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: profileColors.border },
  developmentText: { color: profileColors.ink, fontFamily: fonts.semibold, fontSize: 13 },
  legalSheet: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
  sheetHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 18 },
  sheetTitle: { color: profileColors.ink, fontFamily: fonts.bold, fontSize: 23, letterSpacing: -0.8 },
  sheetCopy: { marginTop: 5, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 12 },
  legalLinks: { marginTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: profileColors.border },
  legalRow: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: profileColors.border },
  legalRowText: { color: profileColors.ink, fontFamily: fonts.semibold, fontSize: 14 },
  legalError: { marginTop: 12, color: colors.danger, fontFamily: fonts.regular, fontSize: 12 },
  deleteSheet: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24 },
  deleteSheetTitle: { paddingRight: 48, color: profileColors.ink, fontFamily: fonts.bold, fontSize: 23, letterSpacing: -0.8 },
  deleteWarning: { marginTop: 12, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  deleteInputLabel: { marginTop: 22, color: profileColors.ink, fontFamily: fonts.medium, fontSize: 12 },
  deleteInputEmphasis: { fontFamily: fonts.bold },
  deleteInput: { minHeight: 48, marginTop: 9, borderWidth: 1, borderColor: "#debfc0", borderRadius: radii.medium, backgroundColor: profileColors.surface, paddingHorizontal: 13, color: profileColors.ink, fontFamily: fonts.semibold, fontSize: 14, letterSpacing: 0.5 },
  deleteError: { marginTop: 11, color: colors.danger, fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  confirmDeleteButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 18, borderRadius: radii.medium, backgroundColor: "#a43d46", paddingHorizontal: 18 },
  confirmDeleteText: { color: profileColors.background, fontFamily: fonts.bold, fontSize: 13 },
  errorState: { paddingTop: 54 },
  errorTitle: { color: profileColors.ink, fontFamily: fonts.display, fontSize: 28 },
  errorCopy: { marginTop: 10, color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  retryButton: { alignSelf: "flex-start", marginTop: 20, borderRadius: radii.medium, backgroundColor: profileColors.ink, paddingHorizontal: 18, paddingVertical: 12 },
  retryButtonText: { color: profileColors.background, fontFamily: fonts.bold, fontSize: 14 },
  disabled: { opacity: 0.58 },
  rowPressed: { opacity: 0.68 },
  pressed: { opacity: 0.72 },
});
