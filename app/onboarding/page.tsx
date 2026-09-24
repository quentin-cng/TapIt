import { redirect } from "next/navigation";
import { WeeklyGoalForm } from "@/components/weekly-goal-form";
import { TapItWordmark } from "@/components/tapit-wordmark";
import { getSafeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

type OnboardingPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const { next: requestedNext } = await searchParams;
  const next = getSafeNextPath(requestedNext);
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect(`/login?next=${encodeURIComponent("/onboarding")}`);
  }

  const { data: existingGoal, error: goalError } = await supabase
    .from("weekly_goal_schedules")
    .select("effective_week")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingGoal) {
    redirect(next);
  }

  return (
    <main className="onboarding-shell">
      <TapItWordmark />
      <section className="onboarding-card">
        <p className="kicker">Set your commitment</p>
        <h1>Set your weekly commitment.</h1>
        <h2>How many times do you want to train each week?</h2>
        <p>
          Complete your commitment to earn bonus points and build a weekly goal
          streak. You can change next week&apos;s goal later from Profile.
        </p>
        {goalError ? (
          <p className="form-message error" role="alert">
            Weekly goals are unavailable. Confirm the latest Supabase migration
            has been run, then refresh.
          </p>
        ) : (
          <WeeklyGoalForm mode="onboarding" next={next} />
        )}
      </section>
    </main>
  );
}
