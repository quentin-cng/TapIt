import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { TapItAvatar } from "../../components/identity/TapItAvatar";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii } from "../../theme/tokens";
import { FriendActionButton } from "./FriendActionButton";
import { FriendConsistencyRow } from "./FriendConsistencyRow";
import { FriendDetailSheet } from "./FriendDetailSheet";
import { FriendsHero } from "./FriendsHero";
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
type FriendsView = "friends" | "requests";

const friendsColors = {
  background: "#faeee3",
  surface: "#fffcf6",
  softSurface: "#f5eadc",
  lavender: "#f2edff",
  ink: "#1a1333",
  purple: "#5b3df6",
  aubergine: "#24143f",
  border: "#eadccd",
} as const;

function FriendsHeader({ avatarId }: { avatarId?: string | null }) {
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
        <TapItAvatar
          avatarId={avatarId}
          borderColor={friendsColors.ink}
          borderWidth={2}
          size={38}
        />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        Friends<Text style={styles.titlePeriod}>.</Text>
      </Text>
      <View style={styles.headerBalance} />
    </View>
  );
}

function FriendsTabs({
  incomingCount,
  onChange,
  value,
}: {
  incomingCount: number;
  onChange: (view: FriendsView) => void;
  value: FriendsView;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {(["friends", "requests"] as const).map((view) => {
        const selected = value === view;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={view}
            onPress={() => onChange(view)}
            style={({ pressed }) => [
              styles.tab,
              selected && styles.tabSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>
              {view === "friends" ? "Friends" : "Requests"}
            </Text>
            {view === "requests" && incomingCount > 0 ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{incomingCount}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function IdentityLine({
  avatarId,
  displayName,
  username,
}: {
  avatarId?: string | null;
  displayName: string;
  username: string;
}) {
  return (
    <View style={styles.identityLine}>
      <TapItAvatar avatarId={avatarId} size={38} />
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
        avatarId={request.profile.avatar_id}
        displayName={displayName}
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
        avatarId={request.profile.avatar_id}
        displayName={displayName}
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
        avatarId={profile.avatar_id}
        displayName={displayName}
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
  const { add } = useLocalSearchParams<{ add?: string | string[] }>();
  const searchInputRef = useRef<TextInput>(null);
  const [activeView, setActiveView] = useState<FriendsView>("friends");
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
      colors={[friendsColors.purple]}
      onRefresh={() => void refresh()}
      refreshing={isRefreshing}
      tintColor={friendsColors.purple}
    />
  );

  function submitSearch() {
    setActionNotice(null);
    setActiveView("friends");
    void runSearch(searchInput);
  }

  function handleSearchInput(value: string) {
    setSearchInput(value);
    if (!value.trim() && searchedQuery) void runSearch("");
  }

  useEffect(() => {
    if (add !== "1") return;

    let focusFrame: number | null = null;
    const activationFrame = requestAnimationFrame(() => {
      setActiveView("friends");
      router.setParams({ add: "" });
      focusFrame = requestAnimationFrame(() => searchInputRef.current?.focus());
    });

    return () => {
      cancelAnimationFrame(activationFrame);
      if (focusFrame !== null) cancelAnimationFrame(focusFrame);
    };
  }, [add]);

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
        <FriendsHeader />
        <FriendsHero />
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
        <FriendsHeader avatarId={data.currentUserAvatarId} />
        <FriendsHero />
        <View style={styles.contentSurface}>
          <View style={styles.searchArea}>
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
                onFocus={() => setActiveView("friends")}
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

            <FriendsTabs
              incomingCount={data.incomingRequests.length}
              onChange={setActiveView}
              value={activeView}
            />

            {activeView === "friends" && searchError ? (
              <Text accessibilityRole="alert" style={styles.fieldError}>
                {searchError}
              </Text>
            ) : activeView === "friends" &&
              searchedQuery &&
              !isSearching &&
              searchProfiles.length === 0 ? (
              <View style={styles.searchEmpty}>
                <Text style={styles.searchEmptyTitle}>No matching users</Text>
                <Text style={styles.searchEmptyCopy}>
                  Check the username and try again.
                </Text>
              </View>
            ) : null}

            {activeView === "friends" && searchProfiles.length > 0 ? (
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
          </View>

          {data.hasDataError ? (
            <Text accessibilityRole="alert" style={styles.inlineError}>
              Some friend or weekly data could not be loaded. Pull down to try
              again.
            </Text>
          ) : null}

          {actionNotice ? (
            <Text
              accessibilityRole={
                actionNotice.status === "error" ? "alert" : "text"
              }
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

          {activeView === "friends" ? (
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
          ) : (
            <View style={styles.requestsSurface}>
              {data.incomingRequests.length > 0 ? (
                <View style={styles.requestGroup}>
                  <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitle}>Incoming</Text>
                    <Text style={styles.sectionCount}>
                      {data.incomingRequests.length}
                    </Text>
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

              {data.outgoingRequests.length > 0 ? (
                <View
                  style={[
                    styles.requestGroup,
                    data.incomingRequests.length > 0 && styles.sentRequests,
                  ]}
                >
                  <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitle}>Sent</Text>
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

              {data.incomingRequests.length === 0 &&
              data.outgoingRequests.length === 0 ? (
                <View style={styles.requestsEmpty}>
                  <MaterialCommunityIcons
                    color={friendsColors.purple}
                    name="account-clock-outline"
                    size={28}
                  />
                  <Text style={styles.requestsEmptyTitle}>
                    No friend requests
                  </Text>
                  <Text style={styles.requestsEmptyCopy}>
                    Incoming and sent requests will appear here.
                  </Text>
                </View>
              ) : null}
            </View>
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
  header: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
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
  headerBalance: { width: 38, height: 38 },
  contentSurface: {
    zIndex: 2,
    minHeight: 300,
    marginTop: -22,
    marginHorizontal: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff8f1",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  tabs: {
    flexDirection: "row",
    marginTop: 14,
    borderWidth: 1,
    borderColor: friendsColors.border,
    borderRadius: 20,
    backgroundColor: friendsColors.surface,
    padding: 3,
  },
  tab: {
    minHeight: 38,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 16,
  },
  tabSelected: { backgroundColor: friendsColors.aubergine },
  tabLabel: {
    color: friendsColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 12,
  },
  tabLabelSelected: { color: friendsColors.surface },
  tabBadge: {
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: "#ef4055",
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: friendsColors.surface,
    fontFamily: fonts.bold,
    fontSize: 9,
  },
  searchArea: { minWidth: 0 },
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
  sentRequests: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: friendsColors.border,
    paddingTop: 16,
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
  friendsSection: { marginTop: 14 },
  friendList: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: friendsColors.border,
    borderRadius: 22,
    backgroundColor: friendsColors.surface,
    paddingHorizontal: 14,
  },
  emptyState: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderWidth: 1,
    borderColor: friendsColors.border,
    borderRadius: 22,
    backgroundColor: friendsColors.surface,
    paddingHorizontal: 17,
    paddingVertical: 20,
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
  requestsSurface: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: friendsColors.border,
    borderRadius: 22,
    backgroundColor: friendsColors.surface,
    paddingHorizontal: 14,
    paddingTop: 15,
    paddingBottom: 4,
  },
  requestGroup: { minWidth: 0 },
  requestsEmpty: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  requestsEmptyTitle: {
    marginTop: 9,
    color: friendsColors.ink,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  requestsEmptyCopy: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  errorState: {
    zIndex: 2,
    marginTop: -22,
    marginHorizontal: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#fff8f1",
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
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
