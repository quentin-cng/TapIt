import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { ProgressBar } from "../../components/ProgressBar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii } from "../../theme/tokens";
import { FriendActionButton } from "./FriendActionButton";
import {
  type FriendActionResult,
  type FriendView,
  type IncomingRequestView,
  type SearchProfile,
  useFriendsData,
} from "./useFriendsData";

function Initial({ name }: { name: string }) {
  return (
    <View accessibilityElementsHidden style={styles.initial}>
      <Text style={styles.initialText}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

type ActionHandler = ReturnType<typeof useFriendsData>["performAction"];

function IncomingRequestRow({
  onAction,
  onResult,
  request,
}: {
  onAction: ActionHandler;
  onResult: (result: FriendActionResult) => void;
  request: IncomingRequestView;
}) {
  const displayName = resolveDisplayName(
    request.profile.display_name,
    request.profile.username,
  );

  return (
    <View style={styles.requestRow}>
      <View style={styles.identityLine}>
        <Initial name={displayName} />
        <View style={styles.identityText}>
          <Text numberOfLines={1} style={styles.identityName}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.username}>
            @{request.profile.username}
          </Text>
          <Text style={styles.secondaryMetric}>
            {request.profile.total_points} total points
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <FriendActionButton
          entityId={request.id}
          mode="accept"
          onAction={onAction}
          onResult={onResult}
        />
        <FriendActionButton
          entityId={request.id}
          mode="decline"
          onAction={onAction}
          onResult={onResult}
        />
      </View>
    </View>
  );
}

function FriendRow({
  friend,
  onAction,
  onResult,
}: {
  friend: FriendView;
  onAction: ActionHandler;
  onResult: (result: FriendActionResult) => void;
}) {
  const displayName = resolveDisplayName(
    friend.profile.display_name,
    friend.profile.username,
  );
  const goal = friend.weeklyStat?.currentGoal;
  const sessions = friend.weeklyStat?.currentSessions ?? 0;
  const goalComplete = friend.weeklyStat?.currentGoalAchieved === true;

  return (
    <View style={styles.friendRow}>
      <View style={styles.friendHeading}>
        <View style={styles.identityLine}>
          <Initial name={displayName} />
          <View style={styles.identityText}>
            <Text numberOfLines={1} style={styles.identityName}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.username}>
              @{friend.profile.username}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.goalStatus,
            goalComplete && styles.goalStatusComplete,
          ]}
        >
          {goalComplete ? "Goal complete" : goal ? "In progress" : "No goal"}
        </Text>
      </View>

      <View style={styles.progressBlock}>
        <Text style={styles.weeklyProgressText}>
          {goal === null || goal === undefined
            ? "No weekly goal"
            : `${sessions} / ${goal} this week`}
        </Text>
        {goal ? (
          <ProgressBar
            height={5}
            label={`${displayName} completed ${sessions} of ${goal} weekly sessions`}
            max={goal}
            value={sessions}
          />
        ) : null}
      </View>

      <View style={styles.friendFooter}>
        <View style={styles.friendFacts}>
          <Text style={styles.streakText}>
            Weekly streak · {friend.weeklyStat?.currentWeeklyGoalStreak ?? 0} wk
          </Text>
          <Text style={styles.secondaryMetric}>
            {friend.profile.total_points} total points
          </Text>
        </View>
        <FriendActionButton
          entityId={friend.profile.profile_id}
          mode="remove"
          onAction={onAction}
          onResult={onResult}
        />
      </View>
    </View>
  );
}

function SearchResultRow({
  onAction,
  onResult,
  profile,
}: {
  onAction: ActionHandler;
  onResult: (result: FriendActionResult) => void;
  profile: SearchProfile;
}) {
  const displayName = resolveDisplayName(profile.display_name, profile.username);

  return (
    <View style={styles.searchResultRow}>
      <View style={styles.identityLine}>
        <Initial name={displayName} />
        <View style={styles.identityText}>
          <Text numberOfLines={1} style={styles.identityName}>
            {displayName}
          </Text>
          <Text numberOfLines={1} style={styles.username}>
            @{profile.username}
          </Text>
          <Text style={styles.secondaryMetric}>{profile.total_points} total points</Text>
        </View>
      </View>

      {profile.relationship_status === "friends" ? (
        <Text style={[styles.relationshipStatus, styles.goalStatusComplete]}>
          Friends
        </Text>
      ) : profile.relationship_status === "outgoing" ? (
        <View style={styles.searchActionState}>
          <Text style={styles.relationshipStatus}>Requested</Text>
          {profile.request_id ? (
            <FriendActionButton
              entityId={profile.request_id}
              mode="cancel"
              onAction={onAction}
              onResult={onResult}
            />
          ) : null}
        </View>
      ) : profile.relationship_status === "incoming" ? (
        <Text style={styles.relationshipStatus}>Respond</Text>
      ) : (
        <FriendActionButton
          entityId={profile.username}
          mode="send"
          onAction={onAction}
          onResult={onResult}
        />
      )}
    </View>
  );
}

export function FriendsScreen() {
  const { session } = useSession();
  const [searchInput, setSearchInput] = useState("");
  const [actionNotice, setActionNotice] = useState<FriendActionResult | null>(
    null,
  );
  const {
    data,
    error,
    isLoading,
    isRefreshing,
    isSearching,
    loadFriends,
    performAction,
    refresh,
    runSearch,
    searchError,
    searchProfiles,
    searchedQuery,
  } = useFriendsData(session!.user.id);

  useFocusEffect(
    useCallback(() => {
      void loadFriends();
    }, [loadFriends]),
  );

  const refreshControl = (
    <RefreshControl
      colors={[colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={colors.purple}
    />
  );

  function submitSearch() {
    setActionNotice(null);
    void runSearch(searchInput);
  }

  if (isLoading && !data) {
    return (
      <AppScreen refreshControl={refreshControl}>
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading friends"
            color={colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading friends…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl}>
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Friends unavailable
          </Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadFriends()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen refreshControl={refreshControl}>
      <Text accessibilityRole="header" style={styles.title}>
        Friends
      </Text>

      {data.hasDataError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          We couldn’t load all friend data. Pull down to try again.
        </Text>
      ) : null}

      {actionNotice ? (
        <Text
          accessibilityRole={actionNotice.status === "error" ? "alert" : "text"}
          style={[
            styles.actionNotice,
            actionNotice.status === "error"
              ? styles.noticeError
              : styles.noticeSuccess,
          ]}
        >
          {actionNotice.message}
        </Text>
      ) : null}

      <View style={styles.searchSection}>
        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionLabel}>Find friends</Text>
            <Text style={styles.sectionTitle}>Search by username</Text>
          </View>
        </View>
        <View style={styles.searchControls}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSearching}
            maxLength={30}
            onChangeText={setSearchInput}
            onSubmitEditing={submitSearch}
            placeholder="Search username"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            spellCheck={false}
            style={styles.searchInput}
            value={searchInput}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSearching || !searchInput.trim()}
            onPress={submitSearch}
            style={({ pressed }) => [
              styles.searchButton,
              (isSearching || !searchInput.trim()) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color={colors.surface} size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </Pressable>
        </View>

        {searchError ? (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {searchError}
          </Text>
        ) : !searchedQuery ? (
          <Text style={styles.fieldHelp}>
            Enter a username to find another member.
          </Text>
        ) : !isSearching && searchProfiles.length === 0 ? (
          <View style={styles.searchEmpty}>
            <Text style={styles.emptyTitle}>No matching users</Text>
            <Text style={styles.emptyCopy}>Check the username and try again.</Text>
          </View>
        ) : null}

        {searchProfiles.length ? (
          <View style={styles.searchResults}>
            {searchProfiles.map((profile) => (
              <SearchResultRow
                key={profile.username}
                onAction={performAction}
                onResult={setActionNotice}
                profile={profile}
              />
            ))}
          </View>
        ) : null}
      </View>

      {data.incomingRequests.length ? (
        <View style={styles.requestsSection}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionLabel}>Friend requests</Text>
              <Text style={styles.sectionTitle}>
                {data.incomingRequests.length}{" "}
                {data.incomingRequests.length === 1 ? "request" : "requests"}
              </Text>
            </View>
          </View>
          <View style={styles.requestList}>
            {data.incomingRequests.map((request) => (
              <IncomingRequestRow
                key={request.id}
                onAction={performAction}
                onResult={setActionNotice}
                request={request}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.friendsSection}>
        <View style={styles.sectionHeadingRow}>
          <View>
            <Text style={styles.sectionLabel}>Your friends</Text>
            <Text style={styles.sectionTitle}>
              {data.friends.length} connected
            </Text>
          </View>
        </View>

        {data.friends.length ? (
          <View style={styles.friendList}>
            {data.friends.map((friend) => (
              <FriendRow
                friend={friend}
                key={friend.profile.profile_id}
                onAction={performAction}
                onResult={setActionNotice}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyFriends}>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyCopy}>
              Find another TapIt member and send a friend request.
            </Text>
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 36,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 46,
    letterSpacing: -2.8,
    lineHeight: 49,
  },
  inlineError: {
    marginTop: -16,
    marginBottom: 24,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  actionNotice: {
    marginTop: -16,
    marginBottom: 24,
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 19,
  },
  noticeError: {
    color: colors.danger,
  },
  noticeSuccess: {
    color: colors.success,
  },
  searchSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  sectionHeading: {
    marginBottom: 16,
  },
  sectionHeadingRow: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 6,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  searchControls: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    minHeight: 48,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.medium,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  searchButton: {
    minWidth: 78,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.medium,
    backgroundColor: colors.purple,
    paddingHorizontal: 14,
  },
  searchButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  fieldHelp: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  fieldError: {
    marginTop: 12,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  searchResults: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  searchResultRow: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 14,
  },
  searchActionState: {
    alignItems: "flex-end",
  },
  relationshipStatus: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  searchEmpty: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 20,
  },
  requestsSection: {
    marginTop: 44,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  requestList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  requestRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 15,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  friendsSection: {
    marginTop: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 24,
  },
  friendList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  friendRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 18,
  },
  friendHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  identityLine: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  initial: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#e9e3f7",
  },
  initialText: {
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 13,
  },
  identityText: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  identityName: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
  },
  secondaryMetric: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  goalStatus: {
    flexShrink: 0,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  goalStatusComplete: {
    color: colors.success,
  },
  progressBlock: {
    gap: 8,
    marginTop: 16,
  },
  weeklyProgressText: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  friendFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
  },
  friendFacts: {
    gap: 4,
  },
  streakText: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  emptyFriends: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: 24,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptyCopy: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
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
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.45,
  },
});
