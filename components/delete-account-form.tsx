"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  deleteAccount,
  type DeleteAccountState,
} from "@/app/profile/actions";

const initialState: DeleteAccountState = { status: "idle", message: "" };

function DeleteButton({ confirmed }: { confirmed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="delete-account-button"
      disabled={!confirmed || pending}
      type="submit"
    >
      {pending ? "Deleting account…" : "Permanently delete account"}
    </button>
  );
}

export function DeleteAccountForm() {
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction] = useActionState(deleteAccount, initialState);

  return (
    <form className="delete-account-form" action={formAction}>
      <label htmlFor="delete-confirmation">
        Type <strong>DELETE</strong> to confirm
      </label>
      <input
        autoCapitalize="characters"
        autoComplete="off"
        id="delete-confirmation"
        name="confirmation"
        onChange={(event) => setConfirmation(event.target.value)}
        spellCheck={false}
        type="text"
        value={confirmation}
      />
      {state.message ? (
        <p className="form-message error" role="alert">
          {state.message}
        </p>
      ) : null}
      <DeleteButton confirmed={confirmation === "DELETE"} />
    </form>
  );
}
