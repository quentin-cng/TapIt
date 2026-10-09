import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { getAuthoritativeSetupPath } from "../mobile/src/domain/onboarding-routing";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const profileRoute = source("../mobile/src/app/onboarding/profile.tsx");
const identityScreen = source(
  "../mobile/src/features/onboarding/ProfileSetupScreen.tsx",
);
const identityContract = source(
  "../mobile/src/domain/profile-identity.ts",
);
const onboardingProvider = source(
  "../mobile/src/onboarding/OnboardingProvider.tsx",
);
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

describe("native onboarding M7 authoritative Identity", () => {
  it("keeps Avatar before Identity and routes Identity to the existing profile route", () => {
    assert.equal(
      getAuthoritativeSetupPath("avatar-required"),
      "/onboarding/avatar",
    );
    assert.equal(
      getAuthoritativeSetupPath("identity-incomplete"),
      "/onboarding/profile",
    );
    assert.equal(
      getAuthoritativeSetupPath("weekly-goal-required"),
      "/onboarding/weekly-goal",
    );
    assert.match(profileRoute, /ProfileSetupScreen as default/);

    const avatarIndex = onboardingProvider.indexOf(
      "!nextProfile.avatar_selected_at",
    );
    const identityIndex = onboardingProvider.indexOf(
      "nextProfile.username === getGeneratedFallbackUsername(userId)",
    );
    const weeklyGoalIndex = onboardingProvider.indexOf("if (!goalResult.data)");
    assert.ok(avatarIndex >= 0 && avatarIndex < identityIndex);
    assert.ok(identityIndex < weeklyGoalIndex);
  });

  it("submits normalized values through update_my_profile without direct table writes", () => {
    assert.match(identityScreen, /normalizeDisplayName\(displayName\)/);
    assert.match(identityScreen, /normalizeUsername\(username\)/);
    assert.match(
      identityScreen,
      /supabase\.rpc\("update_my_profile", \{\s*p_display_name: normalizedDisplayName,\s*p_username: normalizedUsername/,
    );
    assert.doesNotMatch(
      identityScreen,
      /from\(["']profiles["']\)|\.insert\(|\.update\(/,
    );
  });

  it("uses the shared identity normalization and validation contract", () => {
    assert.match(identityContract, /return value\.trim\(\)/);
    assert.match(identityContract, /value\.trim\(\)\.toLowerCase\(\)/);
    assert.match(identityContract, /\^\[a-z0-9_\]\{3,30\}\$/);
    assert.match(identityScreen, /isValidDisplayName\(normalizedDisplayName\)/);
    assert.match(identityScreen, /isValidUsername\(normalizedUsername\)/);
  });

  it("keeps conflicts and generic failures on Identity with entered values intact", () => {
    assert.match(identityScreen, /error\.code === "23505"/);
    assert.match(identityScreen, /That username is already taken\./);
    assert.match(
      identityScreen,
      /We couldn’t save your profile\. Please try again\./,
    );
    assert.doesNotMatch(identityScreen, /setDisplayName\(""\)/);
    assert.doesNotMatch(identityScreen, /setUsername\(""\)/);
  });

  it("guards duplicate submission and refreshes only after successful persistence", () => {
    assert.match(
      identityScreen,
      /if \(submissionInFlight\.current\) return/,
    );
    assert.match(identityScreen, /disabled=\{isSubmitting\}/);

    const rpcIndex = identityScreen.indexOf(
      'supabase.rpc("update_my_profile"',
    );
    const errorIndex = identityScreen.indexOf("if (error)");
    const refreshIndex = identityScreen.indexOf("await refresh()");
    assert.ok(rpcIndex >= 0 && rpcIndex < errorIndex);
    assert.ok(errorIndex < refreshIndex);
    assert.doesNotMatch(identityScreen, /router\.(?:push|replace)/);
  });

  it("remains backend-authoritative across restarts and never routes Identity to Home", () => {
    assert.match(onboardingProvider, /setReadiness\("identity-incomplete"\)/);
    assert.match(
      onboardingProvider,
      /if \(!goalResult\.data\)[\s\S]*setReadiness\("weekly-goal-required"\)/,
    );
    assert.doesNotMatch(identityScreen, /AsyncStorage|onboarding.*complete/i);
    assert.doesNotMatch(identityScreen, /router|["']\/["']/);
  });

  it("keeps pending NFC untouched and preview Identity mutation-free", () => {
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.doesNotMatch(
      identityScreen,
      /persistPendingToken|acknowledgePendingToken|perform_checkin/,
    );
    assert.match(previewFlow, /onChangeText=\{setDisplayName\}/);
    assert.match(previewFlow, /onChangeText=\{setUsername\}/);
    assert.doesNotMatch(
      previewFlow,
      /update_my_profile|from\(["']profiles["']\)|useOnboarding/,
    );
  });
});

describe("native onboarding M7 mobile input behavior", () => {
  it("keeps both inputs and Continue usable with the keyboard open", () => {
    assert.match(identityScreen, /<KeyboardAvoidingView/);
    assert.match(identityScreen, /<ScrollView/);
    assert.match(identityScreen, /keyboardShouldPersistTaps="handled"/);
    assert.match(identityScreen, /returnKeyType="next"/);
    assert.match(
      identityScreen,
      /onSubmitEditing=\{\(\) => usernameInput\.current\?\.focus\(\)\}/,
    );
    assert.match(identityScreen, /returnKeyType="done"/);
    assert.match(identityScreen, /Keyboard\.dismiss\(\)/);
  });

  it("uses the approved production hierarchy without an extra explainer", () => {
    assert.match(identityScreen, /Make it yours/);
    assert.match(identityScreen, /Display name/);
    assert.match(identityScreen, /Username/);
    assert.match(identityScreen, />Continue</);
    assert.doesNotMatch(
      identityScreen,
      /Choose the name your friends will see/,
    );
  });
});
