import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii } from "../../theme/tokens";
import { ProfileIdentityEditor } from "./ProfileIdentityEditor";
import { ProfilePrivacySetting } from "./ProfilePrivacySetting";
import { useProfileData } from "./useProfileData";
import { WeeklyGoalEditor } from "./WeeklyGoalEditor";

type ExpandedRow = "identity" | "privacy" | null;

type AccountRowProps = {
  destructive?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconBackground: string;
  iconColor: string;
  onPress?: () => void;
  showChevron?: boolean;
  showDivider?: boolean;
  subtitle: string;
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
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace("/");
  }
}

function AccountRow({
  destructive = false,
  disabled = false,
  expanded = false,
  icon,
  iconBackground,
  iconColor,
  onPress,
  showChevron = false,
  showDivider = true,
  subtitle,
  title,
}: AccountRowProps) {
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: iconBackground }]}>
        <MaterialCommunityIcons color={iconColor} name={icon} size={20} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      {showChevron ? (
        <MaterialCommunityIcons
          color={colors.textMuted}
          name={expanded ? "chevron-up" : "chevron-right"}
          size={21}
        />
      ) : null}
    </>
  );
  const rowStyle = [
    styles.accountRow,
    showDivider && styles.rowDivider,
    disabled && styles.unavailableRow,
  ];

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

export function ProfileScreen() {
  const { session } = useSession();
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    load,
    refresh,
    signOut,
    updateIdentity,
    updatePrivacy,
    updateWeeklyGoal,
  } = useProfileData(session!.user.id);
  const [expandedRow, setExpandedRow] = useState<ExpandedRow>(null);
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refreshControl = (
    <RefreshControl
      colors={[colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={colors.purple}
    />
  );
  const returnControl = (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      onPress={returnHome}
      style={({ pressed }) => pressed && styles.returnPressed}
    >
      <Text style={styles.returnText}>Back</Text>
    </Pressable>
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

  if (isLoading && !data) {
    return (
      <AppScreen refreshControl={refreshControl} topbarAccessory={returnControl}>
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading profile"
            color={colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading profile…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl} topbarAccessory={returnControl}>
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Profile unavailable
          </Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void load()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  const displayName = resolveDisplayName(
    data.profile.display_name,
    data.profile.username,
  );
  const goalSummary = data.currentGoal
    ? `${data.currentGoal} ${data.currentGoal === 1 ? "workout" : "workouts"} per week`
    : "Set your weekly goal";

  return (
    <>
      <AppScreen refreshControl={refreshControl} topbarAccessory={returnControl}>
        <View style={styles.identityHeader}>
          <Text accessibilityRole="header" style={styles.displayName}>
            {displayName}
          </Text>
          <Text style={styles.identityMeta}>
            @{data.profile.username} · Member since {formatMemberSince(data.profile.created_at)}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <ProfileStat label="This week" value={data.currentWeekSessions} />
          <View style={styles.statDivider} />
          <ProfileStat label="Points" value={data.profile.total_points} />
          <View style={styles.statDivider} />
          <ProfileStat
            label="Week streak"
            value={data.weeklyStreaks.currentStreak}
          />
        </View>

        {data.hasDataError ? (
          <Text accessibilityRole="alert" style={styles.partialError}>
            Some profile activity could not be loaded. Pull down to try again.
          </Text>
        ) : null}

        <View style={styles.accountSection}>
          <Text style={styles.sectionLabel}>Your account</Text>
          <View style={styles.accountList}>
            <AccountRow
              expanded={expandedRow === "identity"}
              icon="account-edit-outline"
              iconBackground="#e4f1ed"
              iconColor="#27735a"
              onPress={() =>
                setExpandedRow((current) =>
                  current === "identity" ? null : "identity",
                )
              }
              showChevron
              showDivider={false}
              subtitle="Name and username"
              title="Edit profile"
            />
            {expandedRow === "identity" ? (
              <View style={styles.inlineEditor}>
                <ProfileIdentityEditor
                  displayName={displayName}
                  onCancel={() => setExpandedRow(null)}
                  onSave={updateIdentity}
                  username={data.profile.username}
                />
              </View>
            ) : null}

            <AccountRow
              icon="target"
              iconBackground="#ece6fb"
              iconColor={colors.purple}
              onPress={() => {
                setExpandedRow(null);
                setIsGoalModalVisible(true);
              }}
              showChevron
              subtitle={goalSummary}
              title="Weekly goal"
            />

            <AccountRow
              disabled
              icon="bell-outline"
              iconBackground="#e8eff8"
              iconColor="#52729b"
              subtitle="Coming soon"
              title="Notifications"
            />

            <AccountRow
              expanded={expandedRow === "privacy"}
              icon="shield-lock-outline"
              iconBackground="#f6eddc"
              iconColor="#765926"
              onPress={() =>
                setExpandedRow((current) =>
                  current === "privacy" ? null : "privacy",
                )
              }
              showChevron
              subtitle="Leaderboard visibility"
              title="Privacy"
            />
            {expandedRow === "privacy" ? (
              <View style={styles.inlineEditor}>
                <ProfilePrivacySetting
                  onChange={updatePrivacy}
                  value={data.generalPreference}
                />
              </View>
            ) : null}

            <AccountRow
              icon="logout-variant"
              iconBackground="#f4ebf8"
              iconColor="#79528c"
              onPress={() => void logout()}
              subtitle={isSigningOut ? "Signing out…" : "Sign out on this device"}
              title="Log out"
            />
            {logoutError ? (
              <Text accessibilityRole="alert" style={styles.logoutError}>
                {logoutError}
              </Text>
            ) : null}

            <AccountRow
              destructive
              disabled
              icon="delete-outline"
              iconBackground="#fae8eb"
              iconColor={colors.danger}
              subtitle="Coming soon"
              title="Delete account"
            />
          </View>
        </View>

        {__DEV__ ? (
          <View style={styles.developmentSection}>
            <Text style={styles.sectionLabel}>Development</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/dev-checkin")}
              style={({ pressed }) => [
                styles.developmentRow,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.developmentText}>Check-in tester</Text>
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="chevron-right"
                size={21}
              />
            </Pressable>
          </View>
        ) : null}
      </AppScreen>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsGoalModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={isGoalModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={["bottom"]} style={styles.modalSafeArea}>
            {isGoalModalVisible ? (
              <WeeklyGoalEditor
                currentGoal={data.currentGoal}
                onCancel={() => setIsGoalModalVisible(false)}
                onSave={updateWeeklyGoal}
                pendingGoal={data.pendingGoal?.goalSessions ?? null}
              />
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  returnText: {
    color: colors.purple,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  returnPressed: {
    opacity: 0.55,
  },
  identityHeader: {
    paddingTop: 1,
  },
  displayName: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 30,
    letterSpacing: -1.4,
    lineHeight: 34,
  },
  identityMeta: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  statsRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
  },
  stat: {
    minWidth: 0,
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 23,
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.8,
  },
  statLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.75,
    textTransform: "uppercase",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 34,
    backgroundColor: colors.border,
  },
  partialError: {
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.danger,
    paddingLeft: 10,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  accountSection: {
    marginTop: 24,
  },
  sectionLabel: {
    marginBottom: 9,
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.05,
    textTransform: "uppercase",
  },
  accountList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  accountRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  rowCopy: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
    lineHeight: 19,
  },
  rowSubtitle: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
  },
  destructiveText: {
    color: colors.danger,
  },
  unavailableRow: {
    opacity: 0.72,
  },
  inlineEditor: {
    paddingBottom: 13,
  },
  logoutError: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: 10,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  developmentSection: {
    marginTop: 32,
  },
  developmentRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  developmentText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 19, 0.42)",
  },
  modalSafeArea: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  loadingState: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  errorState: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  errorTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 28,
    letterSpacing: -1.2,
  },
  errorCopy: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 20,
    borderRadius: radii.small,
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  rowPressed: {
    opacity: 0.62,
  },
  pressed: {
    opacity: 0.75,
  },
});
