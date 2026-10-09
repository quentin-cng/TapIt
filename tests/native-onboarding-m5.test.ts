import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const welcomeRoute = source("../mobile/src/app/welcome.tsx");
const createAccountRoute = source("../mobile/src/app/create-account.tsx");
const signUpRoute = source("../mobile/src/app/sign-up.tsx");
const rootLayout = source("../mobile/src/app/_layout.tsx");
const createAccountForm = source(
  "../mobile/src/features/onboarding/CreateAccountChoice.tsx",
);
const signUpScreen = source(
  "../mobile/src/features/onboarding/SignUpScreen.tsx",
);
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);

describe("native onboarding M5 account creation", () => {
  it("opens the production account form directly from the intro", () => {
    assert.match(welcomeRoute, /router\.push\("\/create-account"\)/);
    assert.match(createAccountRoute, /SignUpScreen as default/);
    assert.match(signUpRoute, /SignUpScreen as default/);
    assert.match(createAccountForm, /Create your account/);
    assert.doesNotMatch(createAccountForm, /Continue with Apple|Continue with Google/);
  });

  it("uses the existing Supabase signup boundary without inserting a profile", () => {
    assert.match(signUpScreen, /supabase\.auth\.signUp\(\{ email, password \}\)/);
    assert.doesNotMatch(
      signUpScreen + createAccountForm,
      /from\(["']profiles["']\)|insert\(|update_my_profile|set_my_avatar/,
    );
  });

  it("normalizes and validates credentials before one guarded submission", () => {
    assert.match(createAccountForm, /email\.trim\(\)\.toLowerCase\(\)/);
    assert.match(createAccountForm, /password\.length < 8/);
    assert.match(createAccountForm, /if \(submissionInFlight\.current\) return/);
    assert.match(createAccountForm, /disabled=\{isDisabled\}/);
    assert.match(createAccountForm, /secureTextEntry/);
    assert.match(createAccountForm, /inputMode="email"/);
    assert.match(createAccountForm, /KeyboardAvoidingView/);
  });

  it("supports confirmation-required and friendly retryable failures", () => {
    assert.match(signUpScreen, /if \(!data\.session\)/);
    assert.match(signUpScreen, /status: "confirmation-required"/);
    assert.match(signUpScreen, /already exists for this email/);
    assert.match(signUpScreen, /Check your connection and try again/);
    assert.doesNotMatch(createAccountForm, /error\.message/);
  });

  it("hands authenticated signup to authoritative readiness routing", () => {
    assert.match(rootLayout, /getAuthoritativeSetupPath\(readiness\)/);
    assert.match(
      rootLayout,
      /Stack\.Protected guard=\{Boolean\(session\) && !isOnboardingComplete\}/,
    );
    assert.doesNotMatch(signUpScreen, /router\.(?:push|replace)\("\/onboarding/);
  });

  it("preserves pending NFC continuation and keeps preview mutation-free", () => {
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.match(rootLayout, /router\.replace\(`\/checkin\/\$\{pendingToken\}`\)/);
    assert.match(previewFlow, /onSubmit=\{async \(\) => \{/);
    assert.doesNotMatch(previewFlow, /supabase|auth\.signUp|persistPendingToken/);
  });
});
