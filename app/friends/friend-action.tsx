"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
  type FriendshipActionState,
} from "./actions";

const initialState: FriendshipActionState = {
  status: "idle",
  message: "",
};

type FriendActionProps = {
  mode: "send" | "cancel" | "accept" | "decline" | "remove";
  entityId: string;
};

const actions = {
  send: sendFriendRequest,
  cancel: cancelFriendRequest,
  accept: acceptFriendRequest,
  decline: declineFriendRequest,
  remove: removeFriend,
};

const labels = {
  send: "Add friend",
  cancel: "Cancel",
  accept: "Accept",
  decline: "Decline",
  remove: "Remove",
};

function ActionButton({ mode }: { mode: FriendActionProps["mode"] }) {
  const { pending } = useFormStatus();
  const isPrimary = mode === "send" || mode === "accept";

  return (
    <button
      className={isPrimary ? "friend-add-button" : "friend-remove-button"}
      disabled={pending}
      type="submit"
    >
      {pending ? "Working…" : labels[mode]}
    </button>
  );
}

export function FriendAction({ mode, entityId }: FriendActionProps) {
  const [state, formAction] = useActionState(actions[mode], initialState);

  return (
    <form className="friend-action" action={formAction}>
      <input name="entityId" type="hidden" value={entityId} />
      <ActionButton mode={mode} />
      {state.message ? (
        <span
          className={`friend-action-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
