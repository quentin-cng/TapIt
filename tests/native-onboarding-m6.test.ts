import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  getAuthoritativeSetupPath,
  type SetupReadiness,
} from "../mobile/src/domain/onboarding-routing";
import { PROFILE_AVATAR_IDS } from "../mobile/src/domain/profile-avatar";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const migration = source(
  "../supabase/migrations/20261008000000_onboarding_avatar_selection.sql",
);
const provider = source("../mobile/src/onboarding/OnboardingProvider.tsx");
const avatarRoute = source("../mobile/src/app/onboarding/avatar.tsx");
const onboardingLayout = source("../mobile/src/app/onboarding/_layout.tsx");
const avatarScreen = source(
  "../mobile/src/features/onboarding/AvatarSetupScreen.tsx",
);
const previewFlow = source(
  "../mobile/src/features/onboarding/OnboardingPreviewFlow.tsx",
);
const publicCheckinRoute = source("../mobile/src/app/checkin/[token].tsx");
const pendingProvider = source(
  "../mobile/src/checkin/PendingCheckinProvider.tsx",
);
const initialSchema = source(
  "../supabase/migrations/20260923000000_initial_schema.sql",
);

describe("native onboarding M6 database contract", () => {
  it("adds a nullable, no-default completion marker and backfills existing profiles", () => {
    assert.match(
      migration,
      /add column avatar_selected_at timestamptz\s*;/,
    );
    assert.doesNotMatch(
      migration,
      /add column avatar_selected_at[^;]*(?:not null|default)/i,
    );
    assert.match(
      migration,
      /update public\.profiles\s+set avatar_selected_at = now\(\)\s+where avatar_selected_at is null/,
    );
    assert.match(
      initialSchema,
      /insert into public\.profiles \(id, username\)\s+values/,
    );
  });

  it("atomically records every valid avatar selection for auth.uid()", () => {
    assert.match(migration, /v_current_user_id uuid := auth\.uid\(\)/);
    assert.match(
      migration,
      /set\s+avatar_id = p_avatar_id,\s+avatar_selected_at = now\(\)/,
    );
    assert.match(migration, /where profile\.id = v_current_user_id/);

    for (const avatarId of PROFILE_AVATAR_IDS) {
      assert.match(migration, new RegExp(`'${avatarId}'`));
    }

    assert.match(migration, /p_avatar_id is null or p_avatar_id not in/);
    assert.match(migration, /errcode = '22023'/);
  });

  it("exposes the marker only through the existing authenticated profile contract", () => {
    assert.match(
      migration,
      /create function public\.get_my_profile\(\)[\s\S]*avatar_selected_at timestamptz/,
    );
    assert.match(migration, /profile\.avatar_selected_at/);
    assert.match(
      migration,
      /revoke all on function public\.get_my_profile\(\)[\s\S]*from public, anon, authenticated/,
    );
    assert.match(
      migration,
      /grant execute on function public\.get_my_profile\(\)[\s\S]*to authenticated/,
    );
  });
});

describe("native onboarding M6 authoritative readiness", () => {
  it("routes avatar before identity and weekly goal setup", () => {
    const expected: Array<[SetupReadiness, string | null]> = [
      ["avatar-required", "/onboarding/avatar"],
      ["identity-incomplete", "/onboarding/profile"],
      ["weekly-goal-required", "/onboarding/weekly-goal"],
      ["confirmation-required", "/onboarding/complete"],
      ["complete", null],
    ];

    for (const [readiness, path] of expected) {
      assert.equal(getAuthoritativeSetupPath(readiness), path);
    }

    const avatarIndex = provider.indexOf("!nextProfile.avatar_selected_at");
    const identityIndex = provider.indexOf(
      "nextProfile.username === getGeneratedFallbackUsername(userId)",
    );
    const goalIndex = provider.indexOf("if (!goalResult.data)");
    assert.ok(avatarIndex >= 0 && avatarIndex < identityIndex);
    assert.ok(identityIndex < goalIndex);
  });

  it("restores avatar-required accounts to the authenticated avatar route", () => {
    assert.match(onboardingLayout, /initialRouteName="avatar"/);
    assert.match(avatarRoute, /AvatarSetupScreen as default/);
    assert.match(provider, /setReadiness\("avatar-required"\)/);
  });

  it("keeps pending NFC routing authoritative and does not consume its token", () => {
    assert.match(
      publicCheckinRoute,
      /getAuthoritativeSetupPath\(readiness\)/,
    );
    assert.match(pendingProvider, /tapit\.pending-checkin-token\.v1/);
    assert.doesNotMatch(
      avatarScreen,
      /acknowledgePendingToken|persistPendingToken|perform_checkin/,
    );
  });
});

describe("native onboarding M6 production avatar step", () => {
  it("renders the shared avatar registry and persists through set_my_avatar only", () => {
    assert.match(avatarScreen, /PROFILE_AVATAR_IDS\.map/);
    assert.match(avatarScreen, /<TapItAvatar avatarId=\{avatarId\} size=\{76\} \/>/);
    assert.match(avatarScreen, /supabase\.rpc\("set_my_avatar"/);
    assert.doesNotMatch(
      avatarScreen,
      /from\(["']profiles["']\)|update\(|insert\(/,
    );
  });

  it("guards duplicate and empty submissions while preserving retry state", () => {
    assert.match(
      avatarScreen,
      /if \(submissionInFlight\.current \|\| !selectedAvatar\) return/,
    );
    assert.match(avatarScreen, /disabled=\{isContinueDisabled\}/);
    assert.match(avatarScreen, /setError\("We couldn’t save your avatar/);
    assert.doesNotMatch(avatarScreen, /setSelectedAvatar\(null\)/);
  });

  it("refreshes readiness only after authoritative persistence succeeds", () => {
    const rpcIndex = avatarScreen.indexOf(
      'supabase.rpc("set_my_avatar"',
    );
    const failureIndex = avatarScreen.indexOf(
      "if (rpcError || !isProfileAvatarId(data) || data !== selectedAvatar)",
    );
    const refreshIndex = avatarScreen.indexOf("await refresh()");
    assert.ok(rpcIndex >= 0 && rpcIndex < failureIndex);
    assert.ok(failureIndex < refreshIndex);
    assert.doesNotMatch(avatarScreen, /router\.(?:push|replace)/);
  });

  it("leaves the development preview local and mutation-free", () => {
    assert.match(previewFlow, /setAvatarId\(optionId\)/);
    assert.doesNotMatch(
      previewFlow,
      /set_my_avatar|useOnboarding|supabase|avatar_selected_at/,
    );
  });
});
