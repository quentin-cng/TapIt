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

type OnboardingProfile = {
  display_name: string | null;
  username: string;
};

export type OnboardingReadiness =
  | "signed-out"
  | "loading"
  | "error"
  | "identity-incomplete"
  | "weekly-goal-required"
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
    setReadiness("loading");
    setError("");

    const [profileResult, goalResult] = await Promise.all([
      supabase.rpc("get_my_profile").single(),
      supabase
        .from("weekly_goal_schedules")
        .select("effective_week")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);

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

    if (goalResult.data) {
      setReadiness("complete");
      return;
    }

    setReadiness(
      nextProfile.username === getGeneratedFallbackUsername(userId)
        ? "identity-incomplete"
        : "weekly-goal-required",
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
