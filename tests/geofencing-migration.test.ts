import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/20260923050000_location_geofencing.sql",
    import.meta.url,
  ),
  "utf8",
);
const checkinPanel = readFileSync(
  new URL("../app/checkin/[token]/checkin-panel.tsx", import.meta.url),
  "utf8",
);

const contextStart = migration.indexOf(
  "create function public.get_checkin_context",
);
const contextEnd = migration.indexOf(
  "revoke all on function public.get_checkin_context",
);
const contextDefinition = migration.slice(contextStart, contextEnd);

function geofenceAccepts(distance: number, radius: number, accuracy: number) {
  return accuracy >= 0 && accuracy <= 150 && distance <= radius + Math.min(accuracy, 75);
}

describe("location geofencing database boundary", () => {
  it("adds complete optional geofence configuration with bounded values", () => {
    assert.match(migration, /add column latitude double precision/);
    assert.match(migration, /add column longitude double precision/);
    assert.match(migration, /add column checkin_radius_meters integer/);
    assert.match(
      migration,
      /add column requires_location_verification boolean not null default false/,
    );
    assert.match(migration, /latitude between -90 and 90/);
    assert.match(migration, /longitude between -180 and 180/);
    assert.match(
      migration,
      /checkin_radius_meters between 25 and 1000/,
    );
    assert.match(
      migration,
      /latitude is null[\s\S]*longitude is null[\s\S]*checkin_radius_meters is null[\s\S]*requires_location_verification = false[\s\S]*or[\s\S]*latitude is not null[\s\S]*longitude is not null[\s\S]*checkin_radius_meters is not null/,
    );
  });

  it("keeps check-in context authenticated and non-sensitive", () => {
    assert.match(contextDefinition, /v_current_user_id uuid := auth\.uid\(\)/);
    assert.match(contextDefinition, /security definer[\s\S]*set search_path = ''/);
    assert.match(contextDefinition, /tag\.is_active = true/);
    assert.match(
      contextDefinition,
      /status text,[\s\S]*location_name text,[\s\S]*requires_location_verification boolean/,
    );
    assert.doesNotMatch(contextDefinition, /location\.latitude/);
    assert.doesNotMatch(contextDefinition, /location\.longitude/);
    assert.doesNotMatch(contextDefinition, /checkin_radius_meters/);
    assert.doesNotMatch(contextDefinition, /tag\.id/);
    assert.match(
      migration,
      /revoke all on function public\.get_checkin_context\(text\) from public, anon;[\s\S]*grant execute on function public\.get_checkin_context\(text\) to authenticated;/,
    );
  });

  it("removes the old awarding signature and grants only the four-argument RPC", () => {
    assert.match(migration, /drop function public\.perform_checkin\(text\);/);
    assert.match(
      migration,
      /create function public\.perform_checkin\([\s\S]*p_token text,[\s\S]*p_latitude double precision,[\s\S]*p_longitude double precision,[\s\S]*p_accuracy_meters double precision/,
    );
    assert.doesNotMatch(
      migration,
      /create (?:or replace )?function public\.perform_checkin\(p_token text\)/,
    );
    assert.match(
      migration,
      /revoke all on function public\.perform_checkin\([\s\S]*\) from public, anon;[\s\S]*grant execute on function public\.perform_checkin\([\s\S]*\) to authenticated;/,
    );
  });

  it("validates required, finite, ranged, and sufficiently accurate positions", () => {
    assert.match(migration, /if matched_requires_location then/);
    assert.match(
      migration,
      /p_latitude is null[\s\S]*p_longitude is null[\s\S]*p_accuracy_meters is null[\s\S]*'location_required'/,
    );
    assert.match(migration, /'NaN'::double precision/);
    assert.match(migration, /'Infinity'::double precision/);
    assert.match(migration, /p_latitude < -90[\s\S]*p_latitude > 90/);
    assert.match(migration, /p_longitude < -180[\s\S]*p_longitude > 180/);
    assert.match(migration, /p_accuracy_meters < 0/);
    assert.match(
      migration,
      /p_accuracy_meters > 150[\s\S]*'location_too_inaccurate'/,
    );
  });

  it("uses the approved Haversine and capped-accuracy boundary", () => {
    assert.match(migration, /2 \* 6371000/);
    assert.match(migration, /least\([\s\S]*1\.0,[\s\S]*greatest\(0\.0, haversine_intermediate\)/);
    assert.match(
      migration,
      /accuracy_allowance_meters := least\(p_accuracy_meters, 75\.0\)/,
    );
    assert.match(
      migration,
      /distance_meters[\s\S]*> matched_radius_meters \+ accuracy_allowance_meters[\s\S]*'outside_geofence'/,
    );

    assert.equal(geofenceAccepts(80, 100, 30), true);
    assert.equal(geofenceAccepts(100, 100, 0), true);
    assert.equal(geofenceAccepts(175, 100, 100), true);
    assert.equal(geofenceAccepts(175.01, 100, 100), false);
    assert.equal(geofenceAccepts(50, 100, 150.01), false);
    assert.equal(geofenceAccepts(50, 100, -1), false);
  });

  it("does not consume rewards or cooldown before geofence validation succeeds", () => {
    const geofenceStart = migration.indexOf("if matched_requires_location then");
    const profileLock = migration.indexOf("select profile.total_points");
    const checkinInsert = migration.indexOf("insert into public.checkins");
    const pointsUpdate = migration.indexOf("update public.profiles");

    assert.ok(geofenceStart > -1);
    assert.ok(profileLock > geofenceStart);
    assert.ok(checkinInsert > profileLock);
    assert.ok(pointsUpdate > checkinInsert);
  });

  it("preserves global cooldown and exactly-once weekly bonuses", () => {
    assert.match(
      migration,
      /from public\.checkins as checkin[\s\S]*where checkin\.user_id = current_user_id[\s\S]*order by checkin\.created_at desc/,
    );
    assert.doesNotMatch(
      migration,
      /where checkin\.user_id = current_user_id\s+and checkin\.location_id/,
    );
    assert.match(migration, /interval '4 hours'/);
    assert.match(
      migration,
      /on conflict on constraint weekly_goal_completions_pkey do nothing/,
    );
  });

  it("resolves every tag through its location and permits null GPS when disabled", () => {
    assert.match(
      migration,
      /from public\.nfc_tags as tag[\s\S]*join public\.locations as location on location\.id = tag\.location_id/,
    );
    assert.match(migration, /tag\.is_active = true/);
    assert.match(
      migration,
      /if matched_requires_location then[\s\S]*end if;[\s\S]*select profile\.total_points/,
    );
    assert.match(migration, /'invalid_tag'::text/);
  });
});

describe("browser geolocation flow", () => {
  it("requests a one-shot high-accuracy position only after form submission", () => {
    assert.match(checkinPanel, /function handleSubmit/);
    assert.match(checkinPanel, /navigator\.geolocation\.getCurrentPosition/);
    assert.match(checkinPanel, /enableHighAccuracy: true/);
    assert.match(checkinPanel, /timeout: 12_000/);
    assert.match(checkinPanel, /maximumAge: 15_000/);
    assert.doesNotMatch(checkinPanel, /watchPosition/);
  });

  it("does not submit coordinates through a URL or persist them", () => {
    assert.match(checkinPanel, /new FormData\(form\)/);
    assert.doesNotMatch(checkinPanel, /localStorage|sessionStorage|URLSearchParams/);
  });
});
