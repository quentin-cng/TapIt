import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  GOOGLE_OAUTH_CALLBACK_URI,
  isGoogleOAuthCallbackPath,
  parseGoogleOAuthCallback,
} from "../mobile/src/auth/google-oauth-contract";
import {
  createGoogleOAuthCoordinator,
  type GoogleOAuthAuthClient,
  type GoogleOAuthBrowser,
} from "../mobile/src/auth/google-oauth-core";
import { isPublicPriorityPath } from "../mobile/src/domain/onboarding-routing";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return { promise, resolve };
}

function createOAuthHarness(options?: {
  browserResult?: { type: string; url?: string };
  exchangeError?: boolean;
  oauthError?: boolean;
}) {
  const calls: Array<{ method: string; payload: unknown }> = [];
  const callbackUrl = `${GOOGLE_OAUTH_CALLBACK_URI}?code=oauth-code`;
  const auth: GoogleOAuthAuthClient = {
    async exchangeCodeForSession(code) {
      calls.push({ method: "exchange", payload: code });
      return options?.exchangeError
        ? { data: { session: null }, error: { message: "exchange failed" } }
        : { data: { session: { user: { id: "user-id" } } }, error: null };
    },
    async signInWithOAuth(credentials) {
      calls.push({ method: "authorize", payload: credentials });
      return options?.oauthError
        ? { data: { url: null }, error: { message: "provider failed" } }
        : {
            data: { url: "https://project.supabase.co/auth/v1/authorize" },
            error: null,
          };
    },
  };
  const browser: GoogleOAuthBrowser = {
    async openAuthSessionAsync(authorizationUrl, redirectUrl) {
      calls.push({
        method: "browser",
        payload: { authorizationUrl, redirectUrl },
      });
      return options?.browserResult ?? { type: "success", url: callbackUrl };
    },
  };
  const coordinator = createGoogleOAuthCoordinator({
    auth,
    browser,
    getRedirectUri: () => GOOGLE_OAUTH_CALLBACK_URI,
  });

  return { calls, callbackUrl, coordinator };
}

describe("native Google OAuth callback contract", () => {
  it("uses one exact deterministic callback URI and public route", () => {
    assert.equal(GOOGLE_OAUTH_CALLBACK_URI, "com.tapit.app:///auth/callback");
    assert.equal(isGoogleOAuthCallbackPath("/auth/callback"), true);
    assert.equal(isGoogleOAuthCallbackPath("/auth/callback/extra"), false);
    assert.equal(isPublicPriorityPath("/auth/callback"), true);
  });

  it("accepts one well-formed code only on the TapIt callback", () => {
    assert.deepEqual(
      parseGoogleOAuthCallback(
        `${GOOGLE_OAUTH_CALLBACK_URI}?code=valid-code_123`,
      ),
      { code: "valid-code_123", status: "code" },
    );
    assert.deepEqual(parseGoogleOAuthCallback(GOOGLE_OAUTH_CALLBACK_URI), {
      status: "invalid",
    });
    assert.deepEqual(
      parseGoogleOAuthCallback(
        `${GOOGLE_OAUTH_CALLBACK_URI}?code=one&code=two`,
      ),
      { status: "invalid" },
    );
    assert.deepEqual(
      parseGoogleOAuthCallback(
        "other.app:///auth/callback?code=valid-code_123",
      ),
      { status: "invalid" },
    );
    assert.deepEqual(
      parseGoogleOAuthCallback(
        `${GOOGLE_OAUTH_CALLBACK_URI}?error=access_denied`,
      ),
      { status: "provider-error" },
    );
  });
});

describe("native Google OAuth coordinator", () => {
  it("starts Google through Supabase and exchanges the returned code", async () => {
    const { calls, coordinator } = createOAuthHarness();

    assert.deepEqual(await coordinator.start(), { status: "authenticated" });
    assert.deepEqual(calls, [
      {
        method: "authorize",
        payload: {
          provider: "google",
          options: {
            redirectTo: GOOGLE_OAUTH_CALLBACK_URI,
            skipBrowserRedirect: true,
          },
        },
      },
      {
        method: "browser",
        payload: {
          authorizationUrl:
            "https://project.supabase.co/auth/v1/authorize",
          redirectUrl: GOOGLE_OAUTH_CALLBACK_URI,
        },
      },
      { method: "exchange", payload: "oauth-code" },
    ]);
  });

  it("treats browser cancellation and dismissal as neutral", async () => {
    for (const type of ["cancel", "dismiss"]) {
      const { calls, coordinator } = createOAuthHarness({
        browserResult: { type },
      });

      assert.deepEqual(await coordinator.start(), { status: "cancelled" });
      assert.equal(
        calls.some((call) => call.method === "exchange"),
        false,
      );
    }
  });

  it("returns safe errors for provider, browser, and exchange failures", async () => {
    const provider = createOAuthHarness({ oauthError: true });
    const browser = createOAuthHarness({ browserResult: { type: "locked" } });
    const exchange = createOAuthHarness({ exchangeError: true });

    for (const result of [
      await provider.coordinator.start(),
      await browser.coordinator.start(),
      await exchange.coordinator.start(),
    ]) {
      assert.equal(result.status, "error");
      if (result.status === "error") {
        assert.doesNotMatch(result.message, /provider failed|exchange failed/);
      }
    }
  });

  it("never exchanges malformed, missing-code, or provider-error callbacks", async () => {
    const { calls, coordinator } = createOAuthHarness();

    for (const callback of [
      GOOGLE_OAUTH_CALLBACK_URI,
      "other.app:///auth/callback?code=code",
      `${GOOGLE_OAUTH_CALLBACK_URI}?error=access_denied`,
    ]) {
      assert.equal((await coordinator.completeCallback(callback)).status, "error");
    }

    assert.equal(calls.length, 0);
  });

  it("shares an in-flight exchange and never exchanges a completed code twice", async () => {
    const exchange = createDeferred<{
      data: { session: unknown };
      error: null;
    }>();
    let exchangeCount = 0;
    const auth: GoogleOAuthAuthClient = {
      exchangeCodeForSession() {
        exchangeCount += 1;
        return exchange.promise;
      },
      async signInWithOAuth() {
        return { data: { url: null }, error: null };
      },
    };
    const coordinator = createGoogleOAuthCoordinator({
      auth,
      browser: {
        async openAuthSessionAsync() {
          return { type: "cancel" };
        },
      },
      getRedirectUri: () => GOOGLE_OAUTH_CALLBACK_URI,
    });
    const callback = `${GOOGLE_OAUTH_CALLBACK_URI}?code=one-time-code`;

    const first = coordinator.completeCallback(callback);
    const duplicate = coordinator.completeCallback(callback);
    assert.equal(exchangeCount, 1);
    exchange.resolve({ data: { session: {} }, error: null });
    assert.deepEqual(await first, { status: "authenticated" });
    assert.deepEqual(await duplicate, { status: "authenticated" });
    assert.deepEqual(await coordinator.completeCallback(callback), {
      status: "already-complete",
    });
    assert.equal(exchangeCount, 1);
  });

  it("prevents repeated launches while one browser flow is active", async () => {
    const authorization = createDeferred<{
      data: { url: string };
      error: null;
    }>();
    const auth: GoogleOAuthAuthClient = {
      async exchangeCodeForSession() {
        return { data: { session: null }, error: null };
      },
      signInWithOAuth() {
        return authorization.promise;
      },
    };
    const coordinator = createGoogleOAuthCoordinator({
      auth,
      browser: {
        async openAuthSessionAsync() {
          return { type: "cancel" };
        },
      },
      getRedirectUri: () => GOOGLE_OAUTH_CALLBACK_URI,
    });

    const first = coordinator.start();
    assert.deepEqual(await coordinator.start(), { status: "busy" });
    authorization.resolve({
      data: { url: "https://project.supabase.co/auth/v1/authorize" },
      error: null,
    });
    assert.deepEqual(await first, { status: "cancelled" });
  });
});

describe("native Google OAuth integration boundaries", () => {
  const appConfig = JSON.parse(source("../mobile/app.json")) as {
    expo: {
      android: { intentFilters: unknown[]; package: string };
      plugins: Array<string | unknown[]>;
      scheme: string;
    };
  };
  const callbackRoute = source("../mobile/src/app/auth/callback.tsx");
  const createAccount = source(
    "../mobile/src/features/onboarding/CreateAccountChoice.tsx",
  );
  const googleButton = source(
    "../mobile/src/features/auth/GoogleAuthButton.tsx",
  );
  const oauthCore = source("../mobile/src/auth/google-oauth-core.ts");
  const oauthRuntime = source("../mobile/src/auth/google-oauth.ts");
  const pendingProvider = source(
    "../mobile/src/checkin/PendingCheckinProvider.tsx",
  );
  const publicCheckin = source("../mobile/src/app/checkin/[token].tsx");
  const rootLayout = source("../mobile/src/app/_layout.tsx");
  const signIn = source("../mobile/src/app/sign-in.tsx");
  const signUp = source("../mobile/src/features/onboarding/SignUpScreen.tsx");
  const supabaseClient = source("../mobile/src/lib/supabase.ts");

  it("registers the app scheme while preserving the check-in App Link", () => {
    assert.equal(appConfig.expo.scheme, "com.tapit.app");
    assert.equal(appConfig.expo.android.package, "com.tapit.app");
    assert.match(JSON.stringify(appConfig.expo.android.intentFilters), /checkin/);
    assert.ok(appConfig.expo.plugins.includes("expo-web-browser"));
  });

  it("uses PKCE while preserving native session settings", () => {
    assert.match(supabaseClient, /storage: AsyncStorage/);
    assert.match(supabaseClient, /autoRefreshToken: true/);
    assert.match(supabaseClient, /persistSession: true/);
    assert.match(supabaseClient, /detectSessionInUrl: false/);
    assert.match(supabaseClient, /flowType: "pkce"/);
  });

  it("keeps SessionProvider and authoritative root routing in charge", () => {
    assert.match(oauthCore, /exchangeCodeForSession/);
    assert.doesNotMatch(
      oauthRuntime + oauthCore,
      /router\.(push|replace)|onboarding|checkin/,
    );
    assert.doesNotMatch(callbackRoute, /onboarding|pendingToken|perform_checkin/);
    assert.match(rootLayout, /<Stack\.Screen name="auth\/callback" \/>/);
    assert.match(rootLayout, /getAuthoritativeSetupPath\(readiness\)/);
    assert.match(
      rootLayout,
      /Boolean\(session\) && isOnboardingComplete/,
    );
  });

  it("adds one reusable Google action while preserving password auth", () => {
    assert.match(googleButton, /Continue with Google/);
    assert.match(signIn, /<GoogleAuthButton \/>/);
    assert.match(createAccount, /!preview[\s\S]*<GoogleAuthButton \/>/);
    assert.match(signIn, /supabase\.auth\.signInWithPassword/);
    assert.match(signUp, /supabase\.auth\.signUp/);
  });

  it("does not mutate or consume pending NFC state", () => {
    for (const oauthSource of [oauthRuntime, callbackRoute, googleButton]) {
      assert.doesNotMatch(
        oauthSource,
        /persistPendingToken|acknowledgePendingToken|perform_checkin/,
      );
    }
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.match(publicCheckin, /persistPendingToken\(token\)/);
    assert.match(publicCheckin, /<CheckinScreen/);
  });

});
