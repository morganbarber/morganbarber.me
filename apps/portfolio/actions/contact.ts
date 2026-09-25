"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createStaticClient } from "@repo/supabase/server";
import { getSiteUrl } from "@repo/config/env";
import { getServerEnv } from "@repo/config/server-env";
import { rateLimit } from "@repo/security/rate-limit";
import { isBot, referrerHost, visitorHash } from "@repo/security/request";
import { auditLog } from "@repo/security/audit";

/**
 * Contact form submission.
 *
 * The form previously had no action at all — it rendered inputs and a button
 * that did nothing. This gives it a real, guarded one.
 *
 * Spam controls, cheapest first:
 *
 *   1. Honeypot field    — hidden from humans, irresistible to naive bots
 *   2. Time trap         — a form completed in under 3 seconds was not typed
 *   3. Bot user agent    — obvious automation
 *   4. In-process limit  — per-visitor, per-instance
 *   5. Database limit    — per-visitor and site-wide, authoritative
 *
 * Server Actions carry a built-in Origin check, so CSRF is already covered by
 * the framework here; the analytics Route Handler has to do that itself.
 */

const MIN_FILL_SECONDS = 3;
const PER_VISITOR_LIMIT = 3;
const PER_VISITOR_WINDOW_MS = 10 * 60_000;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
  email: z.union([z.literal(""), z.email("That email address is not valid").max(254)]).optional(),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
  // Hidden input. A human never sees it, so a non-empty value means a bot.
  website: z.string().max(0).optional().or(z.literal("")),
  // Client-stamped render time, used for the time trap.
  renderedAt: z.coerce.number().int().nonnegative().optional(),
});

export interface ContactFormState {
  status: "idle" | "success" | "error";
  message: string;
  /** Field-level messages, keyed by input name. */
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
}

export const initialContactState: ContactFormState = {
  status: "idle",
  message: "",
};

/**
 * Bots get the same cheerful confirmation a human does. Telling a spammer their
 * submission was discarded only tells them what to change.
 */
const SILENT_SUCCESS: ContactFormState = {
  status: "success",
  message: "Transmission received. I'll reply within 24 hours.",
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") ?? "",
    message: formData.get("message"),
    website: formData.get("website") ?? "",
    renderedAt: formData.get("renderedAt") ?? undefined,
  });

  if (!parsed.success) {
    const fieldErrors: ContactFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "name" || field === "email" || field === "message") {
        fieldErrors[field] ??= issue.message;
      }
      // A populated honeypot fails `max(0)`; treat it as spam, not as an error.
      if (field === "website") return SILENT_SUCCESS;
    }
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors,
    };
  }

  const { name, email, message, website, renderedAt } = parsed.data;

  if (website) return SILENT_SUCCESS;

  if (renderedAt && Date.now() - renderedAt < MIN_FILL_SECONDS * 1000) {
    return SILENT_SUCCESS;
  }

  const headerList = await headers();

  if (isBot(headerList.get("user-agent"))) return SILENT_SUCCESS;

  let env;
  try {
    env = getServerEnv();
  } catch (error) {
    console.error(
      "[contact] environment invalid:",
      error instanceof Error ? error.message : String(error),
    );
    return {
      status: "error",
      message: "The contact channel is temporarily unavailable. Please email me directly.",
    };
  }

  const hash = await visitorHash(headerList, env.ANALYTICS_SALT);

  const limit = rateLimit(
    `contact:${hash ?? "anonymous"}`,
    PER_VISITOR_LIMIT,
    PER_VISITOR_WINDOW_MS,
  );
  if (!limit.allowed) {
    auditLog("ratelimit.exceeded", { path: "contact-form", actor: hash });
    return {
      status: "error",
      message: `Too many messages sent. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`,
    };
  }

  try {
    const supabase = createStaticClient();

    const { data, error } = await supabase.rpc("submit_contact_message", {
      p_name: name,
      p_message: message,
      p_email: email && email.length > 0 ? email : null,
      p_referrer_host: referrerHost(headerList.get("referer"), getSiteUrl()),
      p_visitor_hash: hash,
    });

    if (error) {
      console.error("[contact] submit_contact_message failed:", error.message);
      return {
        status: "error",
        message: "Could not send that message. Please email me directly instead.",
      };
    }

    if (data === "rate_limited") {
      return {
        status: "error",
        message: "Too many messages sent recently. Please try again later.",
      };
    }

    if (data !== "ok") {
      return {
        status: "error",
        message: "That message was rejected. Please check the fields and try again.",
      };
    }

    return SILENT_SUCCESS;
  } catch (error) {
    console.error("[contact] unreachable:", error instanceof Error ? error.message : String(error));
    return {
      status: "error",
      message: "The contact channel is temporarily unavailable. Please email me directly.",
    };
  }
}
