import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260923020000_fix_weekly_goal_rpc_ambiguity.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("weekly goal RPC corrective migration", () => {
  it("uses the named primary-key constraint instead of an ambiguous column list", () => {
    assert.match(
      migration,
      /on conflict on constraint weekly_goal_schedules_pkey do update/,
    );
    assert.doesNotMatch(migration, /on conflict \(user_id, effective_week\)/);
  });

  it("retains authenticated-only execution", () => {
    assert.match(
      migration,
      /revoke all on function public\.configure_weekly_goal\(integer\)[\s\S]*from public, anon;/,
    );
    assert.match(
      migration,
      /grant execute on function public\.configure_weekly_goal\(integer\)[\s\S]*to authenticated;/,
    );
  });
});
