import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260924000000_general_leaderboard_privacy.sql",
    import.meta.url,
  ),
  "utf8",
);
const leaderboardPage = readFileSync(
  new URL("../app/leaderboard/page.tsx", import.meta.url),
  "utf8",
);
const socialMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923030000_social_weekly_stats.sql",
    import.meta.url,
  ),
  "utf8",
);

type TestProfile = {
  username: string;
  points: number;
  createdAt: string;
  showUsername: boolean;
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
      username: profile.showUsername ? profile.username : "Anonymous",
      points: profile.points,
    }));
}

describe("General leaderboard username privacy", () => {
  it("defaults existing and new profiles to showing their username", () => {
    assert.match(
      migration,
      /show_username_on_general_leaderboard boolean not null default true/,
    );
  });

  it("masks only opted-out usernames while preserving every rank and score", () => {
    const visible = rankGeneralProfiles([
      {
        username: "alex",
        points: 320,
        createdAt: "2026-01-01",
        showUsername: true,
      },
      {
        username: "quentin",
        points: 290,
        createdAt: "2026-01-02",
        showUsername: false,
      },
      {
        username: "sarah",
        points: 260,
        createdAt: "2026-01-03",
        showUsername: true,
      },
    ]);

    assert.deepEqual(visible, [
      { rank: 1, username: "alex", points: 320 },
      { rank: 2, username: "Anonymous", points: 290 },
      { rank: 3, username: "sarah", points: 260 },
    ]);
    assert.doesNotMatch(JSON.stringify(visible), /quentin/);
  });

  it("anonymizes after rank calculation without filtering opted-out users", () => {
    const functionBody = migration.slice(
      migration.indexOf(
        "create or replace function public.get_global_leaderboard",
      ),
      migration.indexOf(
        "create function public.get_my_general_leaderboard_preference",
      ),
    );

    assert.match(functionBody, /row_number\(\) over/);
    assert.match(
      functionBody,
      /case[\s\S]*show_username_on_general_leaderboard[\s\S]*profile\.username[\s\S]*else 'Anonymous'::text[\s\S]*end/,
    );
    assert.match(functionBody, /profile\.total_points/);
    assert.doesNotMatch(
      functionBody,
      /where\s+profile\.show_username_on_general_leaderboard/,
    );
  });

  it("updates only auth.uid() through authenticated, hardened RPCs", () => {
    assert.match(
      migration,
      /set_general_leaderboard_preference\(p_show_username boolean\)[\s\S]*security definer[\s\S]*set search_path = ''/,
    );
    assert.match(migration, /where profile\.id = v_current_user_id/);
    assert.match(
      migration,
      /revoke all on function public\.set_general_leaderboard_preference\(boolean\)[\s\S]*from public, anon, authenticated/,
    );
    assert.match(
      migration,
      /grant execute on function public\.set_general_leaderboard_preference\(boolean\)[\s\S]*to authenticated/,
    );
  });

  it("leaves friend-scoped usernames and statistics unchanged", () => {
    assert.doesNotMatch(migration, /get_social_weekly_stats/);
    assert.match(socialMigration, /profile\.username as participant_username/);
    assert.match(socialMigration, /participant\.participant_username/);
  });

  it("uses General in the leaderboard UI and keeps legacy links compatible", () => {
    assert.match(leaderboardPage, />\s*General\s*</);
    assert.match(leaderboardPage, /view === "general" \|\| view === "mcgill"/);
    assert.doesNotMatch(leaderboardPage, />\s*McGill\s*</);
  });
});
