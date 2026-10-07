import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  isProfileAvatarId,
  normalizeProfileAvatarId,
  PROFILE_AVATAR_IDS,
} from "../mobile/src/domain/profile-avatar";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20261007000000_profile_avatars.sql",
    import.meta.url,
  ),
  "utf8",
);

const avatarIds = ["default", "mountain", "sunset", "forest", "moon"];

function functionSource(name: string, nextMarker: string) {
  const start = migration.indexOf(`create function public.${name}`);
  const end = migration.indexOf(nextMarker, start);
  assert.notEqual(start, -1, `${name} must exist`);
  assert.notEqual(end, -1, `${name} must have a readable boundary`);
  return migration.slice(start, end);
}

describe("profile avatar database contract", () => {
  it("adds a non-null default avatar with the exact predefined allowlist", () => {
    assert.match(
      migration,
      /add column avatar_id text not null default 'default'/,
    );
    assert.match(migration, /constraint profiles_avatar_id_check check/);

    for (const avatarId of avatarIds) {
      assert.match(migration, new RegExp(`'${avatarId}'`));
    }
  });

  it("updates only auth.uid() through a hardened dedicated RPC", () => {
    const mutation = functionSource(
      "set_my_avatar",
      "drop function public.get_my_profile",
    );

    assert.match(mutation, /returns text/);
    assert.match(mutation, /security definer/);
    assert.match(mutation, /set search_path = ''/);
    assert.match(mutation, /v_current_user_id uuid := auth\.uid\(\)/);
    assert.match(
      mutation,
      /Authentication is required to update an avatar/,
    );
    assert.match(mutation, /set avatar_id = p_avatar_id/);
    assert.match(mutation, /where profile\.id = v_current_user_id/);
    assert.doesNotMatch(mutation, /set[\s\S]*display_name\s*=/);
    assert.doesNotMatch(mutation, /set[\s\S]*username\s*=/);
    assert.doesNotMatch(mutation, /set[\s\S]*total_points\s*=/);
  });

  it("rejects null and unknown identifiers before the profile update", () => {
    const mutation = functionSource(
      "set_my_avatar",
      "drop function public.get_my_profile",
    );
    const validationIndex = mutation.indexOf("p_avatar_id is null");
    const updateIndex = mutation.indexOf("update public.profiles");

    assert.ok(validationIndex >= 0 && validationIndex < updateIndex);
    assert.match(mutation, /errcode = '22023'/);
    assert.match(mutation, /p_avatar_id not in/);
  });

  it("exposes avatar_id through every intended purpose-specific read", () => {
    for (const name of [
      "get_my_profile",
      "get_relationship_profiles",
      "search_profiles",
      "get_global_leaderboard",
      "get_social_weekly_stats",
    ]) {
      assert.match(
        migration,
        new RegExp(
          `create function public\\.${name}\\([\\s\\S]*?avatar_id text`,
        ),
      );
    }
  });

  it("grants mutation only to authenticated callers", () => {
    assert.match(
      migration,
      /revoke all on function public\.set_my_avatar\(text\)[\s\S]*from public, anon, authenticated/,
    );
    assert.match(
      migration,
      /grant execute on function public\.set_my_avatar\(text\)[\s\S]*to authenticated/,
    );
    assert.doesNotMatch(
      migration,
      /grant execute on function public\.set_my_avatar\(text\)\s+to (?:public|anon)/,
    );
  });
});

describe("General leaderboard avatar privacy", () => {
  it("returns selected avatars only for public entries", () => {
    const leaderboard = functionSource(
      "get_global_leaderboard",
      "drop function public.get_social_weekly_stats",
    );

    assert.match(
      leaderboard,
      /show_username_on_general_leaderboard then profile\.avatar_id[\s\S]*else 'default'::text/,
    );
  });

  it("preserves authoritative ranking, points, and current-user state", () => {
    const leaderboard = functionSource(
      "get_global_leaderboard",
      "drop function public.get_social_weekly_stats",
    );

    assert.match(leaderboard, /row_number\(\) over/);
    assert.match(leaderboard, /profile\.total_points/);
    assert.match(leaderboard, /profile\.id = v_current_user_id/);
    assert.doesNotMatch(
      leaderboard,
      /where\s+profile\.show_username_on_general_leaderboard/,
    );
  });
});

describe("client avatar vocabulary", () => {
  it("matches the database vocabulary and accepts every supported ID", () => {
    assert.deepEqual([...PROFILE_AVATAR_IDS], avatarIds);
    for (const avatarId of avatarIds) {
      assert.equal(isProfileAvatarId(avatarId), true);
      assert.equal(normalizeProfileAvatarId(avatarId), avatarId);
    }
  });

  it("falls back safely for missing, invalid, and future identifiers", () => {
    assert.equal(normalizeProfileAvatarId(null), "default");
    assert.equal(normalizeProfileAvatarId(undefined), "default");
    assert.equal(normalizeProfileAvatarId("unknown"), "default");
    assert.equal(normalizeProfileAvatarId("future-avatar"), "default");
  });
});
