"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateProfileIdentity,
  type ProfileIdentityState,
} from "@/app/profile/actions";
import styles from "./profile-identity-form.module.css";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.button} disabled={pending} type="submit">
      {pending ? "Saving…" : "Save profile"}
    </button>
  );
}

export function ProfileIdentityForm({
  displayName,
  username,
}: {
  displayName: string;
  username: string;
}) {
  const initialState: ProfileIdentityState = {
    status: "idle",
    message: "",
    values: { displayName, username },
  };
  const [state, formAction] = useActionState(
    updateProfileIdentity,
    initialState,
  );

  return (
    <form className={styles.form} action={formAction} noValidate>
      <div className={styles.copy}>
        <h3>Profile identity</h3>
        <p>Your display name is what people see. Your username stays unique.</p>
      </div>
      <div className={styles.fields}>
        <label>
          <span>Display name</span>
          <input
            autoComplete="name"
            defaultValue={state.values?.displayName ?? displayName}
            maxLength={30}
            name="display_name"
            required
            type="text"
          />
        </label>
        <label>
          <span>Username</span>
          <div className={styles.usernameField}>
            <span aria-hidden="true">@</span>
            <input
              autoCapitalize="none"
              autoComplete="username"
              defaultValue={state.values?.username ?? username}
              maxLength={30}
              minLength={3}
              name="username"
              pattern="[a-z0-9_]{3,30}"
              required
              spellCheck={false}
              type="text"
            />
          </div>
        </label>
        <SaveButton />
        {state.message ? (
          <p
            className={`${styles.message} ${styles[state.status]}`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
