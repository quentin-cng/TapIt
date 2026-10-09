import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  isJwtIssuedAtFutureError,
  READINESS_JWT_RETRY_DELAYS_MS,
} from "../mobile/src/onboarding/readiness-retry";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const signIn = source("../mobile/src/app/sign-in.tsx");
const provider = source("../mobile/src/onboarding/OnboardingProvider.tsx");
const rootLayout = source("../mobile/src/app/_layout.tsx");
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

describe("native Sign In auth polish", () => {
  it("preserves the existing Supabase password contract and normalized email", () => {
    assert.match(signIn, /supabase\.auth\.signInWithPassword\(/);
    assert.match(signIn, /email: email\.trim\(\)\.toLowerCase\(\)/);
    assert.match(signIn, /password,/);
  });

  it("retains account-creation navigation", () => {
    assert.match(signIn, /router\.push\("\/sign-up"\)/);
    assert.match(signIn, /New to TapIt\?/);
    assert.match(signIn, /Create account/);
  });

  it("guards duplicate submission and keeps auth failures visible", () => {
    assert.match(signIn, /if \(submissionInFlight\.current/);
    assert.match(signIn, /submissionInFlight\.current = true/);
    assert.match(signIn, /submissionInFlight\.current = false/);
    assert.match(signIn, /accessibilityRole="alert"/);
    assert.match(signIn, /Email or password is incorrect\./);
    assert.match(signIn, /We could not log you in\. Please try again\./);
  });

  it("uses the current onboarding visual and keyboard conventions", () => {
    assert.match(signIn, /Welcome back/);
    assert.match(signIn, /styles\.period/);
    assert.match(signIn, /fontFamily: fonts\.display/);
    assert.match(signIn, /color: v3Colors\.ink/);
    assert.match(signIn, /backgroundColor: "#fff8f1"/);
    assert.match(signIn, /automaticallyAdjustKeyboardInsets/);
    assert.match(signIn, /Keyboard\.dismiss\(\)/);
    assert.match(signIn, /TapPressable/);
  });

  it("does not couple Sign In to pending-token mutation", () => {
    assert.doesNotMatch(
      signIn,
      /PendingCheckin|pendingToken|persistPendingToken|acknowledgePendingToken/,
    );
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.match(
      rootLayout,
      /Boolean\(session\) && isOnboardingComplete/,
    );
  });
});

describe("JWT-issued-at-future readiness recovery", () => {
  it("matches only the exact PostgREST transient", () => {
    assert.equal(
      isJwtIssuedAtFutureError({
        code: "PGRST303",
        message: "JWT issued at future",
      }),
      true,
    );
    assert.equal(
      isJwtIssuedAtFutureError({
        code: "OTHER",
        message: "JWT issued at future",
      }),
      false,
    );
    assert.equal(
      isJwtIssuedAtFutureError({
        code: "PGRST303",
        message: "permission denied",
      }),
      false,
    );
    assert.equal(isJwtIssuedAtFutureError(null), false);
  });

  it("uses a strict finite retry budget", () => {
    assert.deepEqual(READINESS_JWT_RETRY_DELAYS_MS, [250, 750]);
    assert.equal(READINESS_JWT_RETRY_DELAYS_MS.length, 2);
    assert.match(
      provider,
      /for \(const delay of READINESS_JWT_RETRY_DELAYS_MS\)/,
    );
    assert.doesNotMatch(provider, /while\s*\(true\)/);
  });

  it("retries only whichever authoritative request has the exact transient", () => {
    assert.match(provider, /Promise\.all\(\[\s*loadProfile\(\),\s*loadGoal\(\)/);
    assert.match(
      provider,
      /retryProfile \? loadProfile\(\) : Promise\.resolve\(profileResult\)/,
    );
    assert.match(
      provider,
      /retryGoal \? loadGoal\(\) : Promise\.resolve\(goalResult\)/,
    );
    assert.match(provider, /if \(!retryProfile && !retryGoal\) break/);
  });

  it("surfaces persistent or unrelated failures through the existing error state", () => {
    assert.match(
      provider,
      /if \(profileResult\.error \|\| !profileResult\.data \|\| goalResult\.error\)/,
    );
    assert.match(provider, /setReadiness\("error"\)/);
    assert.match(
      provider,
      /We couldn’t load your account setup\. Please try again\./,
    );
  });

  it("cannot apply a stale result after a session change or retry delay", () => {
    const staleGuards = provider.match(
      /if \(currentRequest !== requestId\.current\) return;/g,
    );
    assert.ok(staleGuards && staleGuards.length >= 3);
    assert.match(
      provider,
      /await wait\(delay\);\s*if \(currentRequest !== requestId\.current\) return;/,
    );
  });

  it("preserves initial hydration and settled background-refresh behavior", () => {
    assert.match(provider, /setReadiness\(beginReadinessLoad\)/);
    assert.match(
      provider,
      /isHydrating:\s*Boolean\(userId\)\s*&&\s*\(!hasCurrentResult \|\| readiness === "loading"\)/,
    );
    assert.match(
      provider,
      /function beginReadinessLoad[\s\S]*return current;[\s\S]*return "loading";/,
    );
  });
});
