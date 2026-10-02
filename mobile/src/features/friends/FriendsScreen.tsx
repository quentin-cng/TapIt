import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../auth/SessionProvider";
import { AppScreen } from "../../components/AppScreen";
import { resolveDisplayName } from "../../domain/profile-identity";
import { colors, fonts, radii } from "../../theme/tokens";
import { FriendActionButton } from "./FriendActionButton";
import { FriendConsistencyRow } from "./FriendConsistencyRow";
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
      <Text style={styles.initialText}>
        {Array.from(name.trim())[0]?.toLocaleUpperCase("en-CA") ?? "T"}
      </Text>
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
        </View>
      </View>

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
        <Text style={styles.relationshipStatus}>Respond below</Text>
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
  const [friendForRemoval, setFriendForRemoval] = useState<FriendView | null>(
    null,
  );
  const [removalError, setRemovalError] = useState("");
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

  function handleSearchInput(value: string) {
    setSearchInput(value);

    if (!value.trim() && searchedQuery) {
      void runSearch("");
    }
  }

  function closeRemovalSheet() {
    setFriendForRemoval(null);
    setRemovalError("");
  }

  function openRemovalSheet(friend: FriendView) {
    setRemovalError("");
    setFriendForRemoval(friend);
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

  const removalName = friendForRemoval
    ? resolveDisplayName(
        friendForRemoval.profile.display_name,
        friendForRemoval.profile.username,
      )
    : "";

  return (
    <>
      <AppScreen refreshControl={refreshControl}>
        <Text accessibilityRole="header" style={styles.title}>
          Friends
        </Text>

        <View style={styles.searchControls}>
          <View style={styles.searchField}>
            <MaterialCommunityIcons
              color={colors.textMuted}
              name="magnify"
              size={20}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSearching}
              maxLength={30}
              onChangeText={handleSearchInput}
              onSubmitEditing={submitSearch}
              placeholder="Search friends…"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              spellCheck={false}
              style={styles.searchInput}
              value={searchInput}
            />
          </View>
          <Pressable
            accessibilityLabel="Search friends"
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
              <MaterialCommunityIcons
                color={colors.surface}
                name="arrow-right"
                size={20}
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
          <Text style={styles.sectionLabel}>
            {data.friends.length} {data.friends.length === 1 ? "friend" : "friends"}
          </Text>

          {data.friends.length ? (
            <View style={styles.friendList}>
              {data.friends.map((friend) => (
                <FriendConsistencyRow
                  friend={friend}
                  key={friend.profile.profile_id}
                  onOpenActions={openRemovalSheet}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyFriends}>
              <View style={styles.emptyIcon}>
                <MaterialCommunityIcons
                  color={colors.purple}
                  name="account-multiple-outline"
                  size={25}
                />
              </View>
              <Text style={styles.emptyTitle}>No friends yet</Text>
              <Text style={styles.emptyCopy}>
                Search for another TapIt member to send a friend request.
              </Text>
            </View>
          )}
        </View>

        {data.incomingRequests.length ? (
          <View style={styles.requestsSection}>
            <View style={styles.requestHeading}>
              <Text style={styles.sectionLabel}>Friend requests</Text>
              <View style={styles.requestCount}>
                <Text style={styles.requestCountText}>
                  {data.incomingRequests.length}
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
      </AppScreen>

      <Modal
        animationType="slide"
        onRequestClose={closeRemovalSheet}
        statusBarTranslucent
        transparent
        visible={friendForRemoval !== null}
      >
        <View style={styles.modalBackdrop}>
          <SafeAreaView edges={["bottom"]} style={styles.modalSafeArea}>
            <View style={styles.actionSheet}>
              <View style={styles.actionSheetHandle} />
              <Text style={styles.actionSheetTitle}>{removalName}</Text>
              <Text style={styles.actionSheetCopy}>
                Remove this person from your TapIt friends?
              </Text>
              {friendForRemoval ? (
                <FriendActionButton
                  entityId={friendForRemoval.profile.profile_id}
                  mode="remove"
                  onAction={performAction}
                  onResult={(result) => {
                    if (result.status === "success") {
                      setActionNotice(result);
                      closeRemovalSheet();
                    } else {
                      setRemovalError(result.message);
                    }
                  }}
                />
              ) : null}
              {removalError ? (
                <Text accessibilityRole="alert" style={styles.removalError}>
                  {removalError}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={closeRemovalSheet}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 17,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 34,
    letterSpacing: -1.8,
    lineHeight: 38,
  },
  searchControls: {
    flexDirection: "row",
    gap: 8,
  },
  searchField: {
    minHeight: 46,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 23,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fonts.regular,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchButton: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    backgroundColor: colors.purple,
  },
  fieldError: {
    marginTop: 9,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  searchResults: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  searchResultRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 11,
  },
  searchActionState: {
    alignItems: "flex-end",
  },
  relationshipStatus: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 11,
  },
  friendsStatus: {
    color: colors.success,
  },
  searchEmpty: {
    marginTop: 12,
    borderRadius: radii.medium,
    backgroundColor: colors.surfaceElevated,
    padding: 15,
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
  friendsSection: {
    marginTop: 26,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.05,
    textTransform: "uppercase",
  },
  friendList: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  identityLine: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    fontSize: 11,
  },
  emptyFriends: {
    alignItems: "center",
    marginTop: 10,
    borderRadius: radii.large,
    backgroundColor: "#f0ebfc",
    paddingHorizontal: 22,
    paddingVertical: 27,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#ded3f8",
  },
  emptyTitle: {
    marginTop: 11,
    color: colors.textPrimary,
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  emptyCopy: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },
  requestsSection: {
    marginTop: 30,
  },
  requestHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestCount: {
    minWidth: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#e5dcfa",
    paddingHorizontal: 6,
  },
  requestCountText: {
    color: colors.purpleDark,
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  requestList: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  requestRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: 13,
  },
  requestActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 9,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 19, 0.42)",
  },
  modalSafeArea: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: colors.background,
  },
  actionSheet: {
    alignItems: "stretch",
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 24,
  },
  actionSheetHandle: {
    width: 38,
    height: 4,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  actionSheetTitle: {
    marginTop: 20,
    color: colors.textPrimary,
    fontFamily: fonts.bold,
    fontSize: 21,
    letterSpacing: -0.6,
  },
  actionSheetCopy: {
    marginTop: 6,
    marginBottom: 10,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  removalError: {
    marginTop: 8,
    color: colors.danger,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  cancelButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 13,
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
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.42,
  },
});
