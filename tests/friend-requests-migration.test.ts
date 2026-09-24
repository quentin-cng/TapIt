import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const requestMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923040000_mutual_friend_requests.sql",
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
const socialMigration = readFileSync(
  new URL(
    "../supabase/migrations/20260923030000_social_weekly_stats.sql",
    import.meta.url,
  ),
  "utf8",
);

describe("mutual friend request database boundary", () => {
  it("stores directed pending requests separately from accepted friendships", () => {
    assert.match(requestMigration, /create table public\.friend_requests/);
    assert.match(
      requestMigration,
      /requester_id uuid not null references public\.profiles/,
    );
    assert.match(
      requestMigration,
      /recipient_id uuid not null references public\.profiles/,
    );
    assert.match(
      requestMigration,
      /check \(requester_id <> recipient_id\)/,
    );
    assert.match(
      requestMigration,
      /create unique index friend_requests_pair_unique_idx[\s\S]*least\(requester_id, recipient_id\)[\s\S]*greatest\(requester_id, recipient_id\)/,
    );
  });

  it("lets only participants read a pending request and permits no direct writes", () => {
    assert.match(
      requestMigration,
      /alter table public\.friend_requests enable row level security/,
    );
    assert.match(
      requestMigration,
      /grant select on table public\.friend_requests to authenticated/,
    );
    assert.match(
      requestMigration,
      /using \(\(select auth\.uid\(\)\) in \(requester_id, recipient_id\)\)/,
    );
    assert.doesNotMatch(
      requestMigration,
      /grant (?:insert|update|delete)[^;]*friend_requests/,
    );
  });

  it("closes the old direct accepted-friendship write path", () => {
    assert.match(
      requestMigration,
      /revoke insert, delete on table public\.friendships from authenticated/,
    );
    assert.match(
      requestMigration,
      /drop policy if exists "Users can create their own friendships"/,
    );
    assert.match(
      requestMigration,
      /drop policy if exists "Users can remove their own friendships"/,
    );
  });

  it("sends once and turns a crossing request into atomic acceptance", () => {
    assert.match(
      requestMigration,
      /function public\.send_friend_request\(p_recipient_id uuid\)/,
    );
    assert.match(
      requestMigration,
      /p_recipient_id is null or p_recipient_id = v_current_user_id/,
    );
    assert.match(
      requestMigration,
      /if v_request\.requester_id = v_current_user_id then[\s\S]*return 'requested'/,
    );
    assert.match(
      requestMigration,
      /insert into public\.friendships[\s\S]*delete from public\.friend_requests[\s\S]*return 'accepted'/,
    );
    assert.match(
      requestMigration,
      /insert into public\.friend_requests \(requester_id, recipient_id\)[\s\S]*values \(v_current_user_id, p_recipient_id\)/,
    );
  });

  it("allows only the recipient to accept or decline", () => {
    assert.match(
      requestMigration,
      /function public\.accept_friend_request\(p_request_id uuid\)[\s\S]*v_request\.recipient_id <> v_current_user_id[\s\S]*insert into public\.friendships/,
    );
    assert.match(
      requestMigration,
      /function public\.decline_friend_request\(p_request_id uuid\)[\s\S]*v_request\.recipient_id <> v_current_user_id[\s\S]*request\.recipient_id = v_current_user_id/,
    );
  });

  it("allows only the requester to cancel and either accepted participant to remove", () => {
    assert.match(
      requestMigration,
      /function public\.cancel_friend_request\(p_request_id uuid\)[\s\S]*v_request\.requester_id <> v_current_user_id[\s\S]*request\.requester_id = v_current_user_id/,
    );
    assert.match(
      requestMigration,
      /function public\.remove_friend\(p_friend_id uuid\)[\s\S]*least\(v_current_user_id, p_friend_id\)[\s\S]*greatest\(v_current_user_id, p_friend_id\)[\s\S]*delete from public\.friendships/,
    );
  });

  it("serializes pair transitions and preserves duplicate protection", () => {
    const advisoryLockCount = (
      requestMigration.match(/pg_advisory_xact_lock/g) ?? []
    ).length;
    assert.equal(advisoryLockCount, 5);
    assert.match(
      initialMigration,
      /primary key \(user_id, friend_id\)/,
    );
    assert.match(
      initialMigration,
      /check \(user_id < friend_id\)/,
    );
  });

  it("exposes every transition only to authenticated callers", () => {
    for (const functionName of [
      "send_friend_request",
      "accept_friend_request",
      "decline_friend_request",
      "cancel_friend_request",
      "remove_friend",
    ]) {
      assert.match(
        requestMigration,
        new RegExp(
          `function public\\.${functionName}\\([^)]*\\)[\\s\\S]*security definer[\\s\\S]*set search_path = ''`,
        ),
      );
      assert.match(
        requestMigration,
        new RegExp(
          `revoke all on function public\\.${functionName}\\([^)]*\\) from public, anon`,
        ),
      );
      assert.match(
        requestMigration,
        new RegExp(
          `grant execute on function public\\.${functionName}\\([^)]*\\) to authenticated`,
        ),
      );
    }
  });

  it("keeps pending requests outside friend-only social statistics", () => {
    assert.match(socialMigration, /from public\.friendships as friendship/);
    assert.doesNotMatch(socialMigration, /friend_requests/);
    assert.doesNotMatch(requestMigration, /get_social_weekly_stats/);
  });
});
