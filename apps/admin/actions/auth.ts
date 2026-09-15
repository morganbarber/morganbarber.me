"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auditLog } from "@repo/security/audit";
import { clientIp } from "@repo/security/request";
import {
  CLEAR_SITE_DATA,
  createSession,
  destroySession,
  isAuthConfigured,
  verifyPassword,
} from "@/lib/auth";
import { checkLoginAllowed, recordFailure, recordSuccess } from "@/lib/login-guard";
import type { LoginState } from "@/lib/form-state";
import { cookies } from "next/headers";

/**
 * Login and logout.
 *
 * Brute-force protection lives in `lib/login-guard.ts`: a small number of
 * attempts, then an escalating lockout. The previous fixed 600 ms delay was
 * not a control — it is per-request, so parallel requests bypass it entirely.
 *
 * Failure messages never distinguish "wrong password" from "no such
 * configuration" beyond what is safe to say, and every outcome is recorded as
 * a security event so repeated failures are actually detectable.
 */

/** Small constant delay on failure, on top of the lockout. */
const FAILURE_DELAY_MS = 400;

/**
 * Identifies the source of a login attempt.
 *
 * The dashboard is localhost-only, so this is nearly always the loopback
 * address — the guard still matters, because "localhost" includes anything
 * tunnelled or port-forwarded to this machine, and a single shared bucket is
 * the conservative behaviour when the source cannot be distinguished.
 */
async function loginSource(): Promise<string> {
  const headerList = await headers();
  return clientIp(headerList) ?? "local";
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const source = await loginSource();

  if (!isAuthConfigured()) {
    auditLog("auth.misconfigured", { actor: source });
    return {
      status: "error",
      message:
        "No admin credential is configured. Set ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) in apps/admin/.env.local and restart.",
    };
  }

  // Checked BEFORE the password is verified: the point of a lockout is to
  // avoid doing the work, not to decide afterwards whether the answer counts.
  const guard = checkLoginAllowed(source);
  if (!guard.allowed) {
    return {
      status: "error",
      message: `Too many failed attempts. Try again in ${
        guard.retryAfter < 60
          ? `${guard.retryAfter} seconds`
          : `${Math.ceil(guard.retryAfter / 60)} minutes`
      }.`,
    };
  }

  const password = formData.get("password");
  if (typeof password !== "string" || password.length === 0) {
    return { status: "error", message: "Enter the admin password." };
  }

  // Bounded before hashing: an unbounded input would otherwise be free work
  // for the server to do on every guess.
  if (password.length > 512) {
    recordFailure(source);
    return { status: "error", message: "Incorrect password." };
  }

  if (!(await verifyPassword(password))) {
    const state = recordFailure(source);

    auditLog("auth.failure", {
      actor: source,
      remainingAttempts: state.remaining,
      failures: state.failures,
    });

    // Separate, higher-severity event: a lockout is the point at which a
    // handful of typos becomes an apparent attack.
    if (state.justLockedOut) {
      auditLog("auth.lockout", {
        actor: source,
        failures: state.failures,
        lockedForSeconds: state.retryAfter,
      });
    }

    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));

    return {
      status: "error",
      message: state.allowed
        ? state.remaining > 0 && state.remaining <= 2
          ? `Incorrect password. ${state.remaining} attempt${state.remaining === 1 ? "" : "s"} left before lockout.`
          : "Incorrect password."
        : `Too many failed attempts. Try again in ${
            state.retryAfter < 60
              ? `${state.retryAfter} seconds`
              : `${Math.ceil(state.retryAfter / 60)} minutes`
          }.`,
    };
  }

  recordSuccess(source);
  auditLog("auth.success", { actor: source });

  await createSession();
  redirect("/");
}

export async function logout(): Promise<void> {
  auditLog("auth.logout", { actor: await loginSource() });

  await destroySession();

  /*
    Server Actions cannot set arbitrary response headers, so the signal is
    carried as a short-lived cookie that the proxy converts into a real
    `Clear-Site-Data` header on the next response. Without it, pages rendered
    while signed in — contact messages, draft content, analytics — stay in the
    browser's cache after sign-out.
  */
  const cookieStore = await cookies();
  cookieStore.set("admin_clear", CLEAR_SITE_DATA, {
    httpOnly: true,
    sameSite: "strict",
    secure: false,
    path: "/",
    maxAge: 10,
  });

  redirect("/login");
}
