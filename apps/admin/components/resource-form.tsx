"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { saveResource } from "@/actions/content";
import { initialFormState, type FormState } from "@/lib/form-state";
import type { FieldDef, ResourceDef } from "@/lib/resources";

/**
 * Create/edit form, generated from a resource's field definitions.
 *
 * One form component serves all five content types. Adding a column means
 * adding a `FieldDef` in lib/resources.ts — there is no per-table form to keep
 * in sync, which is how five hand-written forms end up validating five slightly
 * different things.
 *
 * Validation runs server-side against the shared Zod schema; the browser's own
 * `required` attributes are left off (`noValidate`) so the two cannot disagree
 * about what is acceptable.
 */

interface ResourceFormProps {
  resource: Omit<ResourceDef, "schema" | "publicPath">;
  /** Existing row when editing; undefined when creating. */
  row?: Record<string, unknown>;
  id?: string;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 bg-primary text-background font-bold px-5 py-2.5 rounded hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Saving…
        </>
      ) : isEdit ? (
        "Save changes"
      ) : (
        "Create"
      )}
    </button>
  );
}

export default function ResourceForm({ resource, row, id }: ResourceFormProps) {
  const isEdit = Boolean(id);

  const action = saveResource.bind(null, resource.slug, id ?? null);
  const [state, formAction] = useActionState<FormState, FormData>(action, initialFormState);

  /**
   * Field value precedence: what the user just typed (returned on a rejected
   * submit) beats what is in the database. Losing a long write-up because one
   * field failed validation is the fastest way to make an editor distrust a CMS.
   */
  const valueFor = (field: FieldDef): string => {
    const echoed = state.values?.[field.name];
    if (echoed !== undefined) return echoed;

    const stored = row?.[field.name];
    if (stored === null || stored === undefined) return "";
    if (Array.isArray(stored)) return stored.join(", ");
    return String(stored);
  };

  const checkedFor = (field: FieldDef): boolean => {
    const echoed = state.values?.[field.name];
    if (echoed !== undefined) return echoed === "on" || echoed === "true";
    return Boolean(row?.[field.name]);
  };

  return (
    <form action={formAction} className="max-w-3xl space-y-6" noValidate>
      {state.status !== "idle" ? (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded border px-4 py-3 ${
            state.status === "success"
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-danger/40 bg-danger/5 text-danger"
          }`}
        >
          {state.status === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          )}
          <span>{state.message}</span>
        </div>
      ) : null}

      {resource.fields.map((field) => {
        const error = state.fieldErrors?.[field.name];
        const describedBy =
          [error ? `${field.name}-error` : null, field.help ? `${field.name}-help` : null]
            .filter(Boolean)
            .join(" ") || undefined;

        if (field.type === "checkbox") {
          return (
            <div
              key={field.name}
              className="flex items-start gap-3 rounded border border-border bg-surface p-4"
            >
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                defaultChecked={checkedFor(field)}
                aria-describedby={describedBy}
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              />
              <div className="min-w-0">
                <label htmlFor={field.name} className="font-bold cursor-pointer">
                  {field.label}
                </label>
                {field.help ? (
                  <p id={`${field.name}-help`} className="text-muted-foreground text-xs mt-1">
                    {field.help}
                  </p>
                ) : null}
              </div>
            </div>
          );
        }

        const shared = {
          id: field.name,
          name: field.name,
          defaultValue: valueFor(field),
          placeholder: field.placeholder,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
          className:
            "w-full rounded border border-border bg-surface px-3 py-2 outline-none transition-colors focus:border-primary aria-[invalid=true]:border-danger",
        };

        return (
          <div key={field.name} className="space-y-1.5">
            <label htmlFor={field.name} className="block font-bold">
              {field.label}
              {field.required ? <span className="text-danger ml-1">*</span> : null}
              {field.identifier && isEdit ? (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  changing this changes the public URL
                </span>
              ) : null}
            </label>

            {field.type === "textarea" || field.type === "markdown" ? (
              <textarea
                {...shared}
                rows={field.rows ?? 6}
                className={`${shared.className} resize-y font-mono`}
              />
            ) : field.type === "number" ? (
              <input {...shared} type="number" inputMode="numeric" />
            ) : field.type === "date" ? (
              <input {...shared} type="date" />
            ) : (
              // url/tags/text all post as plain strings; the schema is what
              // gives them their distinct meaning.
              <input {...shared} type="text" />
            )}

            {error ? (
              <p id={`${field.name}-error`} className="text-danger text-xs">
                {error}
              </p>
            ) : field.help ? (
              <p id={`${field.name}-help`} className="text-muted-foreground text-xs">
                {field.help}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <SubmitButton isEdit={isEdit} />
        <Link
          href={`/content/${resource.slug}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to list
        </Link>
      </div>
    </form>
  );
}
