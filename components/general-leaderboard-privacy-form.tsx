"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  updateGeneralLeaderboardPreference,
  type GeneralLeaderboardPreferenceState,
} from "@/app/profile/actions";
import styles from "./general-leaderboard-privacy-form.module.css";

const initialState: GeneralLeaderboardPreferenceState = {
  status: "idle",
  message: "",
};

export function GeneralLeaderboardPrivacyForm({
  initialValue,
  compact = false,
}: {
  initialValue: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [showUsername, setShowUsername] = useState(initialValue);
  const previousValue = useRef(initialValue);
  const [state, submitPreference, pending] = useActionState(
    updateGeneralLeaderboardPreference,
    initialState,
  );

  useEffect(() => {
    if (state.status === "error") {
      setShowUsername(previousValue.current);
    } else if (
      state.status === "success" &&
      typeof state.showUsername === "boolean"
    ) {
      previousValue.current = state.showUsername;
      setShowUsername(state.showUsername);
      router.refresh();
    }
  }, [router, state]);

  function handleChange(nextValue: boolean) {
    if (pending) return;

    previousValue.current = showUsername;
    setShowUsername(nextValue);

    const formData = new FormData();
    formData.set("visibility", String(nextValue));
    startTransition(() => submitPreference(formData));
  }

  return (
    <div className={`${styles.form} ${compact ? styles.compact : ""}`.trim()}>
      <div className={styles.copy}>
        <h3>
          {compact
            ? "Show my username"
            : "Show my username on the General leaderboard"}
        </h3>
        {!compact ? (
          <p>
            When disabled, your points and ranking remain visible, but your
            username appears as Anonymous.
          </p>
        ) : null}
      </div>
      <div className={styles.controls}>
        <label className={styles.switch}>
          <span className="sr-only">Show my username</span>
          <input
            checked={showUsername}
            disabled={pending}
            onChange={(event) => handleChange(event.target.checked)}
            type="checkbox"
          />
          <span className={styles.track} aria-hidden="true" />
        </label>
      </div>
      {pending || state.message ? (
        <p
          className={`${styles.message} ${pending ? "" : styles[state.status]}`.trim()}
          aria-live="polite"
          role={!pending && state.status === "error" ? "alert" : "status"}
        >
          {pending ? "Saving…" : state.message}
        </p>
      ) : null}
    </div>
  );
}
