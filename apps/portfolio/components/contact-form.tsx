"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { initialContactState, submitContactForm } from "@/actions/contact";

/**
 * Contact form.
 *
 * The markup previously had no action, no state and no submit handling — it
 * looked like a form and did nothing. This wires it to the guarded Server
 * Action, with the two client-side halves of the spam controls:
 *
 *   • `website` — a honeypot, hidden from sighted users AND from screen readers
 *     (aria-hidden + tabIndex -1), so it is never a real accessibility trap
 *   • `renderedAt` — a timestamp the server uses to reject instant submissions
 *
 * Neither is a security boundary on its own; the authoritative checks all run
 * server-side.
 */

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-primary text-background font-bold border border-primary px-6 py-4 font-mono text-sm uppercase tracking-widest transition-colors hover:bg-transparent hover:text-primary disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          TRANSMITTING...
        </span>
      ) : (
        "SEND TRANSMISSION"
      )}
    </button>
  );
}

export default function ContactForm() {
  const [state, formAction] = useActionState(submitContactForm, initialContactState);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const renderedAtRef = useRef<HTMLInputElement>(null);

  /*
    The timestamp is stamped straight onto the input rather than held in state.
    It is never displayed, so storing it in state would cost a render for a
    value nothing reads — and setting it from an effect is the cascading-render
    pattern React now warns about. Writing it on the client also means it
    reflects when this visitor saw the form, not when the page was rendered.
  */
  const stampRenderedAt = () => {
    if (renderedAtRef.current) renderedAtRef.current.value = String(Date.now());
  };

  useEffect(stampRenderedAt, []);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      // reset() restores the hidden input's defaultValue, so re-stamp it.
      stampRenderedAt();
    }
    // Move focus to the result so a screen reader announces it immediately.
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  const fieldError = (field: "name" | "email" | "message") => state.fieldErrors?.[field];

  const inputClass =
    "w-full bg-background border border-muted p-4 outline-none transition-colors font-mono focus:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary aria-[invalid=true]:border-secondary";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-6 bg-muted/5 p-8 border border-muted/20 backdrop-blur-sm"
      noValidate
    >
      <input ref={renderedAtRef} type="hidden" name="renderedAt" defaultValue="0" />

      {/*
        Honeypot. `hidden` keeps it out of the accessibility tree as well as the
        layout, and the negative tabindex keeps keyboard users from ever
        reaching it — a honeypot that traps real people is just a broken form.
      */}
      <div hidden aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="name" className="font-mono text-xs uppercase tracking-widest text-primary">
          Identity <span aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          placeholder="NAME"
          aria-invalid={Boolean(fieldError("name"))}
          aria-describedby={fieldError("name") ? "name-error" : undefined}
          className={inputClass}
        />
        {fieldError("name") ? (
          <p id="name-error" className="font-mono text-xs text-secondary">
            {fieldError("name")}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="font-mono text-xs uppercase tracking-widest text-primary">
          Return Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          maxLength={254}
          autoComplete="email"
          placeholder="YOU@EXAMPLE.COM"
          aria-invalid={Boolean(fieldError("email"))}
          aria-describedby={fieldError("email") ? "email-error" : "email-hint"}
          className={inputClass}
        />
        {fieldError("email") ? (
          <p id="email-error" className="font-mono text-xs text-secondary">
            {fieldError("email")}
          </p>
        ) : (
          <p id="email-hint" className="font-mono text-xs text-muted-foreground">
            Optional — but I cannot reply without it.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="message"
          className="font-mono text-xs uppercase tracking-widest text-primary"
        >
          Transmission <span aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          placeholder="ENTER MESSAGE..."
          aria-invalid={Boolean(fieldError("message"))}
          aria-describedby={fieldError("message") ? "message-error" : undefined}
          className={`${inputClass} resize-none`}
        />
        {fieldError("message") ? (
          <p id="message-error" className="font-mono text-xs text-secondary">
            {fieldError("message")}
          </p>
        ) : null}
      </div>

      <SubmitButton />

      {/* aria-live so the outcome is announced without stealing focus abruptly. */}
      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className="font-mono text-sm min-h-[1.5rem] outline-none"
      >
        {state.status === "success" ? (
          <span className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {state.message}
          </span>
        ) : state.status === "error" ? (
          <span className="flex items-center gap-2 text-secondary">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            {state.message}
          </span>
        ) : null}
      </p>
    </form>
  );
}
