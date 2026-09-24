"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateGeneralLeaderboardPreference,
  type GeneralLeaderboardPreferenceState,
} from "@/app/profile/actions";
import styles from "./general-leaderboard-privacy-form.module.css";

const initialState: GeneralLeaderboardPreferenceState = {
  status: "idle",
  message: "",
};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.saveButton} disabled={pending} type="submit">
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function GeneralLeaderboardPrivacyForm({
  initialValue,
}: {
  initialValue: boolean;
}) {
  const [showUsername, setShowUsername] = useState(initialValue);
  const [state, formAction] = useActionState(
    updateGeneralLeaderboardPreference,
    initialState,
  );

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.copy}>
        <h3>Show my username on the General leaderboard</h3>
        <p>
          When disabled, your points and ranking remain visible, but your
          username appears as Anonymous.
        </p>
      </div>
      <div className={styles.controls}>
        <label className={styles.switch}>
          <span className="sr-only">Show my username</span>
          <input
            checked={showUsername}
            onChange={(event) => setShowUsername(event.target.checked)}
            type="checkbox"
          />
          <span className={styles.track} aria-hidden="true" />
        </label>
        <input
          name="visibility"
          type="hidden"
          value={showUsername ? "true" : "false"}
        />
        <SaveButton />
      </div>
      {state.message ? (
        <p
          className={`${styles.message} ${styles[state.status]}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
