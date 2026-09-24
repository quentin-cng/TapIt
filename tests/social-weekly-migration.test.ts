import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260923030000_social_weekly_stats.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("social weekly stats database boundary", () => {
  it("accepts no target user ID and derives participants from friendships", () => {
    assert.match(
      migration,
      /function public\.get_social_weekly_stats\(\)/,
    );
    assert.match(
      migration,
      /from public\.friendships as friendship[\s\S]*friendship\.user_id = v_current_user_id[\s\S]*friendship\.friend_id = v_current_user_id/,
    );
  });

  it("allows only authenticated callers", () => {
    assert.match(
      migration,
      /revoke all on function public\.get_social_weekly_stats\(\)[\s\S]*from public, anon;/,
    );
    assert.match(
      migration,
      /grant execute on function public\.get_social_weekly_stats\(\)[\s\S]*to authenticated;/,
    );
  });

  it("counts every rewarded check-in without filtering by location", () => {
    assert.match(migration, /from public\.checkins as checkin/);
    assert.match(migration, /checkin\.points_awarded > 0/);
    assert.doesNotMatch(migration, /checkin\.location_id\s*=/);
  });

  it("adds dated check-in points and the weekly completion bonus", () => {
    assert.match(migration, /sum\(checkin\.points_awarded\)/);
    assert.match(migration, /sum\(completion\.bonus_points\)/);
    assert.match(
      migration,
      /previous_sessions\.checkin_points[\s\S]*\+ previous_bonus\.bonus_points/,
    );
  });
});
