"use client";

import { useActionState } from "react";

type ActionState = {
  error?: string;
  success?: string;
};

type AuthFormProps = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  title: string;
  description: string;
  submitLabel: string;
};

const initialState: ActionState = {};

export function AuthForm({ action, title, description, submitLabel }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="panel-form" action={formAction}>
      <div className="panel-form__header">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <label>
        <span>Email</span>
        <input name="email" type="email" placeholder="nombre@correo.com" required />
      </label>

      <label>
        <span>Contraseña</span>
        <input name="password" type="password" placeholder="Tu contraseña" required />
      </label>

      {state.error ? <p className="form-message form-message--error">{state.error}</p> : null}
      {state.success ? <p className="form-message form-message--success">{state.success}</p> : null}

      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? "Ingresando..." : submitLabel}
      </button>
    </form>
  );
}
