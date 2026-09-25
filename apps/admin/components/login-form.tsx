"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { TriangleAlert, LoaderCircle } from "lucide-react";
import { login } from "@/actions/auth";
import { initialLoginState, type LoginState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-background font-bold px-4 py-2.5 rounded hover:opacity-90 disabled:opacity-60 transition-opacity"
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking…
        </>
      ) : (
        "Sign in"
      )}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(login, initialLoginState);

  return (
    <form action={formAction} className="space-y-4 rounded border border-border bg-surface p-6">
      <div className="space-y-1.5">
        <label htmlFor="password" className="block font-bold">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "login-error" : undefined}
          className="w-full rounded border border-border bg-background px-3 py-2 outline-none focus:border-primary aria-[invalid=true]:border-danger transition-colors"
        />
      </div>

      <SubmitButton />

      {state.status === "error" ? (
        <p id="login-error" role="alert" className="flex items-start gap-2 text-danger text-xs">
          <TriangleAlert className="h-4 w-4 shrink-0 mt-px" aria-hidden="true" />
          <span>{state.message}</span>
        </p>
      ) : null}
    </form>
  );
}
