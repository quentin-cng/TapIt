import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
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
import { TapPressable } from "../../motion/TapPressable";
import { colors, fonts, radii } from "../../theme/tokens";
import { PenguinProfileArtwork } from "../home/HomeArtwork";
import { FriendActionButton } from "./FriendActionButton";
import { FriendConsistencyRow } from "./FriendConsistencyRow";
import { FriendDetailSheet } from "./FriendDetailSheet";
import { FriendsSkeleton } from "./FriendsSkeleton";
import {
  type FriendActionResult,
  type FriendView,
  type IncomingRequestView,
  type OutgoingRequestView,
  type SearchProfile,
  useFriendsData,
} from "./useFriendsData";

type ActionHandler = ReturnType<typeof useFriendsData>["performAction"];

const friendsColors = {
  background: "#fff8f1",
  surface: "#fffcf6",
  softSurface: "#f5eadc",
  lavender: "#f2edff",
  ink: "#1a1333",
  purple: "#5b3df6",
  aubergine: "#24143f",
  border: "#eadccd",
} as const;

function FriendsHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityHint="Opens your account settings"
        accessibilityLabel="Open Profile"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push("/profile")}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <PenguinProfileArtwork />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        Friends<Text style={styles.titlePeriod}>.</Text>
      </Text>
      <Pressable
        accessibilityHint="Focuses friend search"
        accessibilityLabel="Add friend"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onAdd}
        style={({ pressed }) => [
          styles.headerAction,
          pressed && styles.pressed,
        ]}
      >
        <MaterialCommunityIcons
          color={friendsColors.ink}
          name="account-plus-outline"
          size={25}
        />
      </Pressable>
    </View>
  );
}

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
          mode="decline"
          onAction={onAction}
          onResult={onResult}
        />
        <FriendActionButton
          entityId={request.id}
          mode="accept"
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

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        color={friendsColors.purple}
        name="account-multiple-outline"
        size={28}
      />
      <View style={styles.emptyCopyBlock}>
        <Text style={styles.emptyTitle}>No friends yet</Text>
        <Text style={styles.emptyCopy}>
          Find another TapIt member and start showing up together.
        </Text>
      </View>
    </View>
  );
}

export function FriendsScreen() {
  const { session } = useSession();
  const searchInputRef = useRef<TextInput>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isAddAreaActive, setIsAddAreaActive] = useState(false);
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
      colors={[friendsColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={friendsColors.purple}
    />
  );

  function openAddFlow() {
    setIsAddAreaActive(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  function submitSearch() {
    setActionNotice(null);
    setIsAddAreaActive(true);
    void runSearch(searchInput);
  }

  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (!value.trim() && searchedQuery) void runSearch("");
  }

  if (isLoading && !data) {
    return (
      <AppScreen
        backgroundColor={friendsColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <FriendsSkeleton />
      </AppScreen>
    );
  }

  if (!data) {
    return (
      <AppScreen
        backgroundColor={friendsColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <FriendsHeader onAdd={() => undefined} />
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
      <AppScreen
        backgroundColor={friendsColors.background}
        refreshControl={refreshControl}
        showTopbar={false}
        variant="v3"
      >
        <FriendsHeader onAdd={openAddFlow} />

        {isAddAreaActive ? (
          <View style={styles.addArea}>
            <View style={styles.searchField}>
              <MaterialCommunityIcons
                color={colors.textMuted}
                name="magnify"
                size={18}
              />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSearching}
                maxLength={30}
                onChangeText={handleSearchInput}
                onSubmitEditing={submitSearch}
                placeholder="Search friends..."
                placeholderTextColor={colors.textMuted}
                ref={searchInputRef}
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
                  <ActivityIndicator color={friendsColors.purple} size="small" />
                ) : (
                  <MaterialCommunityIcons
                    color={friendsColors.purple}
                    name="arrow-right"
                    size={19}
                  />
                )}
              </Pressable>
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
                <Text style={styles.eyebrow}>Search results</Text>
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

            {data.outgoingRequests.length > 0 ? (
              <View style={styles.sentRequests}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>Sent requests</Text>
                  <Text style={styles.sectionCount}>
                    {data.outgoingRequests.length}
                  </Text>
                </View>
                {data.outgoingRequests.map((request) => (
                  <OutgoingRequestRow
                    key={request.id}
                    onAction={performAction}
                    onResult={setActionNotice}
                    request={request}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {data.incomingRequests.length > 0 ? (
          <View style={styles.requestSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Friend requests</Text>
              <View style={styles.requestBadge}>
                <Text style={styles.requestBadgeText}>
                  {data.incomingRequests.length}
                </Text>
              </View>
            </View>
            {data.incomingRequests.map((request) => (
              <IncomingRequestRow
                key={request.id}
                onAction={performAction}
                onResult={setActionNotice}
                request={request}
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

        <View style={styles.friendsSection}>
          {data.friends.length > 0 ? (
            <View style={styles.friendList}>
              {data.friends.map((friend) => (
                <FriendConsistencyRow
                  friend={friend}
                  key={friend.profile.profile_id}
                  onOpen={setSelectedFriend}
                />
              ))}
            </View>
          ) : (
            <EmptyState />
          )}
        </View>

        <TapPressable
          accessibilityHint="Focuses friend search"
          accessibilityRole="button"
          haptic="press"
          onPress={openAddFlow}
          style={({ pressed }) => [
            styles.addFriendsButton,
            pressed && styles.addFriendsButtonPressed,
          ]}
        >
          <MaterialCommunityIcons
            color={friendsColors.surface}
            name="account-plus-outline"
            size={22}
          />
          <Text style={styles.addFriendsLabel}>Add friends</Text>
        </TapPressable>
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
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  title: {
    position: "absolute",
    right: 52,
    left: 52,
    color: friendsColors.ink,
    fontFamily: fonts.display,
    fontSize: 29,
    letterSpacing: -1,
    textAlign: "center",
  },
  titlePeriod: { color: friendsColors.purple },
  headerAction: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  addArea: { marginTop: 2 },
  searchField: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 21,
    backgroundColor: friendsColors.softSurface,
    paddingLeft: 14,
    paddingRight: 7,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    color: friendsColors.ink,
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
  fieldError: {
    marginTop: 9,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  searchEmpty: {
    marginTop: 12,
    borderRadius: radii.medium,
    backgroundColor: friendsColors.lavender,
    padding: 13,
  },
  searchEmptyTitle: {
    color: friendsColors.ink,
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
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: friendsColors.surface,
    paddingHorizontal: 13,
    paddingTop: 12,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase",
  },
  searchResultRow: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: friendsColors.border,
    paddingVertical: 9,
  },
  searchActionState: { alignItems: "flex-end" },
  relationshipStatus: {
    maxWidth: 92,
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 10,
    textAlign: "right",
  },
  friendsStatus: { color: colors.success },
  sentRequests: { marginTop: 17 },
  requestSection: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: friendsColors.lavender,
    paddingHorizontal: 13,
    paddingTop: 13,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: friendsColors.ink,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  sectionCount: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  requestBadge: {
    minWidth: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#ef4055",
    paddingHorizontal: 5,
  },
  requestBadgeText: {
    color: friendsColors.surface,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  identityLine: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  identityText: { minWidth: 0, flex: 1, gap: 2 },
  identityName: {
    color: friendsColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  username: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 10,
  },
  relationshipRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: friendsColors.border,
    paddingVertical: 9,
  },
  requestActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  sentAction: { alignItems: "flex-end" },
  pendingLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    fontSize: 10,
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
  noticeError: { color: colors.danger },
  noticeSuccess: { color: colors.success },
  friendsSection: { marginTop: 20 },
  friendList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: friendsColors.border,
  },
  emptyState: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: friendsColors.border,
    paddingVertical: 18,
  },
  emptyCopyBlock: { minWidth: 0, flex: 1 },
  emptyTitle: {
    color: friendsColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptyCopy: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  addFriendsButton: {
    minHeight: 54,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 20,
    backgroundColor: friendsColors.aubergine,
    paddingHorizontal: 20,
  },
  addFriendsButtonPressed: { opacity: 0.86 },
  addFriendsLabel: {
    color: friendsColors.surface,
    fontFamily: fonts.semibold,
    fontSize: 16,
  },
  errorState: { paddingTop: 24 },
  errorTitle: {
    color: friendsColors.ink,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: -1,
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
    backgroundColor: friendsColors.purple,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: friendsColors.surface,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.68 },
});
