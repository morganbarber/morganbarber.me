"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteResource } from "@/actions/content";

/**
 * Two-step delete.
 *
 * Deletion is irreversible and there is no undo, so the first click only arms
 * the control — it does not submit. A single-click delete next to an Edit link
 * is a mis-click away from losing a write-up with no way back.
 */

function ConfirmButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="btn btn-danger px-3">
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Trash2 className="size-4" aria-hidden="true" />
      )}
      {pending ? "Deleting…" : "Confirm delete"}
    </button>
  );
}

export default function DeleteButton({
  slug,
  id,
  label,
}: {
  slug: string;
  id: string;
  label: string;
}) {
  const [armed, setArmed] = useState(false);
  const action = deleteResource.bind(null, slug, id);

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="btn btn-ghost-danger px-3">
        <Trash2 className="size-4" aria-hidden="true" />
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground max-w-[14rem]">
        Delete this {label} permanently?
      </span>
      <form action={action}>
        <ConfirmButton />
      </form>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded border border-border px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}
