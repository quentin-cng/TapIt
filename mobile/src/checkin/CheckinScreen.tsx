import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../auth/SessionProvider";
import { fonts } from "../theme/tokens";
import { getResultCopy, type CheckinRow } from "./checkin-contract";
import { CheckinSuccessView } from "./CheckinSuccessView";
import { useCheckinFlow } from "./useCheckinFlow";
import { VerificationPulse } from "./VerificationPulse";

type SharedCheckinScreenProps = {
  onBack: () => void;
  onDone: () => void;
};

type CheckinScreenProps = SharedCheckinScreenProps &
  (
    | { mode: "development" }
    | {
        mode: "route";
        token: string;
      }
  );

type CheckinPreview = {
  result: CheckinRow;
  streak: number | null;
};

const successPreview: CheckinPreview = {
  result: {
    status: "success",
    checkin_id: "development-preview-success",
    location_id: "development-preview-location",
    location_name: "McGill Fitness Centre",
    points_awarded: 10,
    total_points: 65,
    checked_in_at: "2026-10-01T12:00:00.000Z",
    next_eligible_at: "2026-10-01T16:00:00.000Z",
    weekly_goal: 4,
    weekly_sessions: 2,
    weekly_bonus_points: 0,
    weekly_goal_completed: false,
    total_points_earned: 10,
  },
  streak: 1,
};

const weeklyBonusPreview: CheckinPreview = {
  result: {
    status: "success",
    checkin_id: "development-preview-weekly-bonus",
    location_id: "development-preview-location",
    location_name: "McGill Fitness Centre",
    points_awarded: 10,
    total_points: 85,
    checked_in_at: "2026-10-01T12:00:00.000Z",
    next_eligible_at: "2026-10-01T16:00:00.000Z",
    weekly_goal: 4,
    weekly_sessions: 4,
    weekly_bonus_points: 20,
    weekly_goal_completed: true,
    total_points_earned: 30,
  },
  streak: 2,
};

const cooldownPreview: CheckinPreview = {
  result: {
    status: "cooldown",
    checkin_id: null,
    location_id: "development-preview-location",
    location_name: "McGill Fitness Centre",
    points_awarded: 0,
    total_points: 65,
    checked_in_at: null,
    next_eligible_at: "2026-10-01T16:00:00.000Z",
    weekly_goal: 4,
    weekly_sessions: 2,
    weekly_bonus_points: 0,
    weekly_goal_completed: false,
    total_points_earned: 0,
  },
  streak: null,
};

function TapItHeader({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Text style={styles.wordmark}>
        Tap<Text style={styles.wordmarkAccent}>It</Text>
      </Text>
      <Pressable
        accessibilityRole="button"
        hitSlop={10}
        onPress={onBack}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </View>
  );
}

export function CheckinScreen(props: CheckinScreenProps) {
  const { onBack, onDone } = props;
  const { session } = useSession();
  const isDevelopmentMode = props.mode === "development";
  const flow = useCheckinFlow(session!.user.id, {
    fixedToken: props.mode === "route" ? props.token : undefined,
  });
  const [preview, setPreview] = useState<CheckinPreview | null>(null);

  if (isDevelopmentMode && !__DEV__) return null;

  const isVerifying = flow.isResolving || flow.isSubmitting;
  const verificationMessage = flow.isResolving
    ? "Checking your tap…"
    : flow.verificationMessage || "Checking your tap…";

  async function openSettings() {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error("[mobile check-in] could not open settings", error);
    }
  }

  function startSuccessPreview(nextPreview: CheckinPreview) {
    setPreview(nextPreview);
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => undefined);
  }

  if (preview?.result.status === "success") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <CheckinSuccessView
            onDone={() => setPreview(null)}
            result={preview.result}
            streak={preview.streak}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (preview) {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <StatusBar style="light" />
        <TapItHeader onBack={() => setPreview(null)} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ResultState
            onDone={() => setPreview(null)}
            onResetAttempt={() => setPreview(null)}
            onResetToken={() => setPreview(null)}
            result={preview.result}
            showResetToken
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (flow.result?.status === "success") {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.successContent}
          showsVerticalScrollIndicator={false}
        >
          <CheckinSuccessView
            onDone={onDone}
            result={flow.result}
            streak={flow.successStreak}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <StatusBar style="light" />
      <TapItHeader onBack={onBack} />

      {isVerifying ? (
        <VerificationPulse message={verificationMessage} />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!flow.context || !flow.selectedToken ? (
              isDevelopmentMode ? (
                <View style={styles.mainState}>
                  <Text style={styles.eyebrow}>Development check-in</Text>
                  <Text accessibilityRole="header" style={styles.title}>
                    Test a real TapIt token.
                  </Text>
                  <Text style={styles.bodyCopy}>
                    Enter the token portion of a production NFC URL. Manual
                    entry remains unavailable in production builds.
                  </Text>

                  <View style={styles.field}>
                    <Text style={styles.fieldLabel}>NFC token</Text>
                    <TextInput
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!flow.isResolving}
                      onChangeText={flow.setTokenInput}
                      onSubmitEditing={() => void flow.resolveToken()}
                      placeholder="Paste token"
                      placeholderTextColor="#6f6b77"
                      selectionColor="#9b7af2"
                      style={styles.input}
                      value={flow.tokenInput}
                    />
                  </View>

                  {flow.contextError ? (
                    <View accessibilityRole="alert" style={styles.inlineIssue}>
                      <Text style={styles.issueText}>{flow.contextError}</Text>
                    </View>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    disabled={!flow.tokenInput.trim()}
                    onPress={() => void flow.resolveToken()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      !flow.tokenInput.trim() && styles.disabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Resolve token</Text>
                  </Pressable>

                  <View style={styles.previewSection}>
                    <Text style={styles.previewLabel}>UI preview</Text>
                    <Text style={styles.previewCopy}>
                      Development fixtures only. These previews never contact
                      the check-in backend or change account data.
                    </Text>
                    <View style={styles.previewActions}>
                      <PreviewButton
                        label="Preview Success"
                        onPress={() => startSuccessPreview(successPreview)}
                      />
                      <PreviewButton
                        label="Preview Weekly Bonus"
                        onPress={() => startSuccessPreview(weeklyBonusPreview)}
                      />
                      <PreviewButton
                        label="Preview Cooldown"
                        onPress={() => setPreview(cooldownPreview)}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.mainState}>
                  <Text style={styles.eyebrow}>Check-in unavailable</Text>
                  <Text accessibilityRole="header" style={styles.title}>
                    We couldn’t open this TapIt tag.
                  </Text>
                  <Text accessibilityRole="alert" style={styles.bodyCopy}>
                    {flow.contextError ||
                      "The check-in location could not be loaded. Try again."}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void flow.resolveToken()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Try again</Text>
                  </Pressable>
                </View>
              )
            ) : flow.result ? (
              <ResultState
                onDone={onDone}
                onResetAttempt={flow.resetAttempt}
                onResetToken={flow.resetToken}
                result={flow.result}
                showResetToken={isDevelopmentMode}
              />
            ) : flow.clientIssue || flow.backendError ? (
              <View style={styles.mainState}>
                <Text style={styles.eyebrow}>Check-in paused</Text>
                <Text accessibilityRole="header" style={styles.title}>
                  {flow.clientIssue?.title ?? "We couldn’t complete this tap."}
                </Text>
                <Text accessibilityRole="alert" style={styles.bodyCopy}>
                  {flow.clientIssue?.message ?? flow.backendError}
                </Text>

                {flow.clientIssue?.canOpenSettings ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => void openSettings()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>Open settings</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  onPress={flow.resetAttempt}
                  style={({ pressed }) => [
                    flow.clientIssue?.canOpenSettings
                      ? styles.secondaryButton
                      : styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={
                      flow.clientIssue?.canOpenSettings
                        ? styles.secondaryButtonText
                        : styles.primaryButtonText
                    }
                  >
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.mainState}>
                <Text style={styles.eyebrow}>Ready to check in</Text>
                <Text accessibilityRole="header" style={styles.locationName}>
                  {flow.context.location_name ?? "TapIt location"}
                </Text>
                <Text style={styles.bodyCopy}>
                  {flow.context.requires_location_verification
                    ? "This location requires a fresh GPS verification. Location permission will be requested only after you press CHECK IN."
                    : "This location does not require GPS verification. Your visit is rewarded only after you press CHECK IN."}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => void flow.performCheckin()}
                  style={({ pressed }) => [
                    styles.checkinButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.checkinButtonText}>CHECK IN</Text>
                </Pressable>

                {isDevelopmentMode ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={flow.resetToken}
                    style={({ pressed }) => [
                      styles.textButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.textButtonText}>Use another token</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function PreviewButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.previewButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.previewButtonText}>{label}</Text>
    </Pressable>
  );
}

function ResultState({
  onDone,
  onResetAttempt,
  onResetToken,
  result,
  showResetToken,
}: {
  onDone: () => void;
  onResetAttempt: () => void;
  onResetToken: () => void;
  result: Exclude<ReturnType<typeof useCheckinFlow>["result"], null>;
  showResetToken: boolean;
}) {
  const copy = getResultCopy(result);
  const canRetry = copy.retryable;

  return (
    <View style={styles.mainState}>
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.title}>
        {copy.title}
      </Text>
      <Text style={styles.bodyCopy}>{copy.message}</Text>

      {result.location_name ? (
        <Text style={styles.resultDetail}>{result.location_name}</Text>
      ) : null}

      {result.status === "cooldown" &&
      result.weekly_goal !== null &&
      result.weekly_sessions !== null ? (
        <Text style={styles.resultDetail}>
          {result.weekly_sessions} / {result.weekly_goal} sessions this week
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={canRetry ? onResetAttempt : onDone}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {canRetry ? "Try again" : "Done"}
        </Text>
      </Pressable>

      {showResetToken ? (
        <Pressable
          accessibilityRole="button"
          onPress={onResetToken}
          style={({ pressed }) => [styles.textButton, pressed && styles.pressed]}
        >
          <Text style={styles.textButtonText}>Use another token</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#111113",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2c2931",
    marginHorizontal: 20,
  },
  wordmark: {
    color: "#ffffff",
    fontFamily: fonts.extraBold,
    fontSize: 24,
    letterSpacing: -1.5,
  },
  wordmarkAccent: {
    color: "#9b7af2",
  },
  backText: {
    color: "#aaa6b2",
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  successContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  mainState: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  eyebrow: {
    color: "#9b7af2",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#ffffff",
    fontFamily: fonts.display,
    fontSize: 37,
    letterSpacing: -2.1,
    lineHeight: 41,
  },
  locationName: {
    marginTop: 10,
    color: "#ffffff",
    fontFamily: fonts.display,
    fontSize: 42,
    letterSpacing: -2.5,
    lineHeight: 46,
  },
  bodyCopy: {
    maxWidth: 380,
    marginTop: 17,
    color: "#aaa6b2",
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
  },
  field: {
    gap: 8,
    marginTop: 32,
  },
  fieldLabel: {
    color: "#d2ced8",
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#3b3742",
    borderRadius: 10,
    backgroundColor: "#1b191e",
    paddingHorizontal: 14,
    color: "#ffffff",
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  inlineIssue: {
    marginTop: 14,
    borderLeftWidth: 2,
    borderLeftColor: "#d26857",
    paddingLeft: 12,
  },
  previewSection: {
    marginTop: 38,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#343039",
    paddingTop: 24,
  },
  previewLabel: {
    color: "#9b7af2",
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  previewCopy: {
    marginTop: 8,
    color: "#85818d",
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  previewActions: {
    gap: 9,
    marginTop: 16,
  },
  previewButton: {
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#494353",
    borderRadius: 9,
    paddingHorizontal: 14,
  },
  previewButtonText: {
    color: "#d6d1de",
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  issueText: {
    color: "#d7a49b",
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
    borderRadius: 11,
    backgroundColor: "#7b52e8",
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: fonts.bold,
    fontSize: 15,
  },
  checkinButton: {
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    borderRadius: 12,
    backgroundColor: "#7b52e8",
    paddingHorizontal: 20,
  },
  checkinButtonText: {
    color: "#ffffff",
    fontFamily: fonts.extraBold,
    fontSize: 16,
    letterSpacing: 0.8,
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#4a4455",
    borderRadius: 11,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    color: "#d6d1de",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  textButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  textButtonText: {
    color: "#aaa6b2",
    fontFamily: fonts.semibold,
    fontSize: 13,
  },
  resultDetail: {
    marginTop: 16,
    color: "#d6d1de",
    fontFamily: fonts.semibold,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.42,
  },
  pressed: {
    opacity: 0.7,
  },
});
