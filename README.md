# TapIt

TapIt is a mobile-first social fitness app for university students. Students tap
an NFC tag at a participating gym, check in, earn points, build streaks, and stay
accountable with friends.

This repository contains the TapIt MVP foundation: Supabase authentication,
secure NFC check-ins, friends, leaderboards, and the database migration.

## Stack

- Next.js (App Router)
- TypeScript
- React
- Supabase Auth and PostgreSQL
- Vercel (planned deployment)

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Supabase-backed routes
require valid values in `.env.local`; the public landing page does not.

## Supabase setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, create a new query, paste the entire contents of
   `supabase/migrations/20260923000000_initial_schema.sql`, and run it once.
3. Create another SQL Editor query, paste the entire contents of
   `supabase/migrations/20260923010000_weekly_goals.sql`, and run it once. This
   adds weekly goal history, the completion ledger, goal configuration RPC,
   and the weekly-aware atomic check-in RPC.
4. Run `supabase/migrations/20260923020000_fix_weekly_goal_rpc_ambiguity.sql`
   to apply the corrective weekly-goal RPC definition.
5. Run `supabase/migrations/20260923030000_social_weekly_stats.sql` to add the
   friend-scoped social weekly statistics RPC.
6. Run `supabase/migrations/20260923040000_mutual_friend_requests.sql` to add
   pending mutual friend requests and lock accepted friendship changes behind
   authenticated RPCs.
7. Run `supabase/migrations/20260923050000_location_geofencing.sql` to add
   optional per-location geofences and replace the legacy check-in RPC with the
   location-aware signature.
8. Run
   `supabase/migrations/20260923060000_privacy_hardening_and_account_deletion.sql`
   to replace broad profile/location reads with purpose-specific RPCs and add
   secure self-service account deletion.
9. Run
   `supabase/migrations/20260924000000_general_leaderboard_privacy.sql` to add
   the General leaderboard identity preference and its authenticated RPCs.
10. Run `supabase/migrations/20260924010000_display_names.sql` to add validated
    display names, backfill existing profiles, and update the controlled social
    RPCs and profile identity update boundary.
11. In the project dashboard, copy the Project URL and public `anon` key into a
   local `.env.local` file using `.env.example` as the template.
12. Restart `npm run dev` after changing environment variables.

## Authentication setup

Email/password signup and login are available at `/signup` and `/login`. The
authenticated proof-of-concept dashboard is at `/dashboard`.

For the first small, trusted pilot, email confirmation is intentionally disabled
to reduce onboarding friction:

1. Open the Supabase dashboard.
2. Go to **Authentication > Providers > Email**.
3. Turn off **Confirm email** and save.

With confirmation disabled, signup immediately creates a session and redirects
to the requested safe internal page (or the dashboard). With confirmation
enabled, signup displays a check-email message. For the confirmation flow, add
`http://localhost:3000/**` to the dashboard Redirect URLs and change the
**Confirm signup** email template link to append the verification parameters to
the callback URL supplied by TapIt:

```text
{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email
```

The callback also accepts the PKCE `code` flow. This is a temporary pilot tradeoff:
re-enable confirmation, configure the production Site URL/redirect URLs, and use
reliable custom SMTP before a broader public launch.

## Authenticated app routes

- `/dashboard` — points, check-in count, and latest check-in
- `/friends` — username search, mutual requests, and accepted friends
- `/leaderboard` — friends ranking and the General global ranking
- `/profile` — stats, recent activity, legal links, and account settings
- `/onboarding` — initial weekly training commitment for accounts without one
- `/recap` — previous completed week for the signed-in user and current friends
- `/privacy` and `/terms` — public legal documents

Pending requests are stored separately from accepted friendships. An accepted
friendship requires mutual consent and is stored once as an ordered UUID pair.
The social pages use the authenticated Supabase client and RLS; no service-role
credentials are used.

`get_social_weekly_stats()` exposes only the signed-in user and current friends.
It powers current progress on Friends, best weekly streaks on the Friends
leaderboard, and the previous completed week at `/recap`. Raw check-ins and goal
schedule history remain owner-only under RLS.

Direct authenticated reads of `profiles` and `locations` are revoked by the
privacy-hardening migration. Purpose-specific RPCs return only the profile and
venue fields required by each screen; venue geofence coordinates remain
database-internal. Account deletion is a no-argument authenticated RPC that
deletes only `auth.uid()`, allowing existing foreign-key cascades to remove all
user-owned application rows in the same transaction.

The dashboard and profile derive current streak, longest streak, and active-day
counts from rewarded check-ins. Calendar days and activity timestamps use
`America/Montreal`; no mutable streak counters are stored in the database.

Weekly goals also use Montreal calendar weeks (Monday through Sunday). The
first goal applies to the current week; later changes are scheduled for the
next Monday. Goal history is retained so past weekly results cannot change.
Completing a weekly goal awards `goal × 5` bonus points once, atomically inside
`perform_checkin`.

## NFC location verification

Each location may optionally require browser geolocation. All NFC tags assigned
to that location share its configured latitude, longitude, and allowed radius.
After the user explicitly presses **CHECK IN**, the browser obtains one position
and PostgreSQL validates proximity before awarding anything. Locations without
geofencing do not request browser location.

User coordinates, reported accuracy, and calculated distance are used only for
that RPC call and are not stored or logged. This blocks casual use of a copied
tag URL from a remote location, but it is not proof of an NFC tap and does not
prevent GPS spoofing or a modified device.

Browser geolocation requires a secure context. It works on `localhost`, but a
phone opening a raw HTTP LAN address such as `http://192.168.x.x` may be blocked.
Use a production or other HTTPS URL for real-phone and onsite testing.

## Development-only data

The files in `supabase/seeds/` are manual development helpers. They are not
imported or executed by the application and must not be run against production.

After the initial migration, open
`supabase/seeds/development.sql` in Supabase SQL Editor and run the entire file.
It creates or reuses **McGill Fitness Centre** and creates one active tag only
when that location does not already have one. The final query returns the tag's
token in the private SQL Editor result table.

To simulate an NFC tap locally, copy that token and open:

```text
http://localhost:3000/checkin/<TOKEN>
```

Do not place the token in source code or render a tag directory in the app. A
physical NFC tag will eventually store the equivalent production URL.

For optional local recap testing, replace the three placeholder usernames in
`supabase/seeds/weekly_recap_development.sql`, then run that file in SQL Editor.
It is development-only, requires existing test users and an active NFC tag, and
does not change the production cooldown or application logic.

## Accepted trusted-pilot limitations

- NFC check-in URLs are static bearer URLs and can be copied or shared. Keep tag
  tokens private and rotate or disable a tag if it is exposed. Optional GPS
  verification reduces remote reuse but cannot prevent location spoofing.
- The current automated suite does not run full PostgreSQL/RLS concurrency tests.
- Check-in history and streak queries are intentionally straightforward for the
  pilot's small expected data volume.

The migration creates profiles, locations, NFC tags, check-ins, friendships,
RLS policies, automatic profile creation, and the atomic `perform_checkin` RPC.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe | Supabase public anonymous key; access is constrained by RLS |

Local environment files are ignored by Git. `.env.example` documents the
expected variable names and contains no real secrets.

A Supabase service-role key is deliberately not part of the initial setup. The
MVP enforces check-ins through an authenticated database function; a privileged
key should be added only if a later server-only feature truly needs one.

## Database behavior

- A database trigger creates one profile whenever Supabase Auth creates a user.
  Signup metadata may contain a display name and lowercase `username`; both are
  validated in PostgreSQL, with safe username-derived fallbacks for malformed
  or older clients.
- `perform_checkin(token, latitude, longitude, accuracy)` is the only application
  path that can insert a rewarded check-in or change points. It validates any
  required venue geofence, awards 10 points, atomically adds any newly earned
  weekly bonus, and returns structured reward/progress data.
- The four-hour cooldown applies globally per user, across all locations. A row
  lock on the user's profile serializes simultaneous attempts.
- Pending friend requests are visible only to their requester and recipient.
  Only the recipient can accept or decline, only the requester can cancel, and
  crossing requests become acceptance. Accepted friendships are undirected;
  the smaller UUID is stored as `user_id`, so a pair can exist only once.
- Friend-only weekly statistics are derived exclusively from accepted rows in
  `friendships`; a pending request does not expose weekly activity.
