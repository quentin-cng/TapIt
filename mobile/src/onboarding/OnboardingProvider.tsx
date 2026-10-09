import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "../auth/SessionProvider";
import { supabase } from "../lib/supabase";
import {
  isJwtIssuedAtFutureError,
  READINESS_JWT_RETRY_DELAYS_MS,
} from "./readiness-retry";

type OnboardingProfile = {
  avatar_selected_at: string | null;
  display_name: string | null;
  onboarding_completed_at: string | null;
  username: string;
};

export type OnboardingReadiness =
  | "signed-out"
  | "loading"
  | "error"
  | "avatar-required"
  | "identity-incomplete"
  | "weekly-goal-required"
  | "confirmation-required"
  | "complete";

type OnboardingContextValue = {
  error: string;
  isComplete: boolean;
  isHydrating: boolean;
  profile: OnboardingProfile | null;
  readiness: OnboardingReadiness;
  refresh: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function getGeneratedFallbackUsername(userId: string) {
  return `user_${userId.replaceAll("-", "").slice(0, 12)}`;
}

function beginReadinessLoad(current: OnboardingReadiness) {
  if (
    current === "avatar-required" ||
    current === "identity-incomplete" ||
    current === "weekly-goal-required" ||
    current === "confirmation-required" ||
    current === "complete"
  ) {
    return current;
  }

  return "loading";
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { isRestoring, session } = useSession();
  const userId = session?.user.id ?? null;
  const [readiness, setReadiness] =
    useState<OnboardingReadiness>("signed-out");
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [error, setError] = useState("");
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    await Promise.resolve();

    if (!userId) {
      requestId.current += 1;
      setReadiness("signed-out");
      setProfile(null);
      setError("");
      setResolvedUserId(null);
      return;
    }

    const currentRequest = ++requestId.current;
    setReadiness(beginReadinessLoad);
    setError("");

    const loadProfile = () => supabase.rpc("get_my_profile").single();
    const loadGoal = () =>
      supabase
        .from("weekly_goal_schedules")
        .select("effective_week")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    let [profileResult, goalResult] = await Promise.all([
      loadProfile(),
      loadGoal(),
    ]);

    for (const delay of READINESS_JWT_RETRY_DELAYS_MS) {
      if (currentRequest !== requestId.current) return;

      const retryProfile = isJwtIssuedAtFutureError(profileResult.error);
      const retryGoal = isJwtIssuedAtFutureError(goalResult.error);

      if (!retryProfile && !retryGoal) break;

      await wait(delay);
      if (currentRequest !== requestId.current) return;

      [profileResult, goalResult] = await Promise.all([
        retryProfile ? loadProfile() : Promise.resolve(profileResult),
        retryGoal ? loadGoal() : Promise.resolve(goalResult),
      ]);
    }

    if (currentRequest !== requestId.current) return;

    if (profileResult.error || !profileResult.data || goalResult.error) {
      if (__DEV__) {
        console.error("[mobile onboarding] readiness load failed", {
          profileError: profileResult.error?.message,
          goalError: goalResult.error?.message,
        });
      }

      setProfile(null);
      setError("We couldn’t load your account setup. Please try again.");
      setReadiness("error");
      setResolvedUserId(userId);
      return;
    }

    const nextProfile = profileResult.data as OnboardingProfile;
    setProfile(nextProfile);
    setResolvedUserId(userId);

    if (!nextProfile.avatar_selected_at) {
      setReadiness("avatar-required");
      return;
    }

    if (nextProfile.username === getGeneratedFallbackUsername(userId)) {
      setReadiness("identity-incomplete");
      return;
    }

    if (!goalResult.data) {
      setReadiness("weekly-goal-required");
      return;
    }

    setReadiness(
      nextProfile.onboarding_completed_at
        ? "complete"
        : "confirmation-required",
    );
  }, [userId]);

  useEffect(() => {
    if (isRestoring) return;
    const loadTimer = setTimeout(() => void load(), 0);

    return () => {
      clearTimeout(loadTimer);
      requestId.current += 1;
    };
  }, [isRestoring, load]);

  const value = useMemo(
    () => {
      const hasCurrentResult = userId === resolvedUserId;

      return {
        error: hasCurrentResult ? error : "",
        isComplete: hasCurrentResult && readiness === "complete",
        isHydrating:
          Boolean(userId) &&
          (!hasCurrentResult || readiness === "loading"),
        profile: hasCurrentResult ? profile : null,
        readiness: hasCurrentResult ? readiness : "loading",
        refresh: load,
      };
    },
    [error, load, profile, readiness, resolvedUserId, userId],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);

  if (!value) {
    throw new Error("useOnboarding must be used inside OnboardingProvider.");
  }

  return value;
}
