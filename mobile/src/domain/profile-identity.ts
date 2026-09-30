// Source: /lib/profile-identity.ts in the existing TapIt web app.
export function resolveDisplayName(
  displayName: string | null | undefined,
  username: string,
) {
  const normalized = displayName?.trim();
  return normalized || username;
}
