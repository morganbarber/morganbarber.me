/**
 * Brute-force protection for the admin login.
 *
 * Addresses OWASP A07:2021 — Identification and Authentication Failures.
 *
 * The previous implementation had only a fixed 600 ms delay on failure, which
 * is not a control at all:
 *
 *   • it caps one attacker at ~1.6 guesses/second, indefinitely, and
 *   • it is per-request, so N parallel requests get N guesses per 600 ms —
 *     the delay is trivially parallelised away.
 *
 * This replaces it with a real lockout: a small number of attempts, then an
 * escalating cooldown that a parallel attacker cannot outrun, because the
 * counter is shared rather than per-request.
 *
 * NIST SP 800-63B §5.2.2 asks for no more than 100 consecutive failed attempts
 * against a single account before throttling. This is far stricter, which is
 * affordable because there is exactly one operator and one password.
 *
 * State is in-process. For a single-instance local dashboard that is the whole
 * population, so there is no distributed-counter problem to solve here.
 *
 * This module is deliberately pure apart from `Date.now()`: it emits no logs
 * and imports nothing. The caller decides what a lockout means and records it
 * (`recordFailure` reports `justLockedOut` for exactly that), which keeps the
 * state machine independently testable.
 */

interface Attempts {
  count: number;
  /** Epoch ms after which attempts are allowed again. 0 = not locked. */
  lockedUntil: number;
  /** Epoch ms when the window began; used to expire stale entries. */
  firstAttempt: number;
}

/** Failures allowed before the first lockout. */
const THRESHOLD = 5;

/**
 * Lockout durations, applied in order as failures accumulate past the
 * threshold. Escalating rather than fixed, so an automated attacker is pushed
 * into hours while a human who mistyped twice waits seconds.
 */
const BACKOFF_MS = [
  30_000, // 30 seconds
  2 * 60_000, // 2 minutes
  10 * 60_000, // 10 minutes
  60 * 60_000, // 1 hour
];

/** Counters reset after this long with no attempts. */
const WINDOW_MS = 60 * 60_000;

/** Bounded so a spoofed-source flood cannot exhaust memory. */
const MAX_TRACKED = 2000;

const attempts = new Map<string, Attempts>();

function sweep(now: number): void {
  for (const [key, record] of attempts) {
    if (now - record.firstAttempt > WINDOW_MS && record.lockedUntil < now) {
      attempts.delete(key);
    }
  }
  if (attempts.size <= MAX_TRACKED) return;

  // Map preserves insertion order; drop the oldest entries.
  const excess = attempts.size - MAX_TRACKED;
  let removed = 0;
  for (const key of attempts.keys()) {
    attempts.delete(key);
    if (++removed >= excess) break;
  }
}

export interface LoginGuardState {
  allowed: boolean;
  /** Seconds remaining on the lockout; 0 when allowed. */
  retryAfter: number;
  /** Attempts left before the next lockout. */
  remaining: number;
  /** True only on the attempt that triggered a lockout, for the caller to log. */
  justLockedOut?: boolean;
  /** Total failures recorded for this source in the current window. */
  failures?: number;
}

/**
 * Checks whether `source` may attempt a login right now.
 *
 * Call before verifying the password — the point is to avoid doing the work at
 * all, not to decide afterwards whether the answer counts.
 */
export function checkLoginAllowed(source: string): LoginGuardState {
  const now = Date.now();
  if (Math.random() < 0.05) sweep(now);

  const record = attempts.get(source);
  if (!record) return { allowed: true, retryAfter: 0, remaining: THRESHOLD };

  if (record.lockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.lockedUntil - now) / 1000),
      remaining: 0,
    };
  }

  return {
    allowed: true,
    retryAfter: 0,
    remaining: Math.max(0, THRESHOLD - record.count),
  };
}

/** Records a failed attempt and applies a lockout once the threshold is passed. */
export function recordFailure(source: string): LoginGuardState {
  const now = Date.now();
  const record = attempts.get(source) ?? {
    count: 0,
    lockedUntil: 0,
    firstAttempt: now,
  };

  record.count += 1;
  let justLockedOut = false;

  if (record.count >= THRESHOLD) {
    // Index into the backoff ladder by how far past the threshold we are,
    // clamped to the longest cooldown.
    const step = Math.min(record.count - THRESHOLD, BACKOFF_MS.length - 1);
    record.lockedUntil = now + BACKOFF_MS[step]!;
    justLockedOut = true;
  }

  attempts.set(source, record);

  return {
    allowed: record.lockedUntil <= now,
    retryAfter: record.lockedUntil > now ? Math.ceil((record.lockedUntil - now) / 1000) : 0,
    remaining: Math.max(0, THRESHOLD - record.count),
    justLockedOut,
    failures: record.count,
  };
}

/**
 * Clears the counter after a successful login.
 *
 * Without this, a legitimate operator who mistyped four times would stay one
 * failure away from a lockout for the rest of the hour.
 */
export function recordSuccess(source: string): void {
  attempts.delete(source);
}

/**
 * Clears all state. Exists for the test suite: the counters are module-level,
 * so without a reset each test would inherit the previous one's failures.
 */
export function __resetLoginGuard(): void {
  attempts.clear();
}
