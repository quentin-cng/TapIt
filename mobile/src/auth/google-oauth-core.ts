import { parseGoogleOAuthCallback } from "./google-oauth-contract";

const friendlyGoogleError =
  "We couldn’t continue with Google. Check your connection and try again.";

type OAuthError = { message?: string; status?: number } | null;

export type GoogleOAuthResult =
  | { status: "authenticated" | "already-complete" | "cancelled" | "busy" }
  | { message: string; retryable: boolean; status: "error" };

export type GoogleOAuthAuthClient = {
  exchangeCodeForSession: (code: string) => Promise<{
    data: { session: unknown | null };
    error: OAuthError;
  }>;
  signInWithOAuth: (credentials: {
    options: {
      redirectTo: string;
      skipBrowserRedirect: boolean;
    };
    provider: "google";
  }) => Promise<{
    data: { url: string | null };
    error: OAuthError;
  }>;
};

export type GoogleOAuthBrowser = {
  openAuthSessionAsync: (
    authorizationUrl: string,
    redirectUrl: string,
  ) => Promise<{ type: string; url?: string }>;
};

type GoogleOAuthDependencies = {
  auth: GoogleOAuthAuthClient;
  browser: GoogleOAuthBrowser;
  getRedirectUri: () => string;
};

function isRetryableOAuthError(error: OAuthError) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.status === 0 ||
    error?.status === 429 ||
    (typeof error?.status === "number" && error.status >= 500) ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("timed out")
  );
}

export function createGoogleOAuthCoordinator(
  dependencies: GoogleOAuthDependencies,
) {
  let activeLaunch: Promise<GoogleOAuthResult> | null = null;
  const exchangesInFlight = new Map<string, Promise<GoogleOAuthResult>>();
  const completedCodes = new Set<string>();

  function completeCallback(callbackUrl: string): Promise<GoogleOAuthResult> {
    const parsed = parseGoogleOAuthCallback(callbackUrl);

    if (parsed.status === "provider-error") {
      return Promise.resolve({
        message: "Google sign-in was not completed. Please try again.",
        retryable: false,
        status: "error",
      });
    }

    if (parsed.status !== "code") {
      return Promise.resolve({
        message: "This Google sign-in link is invalid or has expired.",
        retryable: false,
        status: "error",
      });
    }

    if (completedCodes.has(parsed.code)) {
      return Promise.resolve({ status: "already-complete" });
    }

    const existingExchange = exchangesInFlight.get(parsed.code);
    if (existingExchange) return existingExchange;

    const exchange = dependencies.auth
      .exchangeCodeForSession(parsed.code)
      .then(({ data, error }) => {
        if (error || !data.session) {
          return {
            message: friendlyGoogleError,
            retryable: isRetryableOAuthError(error),
            status: "error",
          } as const;
        }

        completedCodes.add(parsed.code);
        return { status: "authenticated" } as const;
      })
      .catch(
        () =>
          ({
            message: friendlyGoogleError,
            retryable: true,
            status: "error",
          }) as const,
      )
      .finally(() => {
        exchangesInFlight.delete(parsed.code);
      });

    exchangesInFlight.set(parsed.code, exchange);
    return exchange;
  }

  function start(): Promise<GoogleOAuthResult> {
    if (activeLaunch) return Promise.resolve({ status: "busy" });

    const launch = (async () => {
      let redirectTo: string;

      try {
        redirectTo = dependencies.getRedirectUri();
      } catch {
        return {
          message: friendlyGoogleError,
          retryable: false,
          status: "error",
        } as const;
      }

      try {
        const { data, error } = await dependencies.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error || !data.url) {
          return {
            message: friendlyGoogleError,
            retryable: isRetryableOAuthError(error),
            status: "error",
          } as const;
        }

        const browserResult = await dependencies.browser.openAuthSessionAsync(
          data.url,
          redirectTo,
        );

        if (
          browserResult.type === "cancel" ||
          browserResult.type === "dismiss"
        ) {
          return { status: "cancelled" } as const;
        }

        if (browserResult.type !== "success" || !browserResult.url) {
          return {
            message: friendlyGoogleError,
            retryable: true,
            status: "error",
          } as const;
        }

        return completeCallback(browserResult.url);
      } catch {
        return {
          message: friendlyGoogleError,
          retryable: true,
          status: "error",
        } as const;
      }
    })();

    activeLaunch = launch;
    void launch.finally(() => {
      if (activeLaunch === launch) activeLaunch = null;
    });

    return launch;
  }

  return { completeCallback, start };
}
