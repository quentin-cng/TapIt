export const GOOGLE_OAUTH_SCHEME = "com.tapit.app" as const;
export const GOOGLE_OAUTH_CALLBACK_PATH = "/auth/callback" as const;
export const GOOGLE_OAUTH_CALLBACK_URI =
  "com.tapit.app:///auth/callback" as const;

const maximumAuthorizationCodeLength = 4096;

export type ParsedGoogleOAuthCallback =
  | { code: string; status: "code" }
  | { status: "provider-error" }
  | { status: "invalid" };

export function isGoogleOAuthCallbackPath(pathname: string) {
  return pathname === GOOGLE_OAUTH_CALLBACK_PATH;
}

export function parseGoogleOAuthCallback(
  callbackUrl: string,
): ParsedGoogleOAuthCallback {
  let url: URL;

  try {
    url = new URL(callbackUrl);
  } catch {
    return { status: "invalid" };
  }

  if (
    url.protocol !== `${GOOGLE_OAUTH_SCHEME}:` ||
    url.host !== "" ||
    url.pathname !== GOOGLE_OAUTH_CALLBACK_PATH
  ) {
    return { status: "invalid" };
  }

  const errors = url.searchParams.getAll("error");
  if (errors.length > 0) {
    return errors.length === 1
      ? { status: "provider-error" }
      : { status: "invalid" };
  }

  const codes = url.searchParams.getAll("code");
  if (codes.length !== 1) return { status: "invalid" };

  const code = codes[0] ?? "";
  if (
    code.length === 0 ||
    code.length > maximumAuthorizationCodeLength ||
    code.trim() !== code ||
    /[\s\u0000-\u001f\u007f]/.test(code)
  ) {
    return { status: "invalid" };
  }

  return { code, status: "code" };
}
