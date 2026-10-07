export const PROFILE_AVATAR_IDS = [
  "default",
  "mountain",
  "sunset",
  "forest",
  "moon",
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATAR_IDS)[number];

const profileAvatarIds = new Set<string>(PROFILE_AVATAR_IDS);

export function isProfileAvatarId(value: unknown): value is ProfileAvatarId {
  return typeof value === "string" && profileAvatarIds.has(value);
}

export function normalizeProfileAvatarId(value: unknown): ProfileAvatarId {
  return isProfileAvatarId(value) ? value : "default";
}
