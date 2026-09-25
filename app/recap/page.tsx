import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TapItMascotSpeech } from "@/components/tapit-mascot-speech";
import { PageHeader } from "@/components/ui";
import { addCalendarDays } from "@/lib/stats/montreal-calendar";
import {
  buildWeeklyRecap,
  getWeeklyRecapMessage,
  mapSocialWeeklyStats,
  type SocialWeeklyStat,
} from "@/lib/stats/social-weekly";
import { createClient } from "@/lib/supabase/server";

function formatWeekRange(weekStart: string) {
  const weekEnd = addCalendarDays(weekStart, 6);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Montreal",
  });
  const start = formatter.format(new Date(`${weekStart}T12:00:00Z`));
  const end = formatter.format(new Date(`${weekEnd}T12:00:00Z`));
  return `${start}–${end}`;
}

function RecapRows({
  stats,
  status,
  userId,
}: {
  stats: SocialWeeklyStat[];
  status: "hit" | "missed";
  userId: string;
}) {
  if (stats.length === 0) {
    return <p className="recap-empty">No one in this group.</p>;
  }

  return (
    <div className="recap-people">
      {stats.map((stat) => (
        <article
          className={`recap-person ${status}${stat.userId === userId ? " current-user" : ""}`}
          key={stat.userId}
        >
          <span className="recap-status-mark" aria-hidden="true">
            {status === "hit" ? "✓" : "●"}
          </span>
          <div>
            <strong>
              {stat.displayName}
              {stat.userId === userId ? <small>You</small> : null}
            </strong>
            <small className="recap-username">@{stat.username}</small>
            <span>
              {stat.previousSessions} / {stat.previousGoal} sessions
            </span>
          </div>
          <strong className="recap-row-points">
            +{stat.previousWeekPoints} pts
          </strong>
        </article>
      ))}
    </div>
  );
}

export default async function RecapPage() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(`/login?next=${encodeURIComponent("/recap")}`);
  }

  const { data, error } = await supabase.rpc("get_social_weekly_stats");
  const stats = mapSocialWeeklyStats(data);
  const currentUser = stats.find((stat) => stat.userId === userId);

  if (!error && currentUser?.currentGoal === null) {
    redirect("/onboarding");
  }

  const recap = buildWeeklyRecap(stats);
  const previousWeek = stats[0]?.previousWeekStart;
  const pointsValue = recap.mostPoints[0]?.previousWeekPoints ?? 0;
  const streakValue = recap.bestStreak[0]?.bestWeeklyGoalStreak ?? 0;
  const hasGoalResults =
    recap.goalsHit.length > 0 || recap.goalsMissed.length > 0;

  return (
    <AppShell className="recap-page">
      <PageHeader
        action={
          <Link className="secondary-button compact" href="/dashboard">
            ← Back home
          </Link>
        }
        description={previousWeek ? formatWeekRange(previousWeek) : "Previous completed week"}
        eyebrow="Last week"
        title="Weekly Recap"
      />

      {error || !currentUser ? (
        <p className="social-error" role="alert">
          We couldn&apos;t load your crew&apos;s recap. Refresh and try again.
        </p>
      ) : (
        <>
          <TapItMascotSpeech
            className="recap-commentary"
            detail={
              hasGoalResults
                ? `${recap.achievedCount} / ${recap.eligibleCount} goals hit`
                : undefined
            }
          >
            {getWeeklyRecapMessage(recap)}
          </TapItMascotSpeech>

          {hasGoalResults ? (
            <>
              <section className="recap-section hit">
                <div className="section-heading">
                  <div>
                    <p className="section-label">Goals hit</p>
                    <h2>Commitments completed</h2>
                  </div>
                </div>
                <RecapRows stats={recap.goalsHit} status="hit" userId={userId} />
              </section>

              <section className="recap-section missed">
                <div className="section-heading">
                  <div>
                    <p className="section-label">Missed</p>
                    <h2>Goals not reached</h2>
                  </div>
                </div>
                <RecapRows
                  stats={recap.goalsMissed}
                  status="missed"
                  userId={userId}
                />
              </section>
            </>
          ) : null}

          <section className="recap-highlights" aria-label="Weekly highlights">
            <article>
              <span>Most points</span>
              <strong>
                {recap.mostPoints.length
                  ? recap.mostPoints
                      .map((stat) => stat.displayName)
                      .join(", ")
                  : "No result"}
              </strong>
              <small>
                {recap.mostPoints.length ? `+${pointsValue} pts` : "—"}
              </small>
            </article>
            <article>
              <span>Best weekly streak</span>
              <strong>
                {recap.bestStreak.length
                  ? recap.bestStreak
                      .map((stat) => stat.displayName)
                      .join(", ")
                  : "No result"}
              </strong>
              <small>
                {recap.bestStreak.length
                  ? `${streakValue} ${streakValue === 1 ? "week" : "weeks"}`
                  : "—"}
              </small>
            </article>
          </section>

        </>
      )}

    </AppShell>
  );
}
