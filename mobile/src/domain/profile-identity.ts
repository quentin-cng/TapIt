// Source: /lib/profile-identity.ts in the existing TapIt web app.
export function normalizeDisplayName(value: string) {
  return value.trim();
}

export function isValidDisplayName(value: string) {
  const normalized = normalizeDisplayName(value);
  const length = Array.from(normalized).length;

  return (
    length >= 1 &&
    length <= 30 &&
    !/[\u0000-\u001f\u007f]/u.test(normalized)
  );
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return /^[a-z0-9_]{3,30}$/.test(normalizeUsername(value));
}

export function resolveDisplayName(
  displayName: string | null | undefined,
  username: string,
) {
  const normalized = displayName?.trim();
  return normalized || username;
}
