import { redirect } from "next/navigation";
import { CheckinPanel } from "./checkin-panel";
import { TapItWordmark } from "@/components/tapit-wordmark";
import { getOnboardingPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

type CheckinPageProps = {
  params: Promise<{ token: string }>;
};

type CheckinContextRow = {
  status: "valid" | "invalid_tag";
  location_name: string | null;
  requires_location_verification: boolean;
};

export default async function CheckinPage({ params }: CheckinPageProps) {
  const { token } = await params;
  const checkinPath = `/checkin/${encodeURIComponent(token)}`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect(`/login?next=${encodeURIComponent(checkinPath)}`);
  }

  const { data: configuredGoal, error: goalError } = await supabase
    .from("weekly_goal_schedules")
    .select("effective_week")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!goalError && !configuredGoal) {
    redirect(getOnboardingPath(checkinPath));
  }

  let contextStatus: "valid" | "invalid_tag" | "error" = "error";
  let locationName: string | undefined;
  let requiresLocationVerification = false;

  if (token && token.length <= 256) {
    const { data: contextData, error: contextError } = await supabase.rpc(
      "get_checkin_context",
      { p_token: token },
    );
    const context = (Array.isArray(contextData)
      ? contextData[0]
      : contextData) as CheckinContextRow | null;

    if (!contextError && context?.status === "valid") {
      contextStatus = "valid";
      locationName = context.location_name ?? "TapIt location";
      requiresLocationVerification =
        context.requires_location_verification === true;
    } else if (!contextError && context?.status === "invalid_tag") {
      contextStatus = "invalid_tag";
    }
  } else {
    contextStatus = "invalid_tag";
  }

  return (
    <main className="checkin-shell">
      <TapItWordmark className="checkin-brand" />
      <CheckinPanel
        contextStatus={contextStatus}
        locationName={locationName}
        requiresLocationVerification={requiresLocationVerification}
        token={token}
      />
    </main>
  );
}
