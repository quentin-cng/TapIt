"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeWeeklyGoal,
  completeOnboarding,
  type WeeklyGoalActionState,
} from "@/app/weekly-goal/actions";

const initialState: WeeklyGoalActionState = {
  status: "idle",
  message: "",
};

function GoalSubmitButton({
  mode,
  disabled,
}: {
  mode: WeeklyGoalFormProps["mode"];
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className="goal-submit-button"
      disabled={disabled || pending}
      type="submit"
    >
      {pending
        ? "Saving…"
        : mode === "onboarding"
          ? "Start my week"
          : "Schedule goal"}
    </button>
  );
}

function GoalOptions({
  selectedGoal,
  onSelect,
}: {
  selectedGoal?: number;
  onSelect: (goal: number) => void;
}) {

  return (
    <div
      className="goal-options"
      aria-label="Weekly session goal"
      role="group"
    >
      {Array.from({ length: 7 }, (_, index) => index + 1).map((goal) => (
        <button
          aria-label={`${goal} ${goal === 1 ? "session" : "sessions"} per week`}
          aria-pressed={goal === selectedGoal}
          className={goal === selectedGoal ? "current" : undefined}
          key={goal}
          onClick={() => onSelect(goal)}
          type="button"
        >
          {goal}
        </button>
      ))}
    </div>
  );
}

type WeeklyGoalFormProps = {
  mode: "onboarding" | "profile";
  currentGoal?: number;
  next?: string;
};

export function WeeklyGoalForm({
  mode,
  currentGoal,
  next = "/dashboard",
}: WeeklyGoalFormProps) {
  const action = mode === "onboarding" ? completeOnboarding : changeWeeklyGoal;
  const [state, formAction] = useActionState(action, initialState);
  const [selectedGoal, setSelectedGoal] = useState<number | undefined>(
    currentGoal,
  );

  return (
    <form className="weekly-goal-form" action={formAction}>
      <input name="goalSessions" type="hidden" value={selectedGoal ?? ""} />
      {mode === "onboarding" ? (
        <input name="next" type="hidden" value={next} />
      ) : null}
      <GoalOptions selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
      <div className="goal-selection-summary" aria-live="polite">
        {selectedGoal ? (
          <>
            <strong>{selectedGoal}</strong>
            <span>
              {selectedGoal === 1 ? "session" : "sessions"} / week
            </span>
          </>
        ) : (
          <span>Select a goal from 1 to 7.</span>
        )}
      </div>
      <p className="goal-form-help">
        {mode === "onboarding"
          ? "Choose the commitment you want to make this week."
          : "Your selection will replace any goal already scheduled for next week."}
      </p>
      {state.message ? (
        <p
          className={`form-message ${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
      <GoalSubmitButton disabled={!selectedGoal} mode={mode} />
    </form>
  );
}
