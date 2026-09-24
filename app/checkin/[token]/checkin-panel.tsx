"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { ProgressBar } from "@/components/ui";
import { performCheckin, type CheckinActionState } from "./actions";

const initialState: CheckinActionState = { status: "idle" };

type LocationIssue =
  | "permission_denied"
  | "unsupported"
  | "insecure_context"
  | "timeout"
  | "position_unavailable";

type CheckinPanelProps = {
  contextStatus: "valid" | "invalid_tag" | "error";
  locationName?: string;
  requiresLocationVerification: boolean;
  token: string;
};

const locationIssueMessages: Record<LocationIssue, string> = {
  permission_denied:
    "Location access is required here. Enable it for TapIt and try again.",
  unsupported:
    "This browser can’t provide your location. Try Safari or Chrome on your phone.",
  insecure_context:
    "Location verification requires a secure HTTPS connection.",
  timeout:
    "We couldn’t get your location in time. Move near an entrance or window and try again.",
  position_unavailable:
    "Your phone couldn’t determine its location. Check location services and try again.",
};

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function createSuccessAudioContext() {
  try {
    const audioWindow = window as AudioWindow;
    const AudioContextConstructor =
      (typeof AudioContext !== "undefined" ? AudioContext : undefined) ??
      audioWindow.webkitAudioContext;

    return AudioContextConstructor ? new AudioContextConstructor() : null;
  } catch {
    return null;
  }
}

function playTone(
  context: AudioContext,
  frequency: number,
  startsAt: number,
  duration: number,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  oscillator.frequency.exponentialRampToValueAtTime(
    frequency * 1.08,
    startsAt + duration,
  );
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration);
}

function playSuccessSound(context: AudioContext | null) {
  if (!context || context.state === "closed") return;

  const play = () => {
    try {
      const now = context.currentTime;
      playTone(context, 660, now, 0.1, 0.045);
      playTone(context, 880, now + 0.055, 0.11, 0.035);
    } catch {
      // Feedback is optional and must never interrupt a rewarded check-in.
    }
  };

  if (context.state === "running") {
    play();
    return;
  }

  void context.resume().then(play).catch(() => undefined);
}

function formatRemainingTime(nextEligibleAt?: string) {
  if (!nextEligibleAt) return "a little while";

  const remainingMilliseconds = Math.max(
    0,
    new Date(nextEligibleAt).getTime() - Date.now(),
  );
  const totalMinutes = Math.ceil(remainingMilliseconds / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function CheckinButton({
  pending,
  verifyingLocation,
}: {
  pending: boolean;
  verifyingLocation: boolean;
}) {
  return (
    <button className="checkin-button" type="submit" disabled={pending}>
      {verifyingLocation
        ? "VERIFYING LOCATION…"
        : pending
          ? "CHECKING IN…"
          : "CHECK IN"}
    </button>
  );
}

function LocationFailure({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <section className="checkin-card" aria-live="polite">
      <p className="checkin-label">Location not verified</p>
      <h1>{title}</h1>
      <p>{message}</p>
      <button
        className="checkin-button"
        type="button"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
      <Link className="checkin-secondary-button" href="/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}

export function CheckinPanel({
  contextStatus,
  locationName,
  requiresLocationVerification,
  token,
}: CheckinPanelProps) {
  const action = performCheckin.bind(null, token);
  const [state, formAction, actionPending] = useActionState(
    action,
    initialState,
  );
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [locationIssue, setLocationIssue] = useState<LocationIssue | null>(null);
  const submissionInFlight = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const feedbackKeyRef = useRef<string | null>(null);
  const pending = verifyingLocation || actionPending;

  useEffect(() => {
    if (!actionPending && state.status !== "idle") {
      submissionInFlight.current = false;
    }
  }, [actionPending, state.status]);

  useEffect(() => {
    if (state.status !== "success" || (state.pointsAwarded ?? 0) <= 0) return;

    const feedbackKey =
      state.checkedInAt ?? `${state.totalPoints}-${state.pointsAwarded}`;

    if (feedbackKeyRef.current === feedbackKey) return;
    feedbackKeyRef.current = feedbackKey;

    try {
      if (typeof navigator.vibrate === "function") navigator.vibrate(60);
    } catch {
      // Vibration is optional and unsupported on some browsers, including iOS.
    }

    playSuccessSound(audioContextRef.current);
  }, [
    state.checkedInAt,
    state.pointsAwarded,
    state.status,
    state.totalPoints,
  ]);

  function submitVerifiedPosition(form: HTMLFormElement) {
    setLocationIssue(null);
    setVerifyingLocation(true);

    if (!window.isSecureContext) {
      submissionInFlight.current = false;
      setVerifyingLocation(false);
      setLocationIssue("insecure_context");
      return;
    }

    if (!("geolocation" in navigator)) {
      submissionInFlight.current = false;
      setVerifyingLocation(false);
      setLocationIssue("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const formData = new FormData(form);
        formData.set("latitude", String(position.coords.latitude));
        formData.set("longitude", String(position.coords.longitude));
        formData.set("accuracy", String(position.coords.accuracy));
        setVerifyingLocation(false);
        startTransition(() => formAction(formData));
      },
      (error) => {
        submissionInFlight.current = false;
        setVerifyingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          setLocationIssue("permission_denied");
        } else if (error.code === error.TIMEOUT) {
          setLocationIssue("timeout");
        } else {
          setLocationIssue("position_unavailable");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 15_000,
      },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (submissionInFlight.current || pending) {
      event.preventDefault();
      return;
    }

    submissionInFlight.current = true;

    // Create/resume audio during the explicit CHECK IN gesture. The context is
    // silent here; the tone plays only after the server confirms a reward.
    audioContextRef.current ??= createSuccessAudioContext();
    if (audioContextRef.current?.state === "suspended") {
      void audioContextRef.current.resume().catch(() => undefined);
    }

    if (!requiresLocationVerification) return;

    event.preventDefault();
    submitVerifiedPosition(event.currentTarget);
  }

  if (contextStatus === "invalid_tag" || state.status === "invalid_tag") {
    return (
      <section className="checkin-card" aria-live="polite">
        <p className="checkin-label">Tag unavailable</p>
        <h1>This TapIt tag is invalid or disabled.</h1>
        <p>Try another tag or ask the gym staff for help.</p>
        <Link className="checkin-secondary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (contextStatus === "error") {
    return (
      <section className="checkin-card" aria-live="polite">
        <p className="checkin-label">Check-in unavailable</p>
        <h1>We couldn’t load this TapIt tag.</h1>
        <p>Check your connection and try opening the tag again.</p>
        <Link className="checkin-secondary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (state.status === "success") {
    const completedWeeklyGoal = Boolean(state.weeklyGoalCompleted);
    const totalEarned = state.totalPointsEarned ?? state.pointsAwarded;

    return (
      <section
        className={`checkin-card checkin-success${completedWeeklyGoal ? " weekly-goal-success" : ""}`}
        aria-live="polite"
      >
        <div className="success-mark" aria-hidden="true">
          ✓
        </div>
        <p className="checkin-label">
          {completedWeeklyGoal ? "Weekly goal complete" : "Checked in"}
        </p>
        <h1>{state.locationName}</h1>
        {state.weeklyGoal && state.weeklySessions !== undefined ? (
          <div className="checkin-progress-block">
            <p className="checkin-weekly-progress">
              {state.weeklySessions} / {state.weeklyGoal} sessions this week
            </p>
            <ProgressBar
              label={`${state.weeklySessions} of ${state.weeklyGoal} weekly sessions completed`}
              max={state.weeklyGoal}
              value={state.weeklySessions}
            />
          </div>
        ) : null}
        {completedWeeklyGoal ? (
          <div className="reward-breakdown">
            <span>
              Check-in <strong>+{state.pointsAwarded}</strong>
            </span>
            <span>
              Weekly bonus <strong>+{state.weeklyBonusPoints}</strong>
            </span>
          </div>
        ) : null}
        <strong className="points-earned">+{totalEarned}</strong>
        <span className="points-earned-label">
          {completedWeeklyGoal ? "points earned" : "points"}
        </span>
        <p className="points-total">Total: {state.totalPoints} points</p>
        <Link className="checkin-secondary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (state.status === "cooldown") {
    return (
      <section className="checkin-card checkin-cooldown" aria-live="polite">
        <p className="checkin-label">Already checked in</p>
        <h1>You&apos;re still in your cooldown.</h1>
        <p className="cooldown-location">Location: {state.locationName}</p>
        {state.weeklyGoal && state.weeklySessions !== undefined ? (
          <p className="cooldown-progress">
            This week: {state.weeklySessions} / {state.weeklyGoal} sessions
          </p>
        ) : null}
        <div className="countdown-card">
          <span>Next check-in available in</span>
          <strong>{formatRemainingTime(state.nextEligibleAt)}</strong>
        </div>
        <Link className="checkin-secondary-button" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  if (state.status === "location_too_inaccurate") {
    return (
      <LocationFailure
        title="Your location isn’t accurate enough."
        message="Move closer to the gym entrance or a window, then open the tag and try again."
      />
    );
  }

  if (state.status === "outside_geofence") {
    return (
      <LocationFailure
        title="You need to be at this TapIt location."
        message="Move closer to the gym and try the NFC tag again."
      />
    );
  }

  if (
    state.status === "location_required" ||
    state.status === "invalid_location"
  ) {
    return (
      <LocationFailure
        title="We couldn’t verify your location."
        message="Check location access on your phone, then open the tag and try again."
      />
    );
  }

  return (
    <section className="checkin-card" aria-live="polite">
      <p className="checkin-label">TapIt check-in</p>
      <h1>{locationName ?? "Ready to show up?"}</h1>
      <p>
        {requiresLocationVerification
          ? "We’ll verify that you’re at the gym after you press the button."
          : "Confirm your visit below. Points are awarded only after you press the button."}
      </p>
      <div className="checkin-reward-preview">
        <span>Valid check-in reward</span>
        <strong>+10 points</strong>
      </div>
      {locationIssue ? (
        <p className="form-message error" role="alert">
          {locationIssueMessages[locationIssue]}
        </p>
      ) : null}
      {state.status === "error" ? (
        <p className="form-message error" role="alert">
          Something went wrong. Please try again.
        </p>
      ) : null}
      <form action={formAction} onSubmit={handleSubmit}>
        <CheckinButton
          pending={pending}
          verifyingLocation={verifyingLocation}
        />
      </form>
      <Link className="quiet-link" href="/dashboard">
        Cancel and return to dashboard
      </Link>
    </section>
  );
}
