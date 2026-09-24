const internalOrigin = "https://tapit.internal";

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(value, internalOrigin);

    if (url.origin !== internalOrigin) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getOnboardingPath(value: string | null | undefined) {
  const next = getSafeNextPath(value);
  return `/onboarding?next=${encodeURIComponent(next)}`;
}
