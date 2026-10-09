import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  getAuthoritativeSetupPath,
  isDevelopmentOnboardingPreviewPath,
  SIGNED_OUT_LANDING_PATH,
} from "../mobile/src/domain/onboarding-routing";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const rootLayout = source("../mobile/src/app/_layout.tsx");
const appLayout = source("../mobile/src/app/(app)/_layout.tsx");
const welcomeRoute = source("../mobile/src/app/welcome.tsx");
const createAccountRoute = source("../mobile/src/app/create-account.tsx");
const previewRoute = source("../mobile/src/app/(app)/dev-onboarding.tsx");
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const createAccountChoice = source(
  "../mobile/src/features/onboarding/CreateAccountChoice.tsx",
);
const profileScreen = source("../mobile/src/features/profile/ProfileScreen.tsx");
const publicCheckinRoute = source("../mobile/src/app/checkin/[token].tsx");
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

describe("native onboarding M1 route contract", () => {
  it("uses Welcome as the signed-out landing without changing auth readiness", () => {
    assert.equal(SIGNED_OUT_LANDING_PATH, "/welcome");
    assert.ok(
      rootLayout.indexOf('<Stack.Screen name="welcome" />') <
        rootLayout.indexOf('<Stack.Screen name="sign-in" />'),
    );
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && isOnboardingComplete\}/,
    );
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && !isOnboardingComplete\}/,
    );
  });

  it("keeps authoritative incomplete-account routing unchanged", () => {
    assert.equal(
      getAuthoritativeSetupPath("identity-incomplete"),
      "/onboarding/profile",
    );
    assert.equal(
      getAuthoritativeSetupPath("weekly-goal-required"),
      "/onboarding/weekly-goal",
    );
    assert.equal(getAuthoritativeSetupPath("complete"), null);
    assert.match(rootLayout, /getAuthoritativeSetupPath\(readiness\)/);
  });

  it("routes Welcome into the final account form and preserves Sign In", () => {
    assert.match(welcomeRoute, /router\.push\("\/create-account"\)/);
    assert.match(welcomeRoute, /router\.push\("\/sign-in"\)/);
    assert.match(createAccountRoute, /SignUpScreen as default/);
    assert.match(createAccountChoice, /Create your account/);
    assert.match(createAccountChoice, /accessibilityLabel="Email"/);
    assert.match(createAccountChoice, /accessibilityLabel="Password"/);
    assert.match(createAccountChoice, /Already have an account\?/);
    assert.doesNotMatch(createAccountChoice, /signInWithOAuth|auth\.signUp/);
  });

  it("retains public check-in priority", () => {
    assert.match(rootLayout, /<Stack\.Screen name="checkin\/\[token\]" \/>/);
    assert.match(publicCheckinRoute, /persistPendingToken/);
  });

  it("does not change pending-token storage or automatic check-in guarantees", () => {
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.match(pendingProvider, /acknowledgePendingToken/);
    assert.doesNotMatch(publicCheckinRoute, /perform_checkin/);
  });
});

describe("development onboarding preview safety", () => {
  it("is double guarded from production", () => {
    assert.equal(
      isDevelopmentOnboardingPreviewPath("/dev-onboarding", true),
      true,
    );
    assert.equal(
      isDevelopmentOnboardingPreviewPath("/dev-onboarding", false),
      false,
    );
    assert.match(previewRoute, /if \(!__DEV__\) return <Redirect/);
    assert.match(appLayout, /<Stack\.Screen name="dev-onboarding" \/>/);
    assert.match(
      profileScreen,
      /\{__DEV__ \? \([\s\S]*router\.push\("\/dev-onboarding"\)/,
    );
  });

  it("pauses pending continuation without reading or mutating pending state", () => {
    assert.match(
      rootLayout,
      /isDevelopmentOnboardingPreview \|\|[\s\S]*pathname\.startsWith\("\/checkin\/"\)/,
    );
    assert.doesNotMatch(
      previewRoute + previewFlow,
      /usePendingCheckin|persistPendingToken|acknowledgePendingToken|AsyncStorage/,
    );
  });

  it("contains no auth or backend mutation boundary", () => {
    assert.doesNotMatch(
      previewRoute + previewFlow,
      /supabase|auth\.signUp|set_my_avatar|update_my_profile|configure_weekly_goal|useOnboarding|refreshOnboarding/,
    );
  });

  it("is navigable through every memory-only preview step and exits Home", () => {
    assert.match(previewFlow, /setStep\("create-account"\)/);
    assert.match(previewFlow, /setStep\("avatar"\)/);
    assert.match(previewFlow, /setStep\("identity"\)/);
    assert.match(previewFlow, /setStep\("weekly-goal"\)/);
    assert.match(previewFlow, /setStep\("complete"\)/);
    assert.match(previewRoute, /router\.replace\("\/"\)/);
  });
});
