import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  calculateWeeklyGoalStreaks,
  type WeeklyGoalSchedule,
} from "../domain/weekly-goals";
import { supabase } from "../lib/supabase";
import { triggerTapHaptic } from "../motion/haptics";
import { useRewardEvents } from "../motion/RewardEventProvider";
import {
  firstRow,
  isCheckinContextRow,
  isCheckinRow,
  isValidCheckinToken,
  type CheckinContextRow,
  type CheckinRow,
} from "./checkin-contract";

type ClientIssue = {
  canOpenSettings: boolean;
  message: string;
  title: string;
};

type CheckinTimestampRow = {
  created_at: string;
};

type GoalScheduleRow = {
  effective_week: string;
  goal_sessions: number;
};

type UseCheckinFlowOptions = {
  fixedToken?: string;
};

export function useCheckinFlow(
  userId: string,
  { fixedToken }: UseCheckinFlowOptions = {},
) {
  const { publishRewardEvent } = useRewardEvents();
  const [tokenInput, setTokenInput] = useState(fixedToken ?? "");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [context, setContext] = useState<CheckinContextRow | null>(null);
  const [contextError, setContextError] = useState("");
  const [clientIssue, setClientIssue] = useState<ClientIssue | null>(null);
  const [backendError, setBackendError] = useState("");
  const [result, setResult] = useState<CheckinRow | null>(null);
  const [successStreak, setSuccessStreak] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(Boolean(fixedToken));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState("");
  const submissionInFlight = useRef(false);
  const submissionRequestId = useRef(0);
  const contextRequestId = useRef(0);
  const streakRequestId = useRef(0);
  const feedbackKey = useRef<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      contextRequestId.current += 1;
      submissionRequestId.current += 1;
      streakRequestId.current += 1;
    };
  }, []);

  const loadSuccessStreak = useCallback(
    async (requestKey: string) => {
      const currentRequest = ++streakRequestId.current;

      try {
        const [checkinsResult, schedulesResult] = await Promise.all([
          supabase
            .from("checkins")
            .select("created_at")
            .eq("user_id", userId)
            .gt("points_awarded", 0)
            .order("created_at", { ascending: false }),
          supabase
            .from("weekly_goal_schedules")
            .select("effective_week, goal_sessions")
            .eq("user_id", userId)
            .order("effective_week", { ascending: true }),
        ]);

        if (checkinsResult.error || schedulesResult.error) {
          throw checkinsResult.error ?? schedulesResult.error;
        }

        const timestamps = ((checkinsResult.data ?? []) as CheckinTimestampRow[])
          .map((checkin) => checkin.created_at);
        const schedules: WeeklyGoalSchedule[] = (
          (schedulesResult.data ?? []) as GoalScheduleRow[]
        ).map((schedule) => ({
          effectiveWeek: schedule.effective_week,
          goalSessions: schedule.goal_sessions,
        }));

        if (
          currentRequest === streakRequestId.current &&
          feedbackKey.current === requestKey
        ) {
          setSuccessStreak(
            calculateWeeklyGoalStreaks(timestamps, schedules).currentStreak,
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.error("[mobile check-in] streak refresh failed", error);
        }
      }
    },
    [userId],
  );

  const resetAttempt = useCallback(() => {
    if (submissionInFlight.current) return;

    setClientIssue(null);
    setBackendError("");
    setResult(null);
  }, []);

  const resetToken = useCallback(() => {
    if (submissionInFlight.current) return;

    contextRequestId.current += 1;
    submissionRequestId.current += 1;
    streakRequestId.current += 1;
    submissionInFlight.current = false;
    feedbackKey.current = null;
    setSelectedToken(null);
    setContext(null);
    setContextError("");
    setClientIssue(null);
    setBackendError("");
    setResult(null);
    setSuccessStreak(null);
    setIsResolving(false);
    setIsSubmitting(false);
    setVerificationMessage("");
  }, []);

  const resolveTokenValue = useCallback(async (token: string) => {
    const currentRequest = ++contextRequestId.current;

    submissionRequestId.current += 1;
    submissionInFlight.current = false;

    setSelectedToken(null);
    setContext(null);
    setContextError("");
    setClientIssue(null);
    setBackendError("");
    setResult(null);
    setSuccessStreak(null);
    setIsSubmitting(false);
    setVerificationMessage("");

    if (!isValidCheckinToken(token)) {
      setIsResolving(false);
      setContextError(
        "Enter a TapIt token with exactly 64 lowercase hexadecimal characters.",
      );
      return;
    }

    setIsResolving(true);

    try {
      const { data, error } = await supabase.rpc("get_checkin_context", {
        p_token: token,
      });
      const resolvedContext = firstRow(data);

      if (
        !isMounted.current ||
        currentRequest !== contextRequestId.current
      ) {
        return;
      }

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
      if (
        isMounted.current &&
        currentRequest === contextRequestId.current
      ) {
        setContextError("The check-in location could not be loaded. Try again.");
      }
    } finally {
      if (
        isMounted.current &&
        currentRequest === contextRequestId.current
      ) {
        setIsResolving(false);
      }
    }
  }, []);

  const resolveToken = useCallback(
    () => resolveTokenValue(tokenInput.trim()),
    [resolveTokenValue, tokenInput],
  );

  useEffect(() => {
    if (fixedToken === undefined) return;

    let isActive = true;

    void Promise.resolve().then(() => {
      if (isActive) return resolveTokenValue(fixedToken);
    });

    return () => {
      isActive = false;
    };
  }, [fixedToken, resolveTokenValue]);

  const acquireRequiredLocation = useCallback(async (isCurrent: () => boolean) => {
    try {
      if (!isCurrent()) return null;
      setVerificationMessage("Requesting location…");
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isCurrent()) return null;

      if (!permission.granted) {
        setClientIssue({
          canOpenSettings: !permission.canAskAgain,
          title: "Location access is required here.",
          message: permission.canAskAgain
            ? "Location permission was denied. Try again when you’re ready to allow it."
            : "Location permission is disabled for TapIt. Enable it in your phone settings and try again.",
        });
        return null;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!isCurrent()) return null;

      if (!servicesEnabled) {
        setClientIssue({
          canOpenSettings: false,
          title: "Location services are unavailable.",
          message: "Turn on location services on your phone, then try again.",
        });
        return null;
      }

      setVerificationMessage("Finding your location…");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      });
      if (!isCurrent()) return null;

      const { accuracy, latitude, longitude } = position.coords;

      if (
        typeof accuracy !== "number" ||
        !Number.isFinite(accuracy) ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        setClientIssue({
          canOpenSettings: false,
          title: "Your location couldn’t be used.",
          message:
            "The device did not provide a usable location and accuracy. Move near a window and try again.",
        });
        return null;
      }

      return { accuracy, latitude, longitude };
    } catch (error) {
      console.error("[mobile check-in] current location unavailable", error);
      if (!isCurrent()) return null;
      setClientIssue({
        canOpenSettings: false,
        title: "Your location is unavailable.",
        message:
          "A fresh location could not be obtained. Check location services and try again.",
      });
      return null;
    }
  }, []);

  const performCheckin = useCallback(async () => {
    if (
      submissionInFlight.current ||
      isSubmitting ||
      !selectedToken ||
      !context ||
      !isValidCheckinToken(selectedToken)
    ) {
      return;
    }

    const currentSubmission = ++submissionRequestId.current;
    const isCurrentSubmission = () =>
      isMounted.current &&
      currentSubmission === submissionRequestId.current;

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setClientIssue(null);
    setBackendError("");
    setResult(null);
    setSuccessStreak(null);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;
      let accuracy: number | null = null;

      if (context.requires_location_verification) {
        const location = await acquireRequiredLocation(isCurrentSubmission);
        if (!location) return;

        latitude = location.latitude;
        longitude = location.longitude;
        accuracy = location.accuracy;
      }

      if (!isCurrentSubmission()) return;

      setVerificationMessage("Checking your tap…");
      const { data, error } = await supabase.rpc("perform_checkin", {
        p_token: selectedToken,
        p_latitude: latitude,
        p_longitude: longitude,
        p_accuracy_meters: accuracy,
      });

      if (!isCurrentSubmission()) return;

      if (error) {
        console.error("[mobile check-in] perform_checkin failed", error);
        setBackendError("The check-in service returned an error. Try again.");
        return;
      }

      const checkinResult = firstRow(data);
      if (!isCheckinRow(checkinResult)) {
        setBackendError("The backend returned an unexpected check-in response.");
        return;
      }

      setResult(checkinResult);

      if (checkinResult.status === "success") {
        const committedKey =
          checkinResult.checkin_id ??
          checkinResult.checked_in_at ??
          `${checkinResult.total_points}-${checkinResult.total_points_earned}`;

        if (feedbackKey.current !== committedKey) {
          feedbackKey.current = committedKey;
          if (
            checkinResult.checkin_id &&
            checkinResult.total_points !== null
          ) {
            publishRewardEvent({
              checkinId: checkinResult.checkin_id,
              finalTotalPoints: checkinResult.total_points,
              finalWeeklySessions: checkinResult.weekly_sessions,
              previousTotalPoints:
                checkinResult.total_points -
                checkinResult.total_points_earned,
              previousWeeklySessions:
                checkinResult.weekly_sessions === null
                  ? null
                  : checkinResult.weekly_sessions - 1,
              userId,
              weeklyGoal: checkinResult.weekly_goal,
              weeklyGoalCompleted: checkinResult.weekly_goal_completed,
            });
          }
          triggerTapHaptic("success");
          void loadSuccessStreak(committedKey);
        }
      }
    } catch (error) {
      console.error("[mobile check-in] perform_checkin unavailable", error);
      if (isCurrentSubmission()) {
        setBackendError("The check-in service is unavailable. Try again.");
      }
    } finally {
      if (currentSubmission === submissionRequestId.current) {
        submissionInFlight.current = false;
      }

      if (isCurrentSubmission()) {
        setIsSubmitting(false);
        setVerificationMessage("");
      }
    }
  }, [
    acquireRequiredLocation,
    context,
    isSubmitting,
    loadSuccessStreak,
    publishRewardEvent,
    selectedToken,
    userId,
  ]);

  return {
    backendError,
    clientIssue,
    context,
    contextError,
    isResolving,
    isSubmitting,
    performCheckin,
    resetAttempt,
    resetToken,
    resolveToken,
    result,
    selectedToken,
    setTokenInput,
    successStreak,
    tokenInput,
    verificationMessage,
  };
}
