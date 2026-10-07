import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { normalizeProfileAvatarId } from "../mobile/src/domain/profile-avatar";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const profileScreen = source(
  "../mobile/src/features/profile/ProfileScreen.tsx",
);
const picker = source(
  "../mobile/src/features/profile/ProfileAvatarPicker.tsx",
);
const profileData = source(
  "../mobile/src/features/profile/useProfileData.ts",
);

describe("Profile avatar picker", () => {
  it("renders the authoritative avatar with safe default normalization", () => {
    assert.equal(normalizeProfileAvatarId(null), "default");
    assert.equal(normalizeProfileAvatarId(undefined), "default");
    assert.equal(normalizeProfileAvatarId("future-avatar"), "default");
    assert.match(
      profileScreen,
      /const avatarId = normalizeProfileAvatarId\(data\.profile\.avatar_id\)/,
    );
    assert.match(profileScreen, /<TapItAvatar[\s\S]*avatarId=\{avatarId\}/);
  });

  it("opens from the Profile avatar and starts from persisted state", () => {
    assert.match(
      profileScreen,
      /onPress=\{\(\) => setIsAvatarVisible\(true\)\}/,
    );
    assert.match(profileScreen, /visible=\{isAvatarVisible\}/);
    assert.match(
      picker,
      /const persistedAvatarId = normalizeProfileAvatarId\(avatarId\)/,
    );
    assert.match(
      picker,
      /useState<ProfileAvatarId>\(persistedAvatarId\)/,
    );
  });

  it("keeps selection as a local draft until explicit Save", () => {
    assert.match(picker, /setDraftAvatarId\(optionId\)/);
    assert.match(picker, /const result = await onSave\(draftAvatarId\)/);
    assert.match(picker, /onPress=\{onCancel\}/);
    assert.doesNotMatch(picker, /onPress=\{\(\) => void onSave\(optionId\)\}/);
  });

  it("prevents duplicate saves and closes only after success", () => {
    assert.match(picker, /if \(isSaving \|\| !hasChanged\) return/);
    assert.match(
      picker,
      /if \(result\.status === "success"\) \{[\s\S]*onSaved\(\)/,
    );
    assert.match(picker, /setNotice\(result\)[\s\S]*setIsSaving\(false\)/);
  });
});

describe("Profile avatar mutation", () => {
  it("uses the dedicated RPC with the exact selected semantic ID", () => {
    assert.match(profileData, /supabase\.rpc\([\s\S]*"set_my_avatar"/);
    assert.match(profileData, /\{ p_avatar_id: avatarId \}/);
    assert.doesNotMatch(
      profileData,
      /\.from\("profiles"\)[\s\S]*\.update\(/,
    );
  });

  it("guards duplicate mutations and refreshes authoritative data on success", () => {
    assert.match(
      profileData,
      /mutationsInFlight\.current\.has\("avatar"\)/,
    );
    assert.match(
      profileData,
      /savedAvatarId !== avatarId[\s\S]*await load\(\)[\s\S]*status: "success"/,
    );
  });

  it("does not report persistence when the RPC fails", () => {
    assert.match(
      profileData,
      /if \(updateError \|\| savedAvatarId !== avatarId\) \{[\s\S]*status: "error"/,
    );
  });
});
