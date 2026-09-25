export function normalizeDisplayName(value: string) {
  return value.trim();
}

export function isValidDisplayName(value: string) {
  const normalized = normalizeDisplayName(value);
  const length = Array.from(normalized).length;

  return length >= 1 && length <= 30 && !/[\u0000-\u001f\u007f]/u.test(normalized);
}

export function resolveDisplayName(
  displayName: string | null | undefined,
  username: string,
) {
  const normalized = displayName?.trim();
  return normalized || username;
}
