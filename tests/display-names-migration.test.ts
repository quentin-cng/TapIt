import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const migration = source(
  "../supabase/migrations/20260924010000_display_names.sql",
);
const initialMigration = source(
  "../supabase/migrations/20260923000000_initial_schema.sql",
);
const authActions = source("../app/auth/actions.ts");
const dashboard = source("../app/dashboard/page.tsx");
const friends = source("../app/friends/page.tsx");
const leaderboard = source("../app/leaderboard/page.tsx");
const profile = source("../app/profile/page.tsx");
const recap = source("../app/recap/page.tsx");
const privacyControl = source(
  "../components/general-leaderboard-privacy-form.tsx",
);

type TestProfile = {
  displayName: string;
  username: string;
  points: number;
  createdAt: string;
  visible: boolean;
};

function rankGeneralProfiles(profiles: TestProfile[]) {
  return [...profiles]
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.createdAt.localeCompare(b.createdAt) ||
        a.username.localeCompare(b.username),
    )
    .map((profile, index) => ({
      rank: index + 1,
      displayName: profile.visible ? profile.displayName : "Anonymous",
      username: profile.visible ? profile.username : null,
      points: profile.points,
    }));
}

describe("display name database model", () => {
  it("adds, backfills, and requires validated display names", () => {
    assert.match(migration, /add column display_name text/);
    assert.match(migration, /update public\.profiles[\s\S]*display_name = username/);
    assert.match(migration, /alter column display_name set not null/);
    assert.match(
      migration,
      /profiles_display_name_format check[\s\S]*char_length\(display_name\) between 1 and 30[\s\S]*display_name = btrim\(display_name\)/,
    );
    assert.match(migration, /display_name !~ '\[\[:cntrl:\]\]'/);
  });

  it("allows duplicate display names while preserving unique usernames", () => {
    assert.doesNotMatch(migration, /unique\s*\([^)]*display_name/i);
    assert.match(initialMigration, /username text not null unique/);
    assert.doesNotMatch(migration, /drop constraint[^;]*username/i);
  });

  it("validates signup metadata and updates only auth.uid through an RPC", () => {
    assert.match(
      migration,
      /handle_new_user\(\)[\s\S]*raw_user_meta_data ->> 'display_name'[\s\S]*requested_display_name := requested_username/,
    );
    assert.match(
      migration,
      /update_my_profile\([\s\S]*security definer[\s\S]*set search_path = ''[\s\S]*auth\.uid\(\)/,
    );
    assert.match(migration, /where profile\.id = v_current_user_id/);
    assert.match(
      migration,
      /revoke update \(username\) on table public\.profiles from authenticated/,
    );
    assert.match(
      migration,
      /grant execute on function public\.update_my_profile\(text, text\)[\s\S]*to authenticated/,
    );
    assert.match(authActions, /data: \{ display_name: displayName, username \}/);
  });
});

describe("display name privacy contracts", () => {
  it("returns both identity fields only for visible General users", () => {
    const ranked = rankGeneralProfiles([
      {
        displayName: "Alex",
        username: "alex",
        points: 320,
        createdAt: "2026-01-01",
        visible: true,
      },
      {
        displayName: "Quentin",
        username: "quentincng",
        points: 290,
        createdAt: "2026-01-02",
        visible: false,
      },
    ]);

    assert.deepEqual(ranked, [
      {
        rank: 1,
        displayName: "Alex",
        username: "alex",
        points: 320,
      },
      {
        rank: 2,
        displayName: "Anonymous",
        username: null,
        points: 290,
      },
    ]);
    assert.doesNotMatch(JSON.stringify(ranked), /Quentin|quentincng/);
  });

  it("masks after ranking without filtering or changing points", () => {
    const functionBody = migration.slice(
      migration.indexOf("create function public.get_global_leaderboard"),
      migration.indexOf("alter function public.get_social_weekly_stats"),
    );

    assert.match(functionBody, /row_number\(\) over/);
    assert.match(
      functionBody,
      /show_username_on_general_leaderboard then profile\.display_name[\s\S]*else 'Anonymous'::text/,
    );
    assert.match(
      functionBody,
      /show_username_on_general_leaderboard then profile\.username[\s\S]*else null::text/,
    );
    assert.match(functionBody, /profile\.total_points/);
    assert.doesNotMatch(
      functionBody,
      /where\s+profile\.show_username_on_general_leaderboard/,
    );
  });

  it("keeps display names limited to self and relationship-scoped RPCs", () => {
    assert.match(migration, /get_my_profile\(\)[\s\S]*profile\.display_name/);
    assert.match(
      migration,
      /get_relationship_profiles\(\)[\s\S]*profile\.display_name/,
    );
    assert.match(
      migration,
      /search_profiles\([\s\S]*profile\.display_name[\s\S]*profile\.username like v_query/,
    );
    assert.match(
      migration,
      /get_social_weekly_stats\(\)[\s\S]*profile\.display_name[\s\S]*get_social_weekly_stats_base/,
    );
    assert.match(
      migration,
      /revoke all on function public\.get_social_weekly_stats_base\(\)[\s\S]*from public, anon, authenticated/,
    );
  });
});

describe("display name product surfaces", () => {
  it("uses display names on Home and edits identity on Profile", () => {
    assert.match(dashboard, /resolveDisplayName\(profile\.display_name, profile\.username\)/);
    assert.match(profile, /<ProfileIdentityForm/);
    assert.match(profile, /<h2>\{displayName\}<\/h2>/);
    assert.match(profile, /@\{profile\.username\}/);
  });

  it("renders name above username for friends and leaderboards", () => {
    assert.match(friends, /<strong>\{displayName\}<\/strong>[\s\S]*@\{friend\.username\}/);
    assert.match(
      leaderboard,
      /<strong>\{profile\.display_name\}<\/strong>[\s\S]*@\{profile\.username\}/,
    );
    assert.match(recap, /\{stat\.displayName\}[\s\S]*@\{stat\.username\}/);
  });

  it("describes the General preference as identity visibility", () => {
    assert.match(privacyControl, /Show my name on the General leaderboard/);
    assert.match(privacyControl, /identity appears as Anonymous/);
    assert.doesNotMatch(privacyControl, /Show my username/);
  });
});
