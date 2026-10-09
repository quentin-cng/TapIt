import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getAuthoritativeSetupPath } from "../mobile/src/domain/onboarding-routing";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const migration = source(
  "../supabase/migrations/20261008010000_onboarding_completion.sql",
);
const initialSchema = source(
  "../supabase/migrations/20260923000000_initial_schema.sql",
);
const provider = source("../mobile/src/onboarding/OnboardingProvider.tsx");
const completeRoute = source("../mobile/src/app/onboarding/complete.tsx");
const completeScreen = source(
  "../mobile/src/features/onboarding/CompleteOnboardingScreen.tsx",
);
const avatarScreen = source(
  "../mobile/src/features/onboarding/AvatarSetupScreen.tsx",
);
const identityScreen = source(
  "../mobile/src/features/onboarding/ProfileSetupScreen.tsx",
);
const weeklyGoalScreen = source(
  "../mobile/src/features/onboarding/WeeklyGoalSetupScreen.tsx",
);
const rootLayout = source("../mobile/src/app/_layout.tsx");
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

function functionSource(name: string, nextMarker: string) {
  const start = migration.indexOf(`create function public.${name}`);
  const end = migration.indexOf(nextMarker, start);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${name} must have a readable boundary`);
  return migration.slice(start, end);
}

describe("native onboarding M9 database completion contract", () => {
  it("adds a nullable no-default marker and backfills every existing profile", () => {
    assert.match(
      migration,
      /add column onboarding_completed_at timestamptz\s*;/,
    );
    assert.doesNotMatch(
      migration,
      /add column onboarding_completed_at[^;]*(?:not null|default)/i,
    );
    assert.match(
      migration,
      /update public\.profiles\s+set onboarding_completed_at = now\(\)\s+where onboarding_completed_at is null/,
    );
    assert.match(
      initialSchema,
      /insert into public\.profiles \(id, username\)\s+values/,
    );
  });

  it("keeps completion auth-scoped, hardened, and idempotent", () => {
    const completion = functionSource(
      "complete_my_onboarding",
      "drop function public.get_my_profile",
    );
    assert.match(completion, /returns timestamptz/);
    assert.match(completion, /security definer/);
    assert.match(completion, /set search_path = ''/);
    assert.match(completion, /v_current_user_id uuid := auth\.uid\(\)/);
    assert.match(completion, /if v_current_user_id is null/);
    assert.match(completion, /errcode = '42501'/);
    assert.match(
      completion,
      /if v_onboarding_completed_at is not null then\s+return v_onboarding_completed_at/,
    );
    assert.match(
      migration,
      /revoke all on function public\.complete_my_onboarding\(\)[\s\S]*from public, anon, authenticated/,
    );
    assert.match(
      migration,
      /grant execute on function public\.complete_my_onboarding\(\)[\s\S]*to authenticated/,
    );
  });

  it("refuses completion until avatar, identity, and weekly goal are authoritative", () => {
    const completion = functionSource(
      "complete_my_onboarding",
      "drop function public.get_my_profile",
    );
    const avatarCheck = completion.indexOf("v_avatar_selected_at is null");
    const identityCheck = completion.indexOf(
      "v_username = v_generated_username",
    );
    const goalCheck = completion.indexOf("if not v_has_weekly_goal");
    const update = completion.indexOf("set onboarding_completed_at = now()");
    assert.ok(avatarCheck >= 0 && avatarCheck < identityCheck);
    assert.ok(identityCheck < goalCheck);
    assert.ok(goalCheck < update);
    assert.match(completion, /'\^\[a-z0-9_\]\{3,30\}\$'/);
    assert.match(completion, /weekly_goal_schedules/);
  });

  it("sets only auth.uid completion and exposes it through get_my_profile", () => {
    const completion = functionSource(
      "complete_my_onboarding",
      "drop function public.get_my_profile",
    );
    assert.match(completion, /set onboarding_completed_at = now\(\)/);
    assert.match(completion, /where profile\.id = v_current_user_id/);
    assert.match(
      migration,
      /create function public\.get_my_profile\(\)[\s\S]*onboarding_completed_at timestamptz/,
    );
    assert.match(migration, /profile\.onboarding_completed_at/);
  });
});

describe("native onboarding M9 authoritative readiness", () => {
  it("orders Avatar, Identity, Weekly Goal, confirmation, then complete", () => {
    const avatarIndex = provider.indexOf("!nextProfile.avatar_selected_at");
    const identityIndex = provider.indexOf(
      "nextProfile.username === getGeneratedFallbackUsername(userId)",
    );
    const goalIndex = provider.indexOf("if (!goalResult.data)");
    const confirmationIndex = provider.indexOf(
      "nextProfile.onboarding_completed_at",
    );
    assert.ok(avatarIndex >= 0 && avatarIndex < identityIndex);
    assert.ok(identityIndex < goalIndex);
    assert.ok(goalIndex < confirmationIndex);
    assert.match(
      provider,
      /nextProfile\.onboarding_completed_at[\s\S]*"complete"[\s\S]*"confirmation-required"/,
    );
  });

  it("distinguishes initial hydration from settled background refreshes", () => {
    assert.match(
      provider,
      /function beginReadinessLoad[\s\S]*current === "avatar-required"[\s\S]*current === "identity-incomplete"[\s\S]*current === "weekly-goal-required"[\s\S]*current === "confirmation-required"[\s\S]*current === "complete"[\s\S]*return current;[\s\S]*return "loading";/,
    );
    assert.match(provider, /setReadiness\(beginReadinessLoad\)/);
    assert.doesNotMatch(provider, /setReadiness\("loading"\)/);
    assert.match(
      provider,
      /isHydrating:\s*Boolean\(userId\)\s*&&\s*\(!hasCurrentResult \|\| readiness === "loading"\)/,
    );
    assert.match(
      rootLayout,
      /isRestoring \|\| isHydrating \|\| isOnboardingHydrating/,
    );
  });

  it("keeps each successful setup step visible during its authoritative refresh", () => {
    for (const screen of [avatarScreen, identityScreen, weeklyGoalScreen]) {
      const refreshIndex = screen.indexOf("await refresh()");
      const rpcIndex = screen.indexOf("supabase.rpc(");
      assert.ok(rpcIndex >= 0 && rpcIndex < refreshIndex);
      assert.doesNotMatch(screen, /router\.(?:push|replace)/);
    }
  });

  it("advances only when the refreshed authoritative result changes readiness", () => {
    const requestStart = provider.indexOf("setReadiness(beginReadinessLoad)");
    const staleGuard = provider.indexOf(
      "if (currentRequest !== requestId.current) return",
    );
    const resultRouting = provider.indexOf(
      "if (!nextProfile.avatar_selected_at)",
    );
    assert.ok(requestStart >= 0 && requestStart < staleGuard);
    assert.ok(staleGuard < resultRouting);
    assert.match(
      rootLayout,
      /const destination = getAuthoritativeSetupPath\(readiness\)[\s\S]*router\.replace\(destination\)/,
    );
  });

  it("does not advance on refresh failure", () => {
    const failureIndex = provider.indexOf(
      "if (profileResult.error || !profileResult.data || goalResult.error)",
    );
    const errorIndex = provider.indexOf('setReadiness("error")', failureIndex);
    const resultIndex = provider.indexOf(
      "if (!nextProfile.avatar_selected_at)",
      failureIndex,
    );
    assert.ok(failureIndex >= 0 && failureIndex < errorIndex);
    assert.ok(errorIndex < resultIndex);
    assert.match(rootLayout, /session && onboardingError/);
  });

  it("routes confirmation to the protected production completion screen", () => {
    assert.equal(
      getAuthoritativeSetupPath("confirmation-required"),
      "/onboarding/complete",
    );
    assert.match(completeRoute, /CompleteOnboardingScreen as default/);
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && !isOnboardingComplete\}/,
    );
  });

  it("is restart-safe before and after acknowledgement", () => {
    assert.match(provider, /onboarding_completed_at: string \| null/);
    assert.match(provider, /setReadiness\([\s\S]*"confirmation-required"/);
    assert.match(provider, /hasCurrentResult && readiness === "complete"/);
    assert.doesNotMatch(provider, /AsyncStorage/);
  });
});

describe("native onboarding M9 final action", () => {
  it("calls only complete_my_onboarding and never navigates directly", () => {
    assert.match(completeScreen, /supabase\.rpc\(\s*"complete_my_onboarding"/);
    assert.doesNotMatch(completeScreen, /router\.(?:push|replace)|href=/);
    assert.doesNotMatch(completeScreen, /from\(["']profiles["']\)|\.update\(/);
  });

  it("guards duplicates, rejects failed results, and refreshes only after success", () => {
    assert.match(
      completeScreen,
      /if \(submissionInFlight\.current\) return/,
    );
    assert.match(completeScreen, /disabled=\{isSubmitting\}/);
    const rpcIndex = completeScreen.indexOf(
      'supabase.rpc(\n        "complete_my_onboarding"',
    );
    const failureIndex = completeScreen.indexOf(
      "if (rpcError || !isCompletionTimestamp(data))",
    );
    const refreshIndex = completeScreen.indexOf("await refresh()");
    assert.ok(rpcIndex >= 0 && rpcIndex < failureIndex);
    assert.ok(failureIndex < refreshIndex);
    assert.match(completeScreen, /Please try again\./);
  });

  it("holds pending NFC until completion and then reuses the existing coordinator", () => {
    assert.match(
      rootLayout,
      /Boolean\(session\) && isOnboardingComplete/,
    );
    assert.match(
      rootLayout,
      /router\.replace\(`\/checkin\/\$\{pendingToken\}`\)/,
    );
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.doesNotMatch(
      completeScreen,
      /persistPendingToken|acknowledgePendingToken|perform_checkin/,
    );
  });

  it("keeps the DEV preview final action local and mutation-free", () => {
    assert.match(previewFlow, /onPress=\{onExit\}/);
    assert.doesNotMatch(
      previewFlow,
      /complete_my_onboarding|onboarding_completed_at|useOnboarding/,
    );
  });
});
