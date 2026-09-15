"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteContactMessage, setContactStatus } from "@repo/data/admin";
import { isAuthenticated } from "@/lib/auth";
import type { ContactMessage } from "@repo/types";

/**
 * Contact inbox actions.
 *
 * Like the content actions, each one re-checks authentication: a Server Action
 * is its own POST endpoint and does not inherit the page's authorisation.
 */

async function requireAuth(): Promise<void> {
  if (!(await isAuthenticated())) redirect("/login");
}

const VALID_STATUSES: ContactMessage["status"][] = ["new", "read", "archived", "spam"];

export async function updateMessageStatus(id: string, status: string): Promise<void> {
  await requireAuth();

  // The status comes from a bound argument, but it is validated anyway: a
  // Server Action's arguments are attacker-controllable, not trusted input.
  if (!VALID_STATUSES.includes(status as ContactMessage["status"])) return;

  const result = await setContactStatus(id, status as ContactMessage["status"]);
  if (result.error) throw new Error(result.error);

  revalidatePath("/messages");
}

export async function removeMessage(id: string): Promise<void> {
  await requireAuth();

  const result = await deleteContactMessage(id);
  if (result.error) throw new Error(result.error);

  revalidatePath("/messages");
}
