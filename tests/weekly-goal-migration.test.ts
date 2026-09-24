import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260923010000_weekly_goals.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("weekly reward database guarantees", () => {
  it("uses one durable completion row per user and week", () => {
    assert.match(
      migration,
      /create table public\.weekly_goal_completions[\s\S]*primary key \(user_id, week_start\)/,
    );
    assert.match(
      migration,
      /insert into public\.weekly_goal_completions[\s\S]*on conflict \(user_id, week_start\) do nothing[\s\S]*returning bonus_points/,
    );
  });

  it("serializes check-ins before testing and awarding the bonus", () => {
    assert.match(
      migration,
      /from public\.profiles as profile[\s\S]*for update;[\s\S]*insert into public\.checkins[\s\S]*insert into public\.weekly_goal_completions/,
    );
  });

  it("keeps bonus insertion and point increment in one transaction", () => {
    assert.match(migration, /^begin;[\s\S]*commit;\s*$/m);
    assert.match(
      migration,
      /points_earned_this_checkin := 10 \+ awarded_weekly_bonus;[\s\S]*update public\.profiles/,
    );
  });
});
