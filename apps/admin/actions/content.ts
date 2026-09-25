"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createRow, deleteRow, setPublished, updateRow } from "@repo/data/admin";
import { fieldErrors, formDataToObject } from "@repo/data/schemas";
import { auditLog } from "@repo/security/audit";
import { isAuthenticated } from "@/lib/auth";
import { getResource } from "@/lib/resources";
import { notifyPortfolio } from "@/lib/revalidate";
import type { FormState } from "@/lib/form-state";

/**
 * CRUD server actions for the admin dashboard.
 *
 * Every action re-checks authentication. The proxy already gates page
 * navigation, but a Server Action is a POST endpoint in its own right — it does
 * not inherit the page's authorisation, and treating a layout check as
 * sufficient is a well-worn way to ship an unauthenticated write API.
 */

async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
}

/**
 * After a write, the portfolio's cached content is stale for up to an hour.
 * This pings its revalidation endpoint so edits appear immediately. A failure
 * is reported but never blocks the save — the data is already committed, and
 * the cache expires on its own.
 */
async function refreshPublicSite(table: string): Promise<string | null> {
  const result = await notifyPortfolio(table);
  return result.ok ? null : (result.reason ?? "reason unknown");
}

export async function saveResource(
  slug: string,
  id: string | null,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAuth();

  const resource = getResource(slug);
  if (!resource) {
    return { status: "error", message: `Unknown resource "${slug}".` };
  }

  const raw = formDataToObject(formData);

  // Unchecked checkboxes are absent from FormData entirely, so every checkbox
  // field is explicitly defaulted to "false" rather than left undefined —
  // otherwise unpublishing something would silently do nothing.
  for (const field of resource.fields) {
    if (field.type === "checkbox" && !(field.name in raw)) {
      raw[field.name] = "false";
    }
  }

  const parsed = resource.schema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
      values: raw,
    };
  }

  const values = parsed.data as Record<string, unknown>;

  const result = id
    ? await updateRow(resource.table, id, values)
    : await createRow(resource.table, values);

  if (result.error) {
    return {
      status: "error",
      message: result.error,
      values: raw,
    };
  }

  auditLog("admin.write", {
    action: id ? "update" : "create",
    table: resource.table,
    recordId: id ?? String((result.data as Record<string, unknown> | null)?.id ?? "new"),
    published: values.published,
  });

  const cacheWarning = await refreshPublicSite(resource.table);

  revalidatePath(`/content/${slug}`);
  if (id) revalidatePath(`/content/${slug}/${id}`);

  return {
    status: "success",
    message: cacheWarning
      ? `Saved. Note: the public site's cache was not refreshed (${cacheWarning}). It will update within the hour.`
      : "Saved, and the public site has been refreshed.",
  };
}

export async function deleteResource(slug: string, id: string): Promise<void> {
  await requireAuth();

  const resource = getResource(slug);
  if (!resource) return;

  auditLog("admin.write", { action: "delete", table: resource.table, recordId: id });

  const result = await deleteRow(resource.table, id);
  if (result.error) {
    // Surfaced through the list page's error boundary rather than swallowed.
    throw new Error(result.error);
  }

  await refreshPublicSite(resource.table);
  revalidatePath(`/content/${slug}`);
  redirect(`/content/${slug}`);
}

export async function togglePublished(slug: string, id: string, published: boolean): Promise<void> {
  await requireAuth();

  const resource = getResource(slug);
  if (!resource) return;

  auditLog("admin.write", {
    action: published ? "publish" : "unpublish",
    table: resource.table,
    recordId: id,
  });

  const result = await setPublished(resource.table, id, published);
  if (result.error) throw new Error(result.error);

  await refreshPublicSite(resource.table);
  revalidatePath(`/content/${slug}`);
}
