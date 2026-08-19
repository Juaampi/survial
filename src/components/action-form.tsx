"use client";

import { useActionState } from "react";

type ActionState = {
  error?: string;
  success?: string;
};

type ActionFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
};

const initialState: ActionState = {};

export function ActionForm({ action, children, submitLabel, className }: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className={className || "panel-form"} action={formAction}>
      {children}
      {state.error ? <p className="form-message form-message--error">{state.error}</p> : null}
      {state.success ? <p className="form-message form-message--success">{state.success}</p> : null}
      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
