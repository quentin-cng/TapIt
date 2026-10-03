import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
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
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { V3InitialAvatar } from "../../components/identity/V3InitialAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii, v3Colors } from "../../theme/tokens";
import { FriendActionButton } from "./FriendActionButton";
import { FriendConsistencyRow } from "./FriendConsistencyRow";
import { FriendDetailSheet } from "./FriendDetailSheet";
import {
  type FriendActionResult,
  type FriendView,
  type IncomingRequestView,
  type OutgoingRequestView,
  type SearchProfile,
  useFriendsData,
} from "./useFriendsData";

type FriendsTab = "friends" | "requests" | "sent";
type ActionHandler = ReturnType<typeof useFriendsData>["performAction"];

function IdentityLine({
  displayName,
  identityKey,
  username,
}: {
  displayName: string;
  identityKey: string;
  username: string;
}) {
  return (
    <View style={styles.identityLine}>
      <V3InitialAvatar
        identityKey={identityKey}
        name={displayName}
        size="small"
      />
      <View style={styles.identityText}>
        <Text numberOfLines={1} style={styles.identityName}>
          {displayName}
        </Text>
        <Text numberOfLines={1} style={styles.username}>
          @{username}
        </Text>
      </View>
    </View>
  );
}

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
    <View style={styles.relationshipRow}>
      <IdentityLine
        displayName={displayName}
        identityKey={request.profile.username}
        username={request.profile.username}
      />
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

function OutgoingRequestRow({
  onAction,
  onResult,
  request,
}: {
  onAction: ActionHandler;
  onResult: (result: FriendActionResult) => void;
  request: OutgoingRequestView;
}) {
  const displayName = resolveDisplayName(
    request.profile.display_name,
    request.profile.username,
  );

  return (
    <View style={styles.relationshipRow}>
      <IdentityLine
        displayName={displayName}
        identityKey={request.profile.username}
        username={request.profile.username}
      />
      <View style={styles.sentAction}>
        <Text style={styles.pendingLabel}>Pending</Text>
        <FriendActionButton
          entityId={request.id}
          mode="cancel"
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
      <IdentityLine
        displayName={displayName}
        identityKey={profile.username}
        username={profile.username}
      />

      {profile.relationship_status === "friends" ? (
        <Text style={[styles.relationshipStatus, styles.friendsStatus]}>
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
        <Text style={styles.relationshipStatus}>Incoming request</Text>
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

function EmptyState({ copy, title }: { copy: string; title: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          color={v3Colors.purple}
          name="account-multiple-outline"
          size={25}
        />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

export function FriendsScreen() {
  const { session } = useSession();
  const [activeTab, setActiveTab] = useState<FriendsTab>("friends");
  const [searchInput, setSearchInput] = useState("");
  const [actionNotice, setActionNotice] = useState<FriendActionResult | null>(
    null,
  );
  const [selectedFriend, setSelectedFriend] = useState<FriendView | null>(null);
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
      colors={[v3Colors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={v3Colors.purple}
    />
  );

  function submitSearch() {
    setActionNotice(null);
    void runSearch(searchInput);
  }

  function handleSearchInput(value: string) {
    setSearchInput(value);

    if (!value.trim() && searchedQuery) {
      void runSearch("");
    }
  }

  if (isLoading && !data) {
    return (
      <AppScreen refreshControl={refreshControl} showTopbar={false} variant="v3">
        <View style={styles.loadingState}>
          <ActivityIndicator
            accessibilityLabel="Loading friends"
            color={v3Colors.purple}
            size="large"
          />
          <Text style={styles.loadingText}>Loading friends…</Text>
        </View>
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen refreshControl={refreshControl} showTopbar={false} variant="v3">
        <View style={styles.errorState}>
          <Text accessibilityRole="header" style={styles.errorTitle}>
            Friends unavailable
          </Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void loadFriends()}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </AppScreen>
    );
  }

  return (
    <>
      <AppScreen refreshControl={refreshControl} showTopbar={false} variant="v3">
        <Text accessibilityRole="header" style={styles.title}>
          Friends.
        </Text>

        <View style={styles.searchField}>
          <MaterialCommunityIcons
            color={colors.textMuted}
            name="magnify"
            size={19}
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSearching}
            maxLength={30}
            onChangeText={handleSearchInput}
            onSubmitEditing={submitSearch}
            placeholder="Search friends"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            spellCheck={false}
            style={styles.searchInput}
            value={searchInput}
          />
          <Pressable
            accessibilityLabel="Search friends"
            accessibilityRole="button"
            disabled={isSearching || !searchInput.trim()}
            hitSlop={8}
            onPress={submitSearch}
            style={({ pressed }) => [
              styles.searchAction,
              (isSearching || !searchInput.trim()) && styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color={v3Colors.purple} size="small" />
            ) : (
              <MaterialCommunityIcons
                color={v3Colors.purple}
                name="arrow-right"
                size={20}
              />
            )}
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["friends", "Friends"],
              ["requests", "Requests"],
              ["sent", "Sent"],
            ] as const
          ).map(([tab, label]) => {
            const isActive = activeTab === tab;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [
                  styles.tab,
                  isActive && styles.activeTab,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {label}
                </Text>
                {tab === "requests" && data.incomingRequests.length > 0 ? (
                  <View style={styles.requestBadge}>
                    <Text style={styles.requestBadgeText}>
                      {data.incomingRequests.length}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {searchError ? (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {searchError}
          </Text>
        ) : searchedQuery && !isSearching && searchProfiles.length === 0 ? (
          <View style={styles.searchEmpty}>
            <Text style={styles.searchEmptyTitle}>No matching users</Text>
            <Text style={styles.searchEmptyCopy}>
              Check the username and try again.
            </Text>
          </View>
        ) : null}

        {searchProfiles.length > 0 ? (
          <View style={styles.searchResults}>
            <Text style={styles.resultsLabel}>Search results</Text>
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

        {data.hasDataError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            Some friend or weekly data could not be loaded. Pull down to try again.
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

        <View style={styles.tabContent}>
          {activeTab === "friends" ? (
            data.friends.length > 0 ? (
              <View style={styles.friendGrid}>
                {data.friends.map((friend) => (
                  <FriendConsistencyRow
                    friend={friend}
                    key={friend.profile.profile_id}
                    onOpen={setSelectedFriend}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                copy="Search for another TapIt member to send a friend request."
                title="No friends yet"
              />
            )
          ) : activeTab === "requests" ? (
            data.incomingRequests.length > 0 ? (
              <View style={styles.relationshipList}>
                {data.incomingRequests.map((request) => (
                  <IncomingRequestRow
                    key={request.id}
                    onAction={performAction}
                    onResult={setActionNotice}
                    request={request}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                copy="New friend requests will appear here."
                title="No requests"
              />
            )
          ) : data.outgoingRequests.length > 0 ? (
            <View style={styles.relationshipList}>
              {data.outgoingRequests.map((request) => (
                <OutgoingRequestRow
                  key={request.id}
                  onAction={performAction}
                  onResult={setActionNotice}
                  request={request}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              copy="Friend requests you send will appear here until they respond."
              title="No sent requests"
            />
          )}
        </View>
      </AppScreen>

      <FriendDetailSheet
        friend={selectedFriend}
        onAction={performAction}
        onClose={() => setSelectedFriend(null)}
        onRemoved={(result) => {
          setActionNotice(result);
          setSelectedFriend(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 17,
    color: v3Colors.ink,
    fontFamily: fonts.extraBold,
    fontSize: 38,
    letterSpacing: -2.1,
    lineHeight: 42,
  },
  searchField: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 22,
    backgroundColor: "#f0edf4",
    paddingLeft: 14,
    paddingRight: 8,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    color: v3Colors.ink,
    fontFamily: fonts.regular,
    fontSize: 13,
    paddingVertical: 0,
  },
  searchAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  tabs: {
    marginTop: 16,
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    minHeight: 42,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: v3Colors.purple,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  activeTabLabel: {
    color: v3Colors.purple,
  },
  requestBadge: {
    minWidth: 17,
    height: 17,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#ef4055",
    paddingHorizontal: 4,
  },
  requestBadgeText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  fieldError: {
    marginTop: 10,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  searchEmpty: {
    marginTop: 14,
    borderRadius: radii.medium,
    backgroundColor: v3Colors.lavender,
    padding: 14,
  },
  searchEmptyTitle: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  searchEmptyCopy: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  searchResults: {
    marginTop: 15,
    borderRadius: radii.large,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  resultsLabel: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  searchResultRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  searchActionState: {
    alignItems: "flex-end",
  },
  relationshipStatus: {
    maxWidth: 92,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    textAlign: "right",
  },
  friendsStatus: {
    color: colors.success,
  },
  inlineError: {
    marginTop: 13,
    color: colors.danger,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  actionNotice: {
    marginTop: 13,
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  noticeError: {
    color: colors.danger,
  },
  noticeSuccess: {
    color: colors.success,
  },
  tabContent: {
    marginTop: 16,
  },
  friendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },
  identityLine: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  identityText: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  identityName: {
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  relationshipList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  relationshipRow: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sentAction: {
    alignItems: "flex-end",
  },
  pendingLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  emptyState: {
    alignItems: "center",
    borderRadius: radii.large,
    backgroundColor: v3Colors.lavender,
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: v3Colors.lavenderStrong,
  },
  emptyTitle: {
    marginTop: 11,
    color: v3Colors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptyCopy: {
    maxWidth: 260,
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
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
    paddingTop: 24,
  },
  errorTitle: {
    color: v3Colors.ink,
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
    backgroundColor: v3Colors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.68,
  },
});
