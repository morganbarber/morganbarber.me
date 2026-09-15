/**
 * Form state shapes, kept OUT of the "use server" action modules.
 *
 * A file marked `"use server"` may only export async functions — every export
 * becomes a callable server endpoint, so Next rejects anything else at build
 * time. Exporting the initial-state constants alongside the actions therefore
 * fails the build with "a 'use server' file can only export async functions".
 *
 * Types are erased and would have been fine; the plain objects are not. They
 * live here, where both the actions and the client components can import them.
 */

export interface FormState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
  /** Echoed back so a rejected form redisplays what was typed. */
  values?: Record<string, string>;
}

export const initialFormState: FormState = { status: "idle", message: "" };

export interface LoginState {
  status: "idle" | "error";
  message: string;
}

export const initialLoginState: LoginState = { status: "idle", message: "" };
