import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const privacyMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923060000_privacy_hardening_and_account_deletion.sql",
    import.meta.url,
  ),
  "utf8",
);
const initialMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923000000_initial_schema.sql",
    import.meta.url,
  ),
  "utf8",
);
const weeklyMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923010000_weekly_goals.sql",
    import.meta.url,
  ),
  "utf8",
);
const requestMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923040000_mutual_friend_requests.sql",
    import.meta.url,
  ),
  "utf8",
);
const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const appSource = [
  "../app/dashboard/page.tsx",
  "../app/profile/page.tsx",
  "../app/friends/page.tsx",
  "../app/leaderboard/page.tsx",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8")).join("\n");

describe("privacy hardening database boundary", () => {
  it("removes broad profile and venue reads", () => {
    assert.match(
      privacyMigration,
      /revoke select on table public\.profiles from authenticated/,
    );
    assert.match(
      privacyMigration,
      /revoke select on table public\.locations from authenticated/,
    );
    assert.doesNotMatch(appSource, /\.from\("profiles"\)/);
    assert.doesNotMatch(appSource, /\.from\("locations"\)/);
  });

  it("uses scoped RPCs without exposing venue geofence fields", () => {
    for (const name of [
      "get_my_profile",
      "get_my_checkin_locations",
      "get_global_leaderboard",
      "get_relationship_profiles",
      "search_profiles",
    ]) {
      assert.match(
        privacyMigration,
        new RegExp(
          `create function public\\.${name}\\([\\s\\S]*?security definer[\\s\\S]*?set search_path = ''`,
        ),
      );
    }

    const locationFunction = privacyMigration.slice(
      privacyMigration.indexOf("create function public.get_my_checkin_locations"),
      privacyMigration.indexOf("create function public.get_global_leaderboard"),
    );
    assert.match(locationFunction, /location\.id, location\.name/);
    assert.doesNotMatch(
      locationFunction,
      /latitude|longitude|checkin_radius_meters/,
    );
  });

  it("keeps strangers' UUIDs out of search and leaderboard responses", () => {
    const searchFunction = privacyMigration.slice(
      privacyMigration.indexOf("create function public.search_profiles"),
      privacyMigration.indexOf("create function public.send_friend_request_by_username"),
    );
    const leaderboardFunction = privacyMigration.slice(
      privacyMigration.indexOf("create function public.get_global_leaderboard"),
      privacyMigration.indexOf("create function public.get_relationship_profiles"),
    );
    assert.doesNotMatch(searchFunction, /profile_id uuid/);
    assert.doesNotMatch(leaderboardFunction, /profile_id uuid/);
    assert.match(
      privacyMigration,
      /send_friend_request_by_username[\s\S]*return public\.send_friend_request\(v_recipient_id\)/,
    );
  });
});

describe("self-service account deletion boundary", () => {
  it("accepts no target UUID and always derives the target from auth.uid()", () => {
    assert.match(
      privacyMigration,
      /create function public\.delete_current_account\(\)/,
    );
    assert.match(
      privacyMigration,
      /v_current_user_id uuid := auth\.uid\(\)/,
    );
    assert.match(
      privacyMigration,
      /delete from auth\.users as auth_user[\s\S]*auth_user\.id = v_current_user_id/,
    );
    assert.doesNotMatch(
      privacyMigration,
      /delete_current_account\([^)]*(?:uuid|user_id)[^)]*\)/,
    );
  });

  it("rejects unauthenticated execution and grants only authenticated execution", () => {
    assert.match(
      privacyMigration,
      /if v_current_user_id is null then[\s\S]*Authentication is required to delete an account/,
    );
    assert.match(
      privacyMigration,
      /revoke all on function public\.delete_current_account\(\) from public, anon, authenticated/,
    );
    assert.match(
      privacyMigration,
      /grant execute on function public\.delete_current_account\(\) to authenticated/,
    );
  });

  it("has complete cascades for every user-owned application table", () => {
    assert.match(
      initialMigration,
      /profiles[\s\S]*references auth\.users \(id\) on delete cascade/,
    );
    assert.match(
      initialMigration,
      /checkins[\s\S]*user_id uuid not null references public\.profiles \(id\) on delete cascade/,
    );
    assert.match(
      initialMigration,
      /friendships[\s\S]*user_id uuid not null references public\.profiles \(id\) on delete cascade[\s\S]*friend_id uuid not null references public\.profiles \(id\) on delete cascade/,
    );
    assert.match(
      weeklyMigration,
      /weekly_goal_schedules[\s\S]*user_id uuid not null references public\.profiles \(id\) on delete cascade/,
    );
    assert.match(
      weeklyMigration,
      /weekly_goal_completions[\s\S]*user_id uuid not null references public\.profiles \(id\) on delete cascade/,
    );
    assert.match(
      requestMigration,
      /requester_id uuid not null references public\.profiles \(id\) on delete cascade[\s\S]*recipient_id uuid not null references public\.profiles \(id\) on delete cascade/,
    );
  });

  it("does not introduce a privileged browser or server environment secret", () => {
    assert.doesNotMatch(envExample, /SERVICE_ROLE|SECRET_KEY/);
    assert.doesNotMatch(appSource, /SERVICE_ROLE|SECRET_KEY/);
  });
});

describe("legal page product consistency", () => {
  const privacyPage = readFileSync(
    new URL("../app/privacy/page.tsx", import.meta.url),
    "utf8",
  );
  const termsPage = readFileSync(
    new URL("../app/terms/page.tsx", import.meta.url),
    "utf8",
  );
  const authForm = readFileSync(
    new URL("../components/auth-form.tsx", import.meta.url),
    "utf8",
  );

  it("publishes the supplied age and contact facts", () => {
    assert.match(privacyPage, /16 years of age or older/);
    assert.match(termsPage, /at least 16 years old/);
    assert.match(privacyPage, /quentin\.canaguier@mail\.mcgill\.ca/);
    assert.match(termsPage, /quentin\.canaguier@mail\.mcgill\.ca/);
  });

  it("links both legal documents from signup", () => {
    assert.match(authForm, /href="\/terms"/);
    assert.match(authForm, /href="\/privacy"/);
    assert.match(authForm, /You must be at least 16/);
  });
});
