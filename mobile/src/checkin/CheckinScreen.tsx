import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

type CheckinContextRow = {
  status: "valid" | "invalid_tag";
  location_name: string | null;
  requires_location_verification: boolean;
};

type CheckinStatus =
  | "success"
  | "cooldown"
  | "invalid_tag"
  | "location_required"
  | "invalid_location"
  | "location_too_inaccurate"
  | "outside_geofence";

type CheckinRow = {
  status: CheckinStatus;
  checkin_id: string | null;
  location_id: string | null;
  location_name: string | null;
  points_awarded: number;
  total_points: number | null;
  checked_in_at: string | null;
  next_eligible_at: string | null;
  weekly_goal: number | null;
  weekly_sessions: number | null;
  weekly_bonus_points: number;
  weekly_goal_completed: boolean;
  total_points_earned: number;
};

type CheckinScreenProps = {
  onBack: () => void;
  onSuccessfulCheckin: () => void;
};

const checkinStatuses = new Set<CheckinStatus>([
  "success",
  "cooldown",
  "invalid_tag",
  "location_required",
  "invalid_location",
  "location_too_inaccurate",
  "outside_geofence",
]);

function firstRow(data: unknown) {
  return Array.isArray(data) ? data[0] : data;
}

function isCheckinContextRow(value: unknown): value is CheckinContextRow {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return (
    (row.status === "valid" || row.status === "invalid_tag") &&
    (typeof row.location_name === "string" || row.location_name === null) &&
    typeof row.requires_location_verification === "boolean"
  );
}

function isCheckinRow(value: unknown): value is CheckinRow {
  if (!value || typeof value !== "object") return false;

  const status = (value as Record<string, unknown>).status;
  return typeof status === "string" && checkinStatuses.has(status as CheckinStatus);
}

function formatTimestamp(value: string | null) {
  if (!value) return "the time shown by the venue";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resultCopy(result: CheckinRow) {
  switch (result.status) {
    case "cooldown":
      return {
        title: "Check-in not available yet",
        message: `The backend reports that this account is in cooldown. Next eligible: ${formatTimestamp(result.next_eligible_at)}.`,
      };
    case "invalid_tag":
      return {
        title: "Invalid or disabled token",
        message: "The backend no longer recognizes this TapIt token as active.",
      };
    case "location_required":
      return {
        title: "Location is required",
        message: "The backend requires a usable location for this fitness location.",
      };
    case "invalid_location":
      return {
        title: "Location could not be validated",
        message: "The backend rejected the location values supplied by the device.",
      };
    case "location_too_inaccurate":
      return {
        title: "Location is not accurate enough",
        message: "The backend could not verify this check-in with the current GPS fix.",
      };
    case "outside_geofence":
      return {
        title: "Not at the selected location",
        message: "The backend reports that the device is outside this location’s permitted check-in area.",
      };
    case "success":
      return {
        title: "Check-in successful",
        message: "The production backend accepted and rewarded this check-in.",
      };
  }
}

export function CheckinScreen({
  onBack,
  onSuccessfulCheckin,
}: CheckinScreenProps) {
  const [tokenInput, setTokenInput] = useState("");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [context, setContext] = useState<CheckinContextRow | null>(null);
  const [contextError, setContextError] = useState("");
  const [clientError, setClientError] = useState("");
  const [backendError, setBackendError] = useState("");
  const [result, setResult] = useState<CheckinRow | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  if (!__DEV__) return null;

  function resetToken() {
    if (submissionInFlight.current) return;

    setSelectedToken(null);
    setContext(null);
    setContextError("");
    setClientError("");
    setBackendError("");
    setResult(null);
  }

  async function resolveToken() {
    const token = tokenInput.trim();

    setContextError("");
    setClientError("");
    setBackendError("");
    setResult(null);

    if (!token || token.length > 256) {
      setContextError("Enter a TapIt token between 1 and 256 characters.");
      return;
    }

    setIsResolving(true);

    try {
      const { data, error } = await supabase.rpc("get_checkin_context", {
        p_token: token,
      });

      const resolvedContext = firstRow(data);

      if (error) {
        console.error("[mobile check-in] get_checkin_context failed", error);
        setContextError("The check-in location could not be loaded. Try again.");
      } else if (!isCheckinContextRow(resolvedContext)) {
        setContextError("The backend returned an unexpected check-in context.");
      } else if (resolvedContext.status === "invalid_tag") {
        setContextError("This TapIt token is invalid or disabled.");
      } else {
        setSelectedToken(token);
        setContext(resolvedContext);
      }
    } catch (error) {
      console.error("[mobile check-in] get_checkin_context unavailable", error);
      setContextError("The check-in location could not be loaded. Try again.");
    } finally {
      setIsResolving(false);
    }
  }

  async function acquireRequiredLocation() {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setClientError(
          permission.canAskAgain
            ? "Location permission was denied. Tap CHECK IN to request it again."
            : "Location permission is disabled for Expo Go. Enable it in Android settings and try again.",
        );
        return null;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setClientError("Location services are unavailable or disabled on this device.");
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      const { accuracy, latitude, longitude } = position.coords;

      if (
        typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setClientError(
          "The device did not provide a usable location and accuracy value. Try again outdoors or near a window.",
        );
        return null;
      }

      return { accuracy, latitude, longitude };
    } catch (error) {
      console.error("[mobile check-in] current location unavailable", error);
      setClientError(
        "A fresh location could not be obtained. Check location services and try again.",
      );
      return null;
    }
  }

  async function performCheckin() {
    if (
      submissionInFlight.current ||
      isSubmitting ||
      !selectedToken ||
      !context
    ) {
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setClientError("");
    setBackendError("");
    setResult(null);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracy: number | null = null;

      if (context.requires_location_verification) {
        const location = await acquireRequiredLocation();

        if (!location) return;

        latitude = location.latitude;
        longitude = location.longitude;
        accuracy = location.accuracy;
      }

      const { data, error } = await supabase.rpc("perform_checkin", {
        p_token: selectedToken,
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy_meters: accuracy,
      });

      if (error) {
        console.error("[mobile check-in] perform_checkin failed", error);
        setBackendError(
          "The production check-in backend returned an error. Try again.",
        );
        return;
      }

      const checkinResult = firstRow(data);
      if (!isCheckinRow(checkinResult)) {
        setBackendError("The backend returned an unexpected check-in response.");
        return;
      }

      setResult(checkinResult);

      if (checkinResult.status === "success") {
        onSuccessfulCheckin();
      }
    } catch (error) {
      console.error("[mobile check-in] perform_checkin unavailable", error);
      setBackendError("The production check-in backend is unavailable. Try again.");
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  const copy = result ? resultCopy(result) : null;

  return (
    <ScrollView
      contentContainerStyle={styles.screen}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Development only</Text>
        <Text style={styles.title}>Test native check-in</Text>

        {!context || !selectedToken ? (
          <>
            <Text style={styles.copy}>
              Enter the token portion of a real TapIt NFC URL. This field is not
              available in production builds.
            </Text>
            <Text style={styles.label}>NFC token</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isResolving}
              onChangeText={setTokenInput}
              onSubmitEditing={() => void resolveToken()}
              placeholder="Paste token"
              style={styles.input}
              value={tokenInput}
            />
            {contextError ? <Text style={styles.error}>{contextError}</Text> : null}
            <Pressable
              disabled={isResolving || !tokenInput.trim()}
              onPress={() => void resolveToken()}
              style={({ pressed }) => [
                styles.primaryButton,
                (isResolving || !tokenInput.trim()) && styles.disabled,
                pressed && styles.pressed,
              ]}
            >
              {isResolving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Resolve token</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.locationBlock}>
              <Text style={styles.label}>Fitness location</Text>
              <Text style={styles.locationName}>
                {context.location_name ?? "TapIt location"}
              </Text>
              <Text style={styles.copy}>
                {context.requires_location_verification
                  ? "This location requires GPS verification. Permission will be requested only after CHECK IN is pressed."
                  : "This location does not require GPS verification."}
              </Text>
            </View>

            {result && copy ? (
              <View style={styles.resultBlock}>
                <Text style={styles.resultTitle}>{copy.title}</Text>
                <Text style={styles.copy}>{copy.message}</Text>

                {result.status === "success" ? (
                  <>
                    <Text style={styles.metric}>
                      +{result.total_points_earned} points earned
                    </Text>
                    <Text style={styles.copy}>
                      Check-in points: {result.points_awarded}
                    </Text>
                    <Text style={styles.copy}>
                      Weekly bonus: {result.weekly_bonus_points}
                    </Text>
                    <Text style={styles.metric}>
                      Updated total: {result.total_points ?? "Unavailable"}
                    </Text>
                  </>
                ) : null}

                {result.weekly_goal !== null &&
                result.weekly_sessions !== null ? (
                  <Text style={styles.copy}>
                    Weekly progress: {result.weekly_sessions} / {result.weekly_goal}
                  </Text>
                ) : null}

                <Pressable
                  onPress={() => setResult(null)}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>Check in again</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {clientError ? <Text style={styles.error}>{clientError}</Text> : null}
                {backendError ? <Text style={styles.error}>{backendError}</Text> : null}
                <Pressable
                  disabled={isSubmitting}
                  onPress={() => void performCheckin()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    isSubmitting && styles.disabled,
                    pressed && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>CHECK IN</Text>
                  )}
                </Pressable>
              </>
            )}

            <Pressable
              disabled={isSubmitting}
              onPress={resetToken}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Use another token</Text>
            </Pressable>
          </>
        )}

        <Pressable
          disabled={isSubmitting}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backButtonText}>Back to profile</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#f4f4f0",
    padding: 24,
  },
  card: {
    gap: 14,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 24,
  },
  eyebrow: {
    color: "#786000",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: "#171717",
    fontSize: 28,
    fontWeight: "700",
  },
  copy: {
    color: "#5f6360",
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    color: "#272a28",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#c9ceca",
    borderRadius: 10,
    paddingHorizontal: 14,
    color: "#171717",
    fontSize: 16,
  },
  locationBlock: {
    gap: 8,
    borderRadius: 12,
    backgroundColor: "#f3f6f4",
    padding: 16,
  },
  locationName: {
    color: "#171717",
    fontSize: 22,
    fontWeight: "700",
  },
  resultBlock: {
    gap: 9,
    borderRadius: 12,
    backgroundColor: "#f3f6f4",
    padding: 16,
  },
  resultTitle: {
    color: "#171717",
    fontSize: 20,
    fontWeight: "700",
  },
  metric: {
    color: "#155e3b",
    fontSize: 18,
    fontWeight: "700",
  },
  error: {
    color: "#a32121",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#155e3b",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#155e3b",
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: "#155e3b",
    fontSize: 15,
    fontWeight: "700",
  },
  backButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#5f6360",
    fontSize: 15,
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.75,
  },
});
