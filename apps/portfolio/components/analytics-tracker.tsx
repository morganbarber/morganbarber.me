"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * First-party page-view tracking.
 *
 * Rewritten from the previous version, which called a Server Action on every
 * navigation. That had three problems: it blocked on an RSC round trip during
 * the transition, it sent the browser's user agent in the payload (the server
 * already has it in a header), and it fired again on every re-render that
 * changed `pathname`'s identity.
 *
 * This version:
 *   • posts to a plain Route Handler, off the React render path entirely
 *   • uses `sendBeacon`, which the browser queues and delivers even if the tab
 *     closes mid-flight, and which never delays navigation
 *   • defers to idle time so it cannot compete with paint
 *   • de-duplicates per URL, so a re-render is not a second page view
 *   • respects Do Not Track and Global Privacy Control before sending anything
 */

const ENDPOINT = "/api/analytics";

/** Idle-callback fallback for Safari, which still lacks requestIdleCallback. */
function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(callback, { timeout: 2000 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = window.setTimeout(callback, 500);
  return () => window.clearTimeout(handle);
}

function hasOptedOut(): boolean {
  const nav = window.navigator as Navigator & {
    doNotTrack?: string;
    globalPrivacyControl?: boolean;
    msDoNotTrack?: string;
  };
  return (
    nav.doNotTrack === "1" ||
    nav.globalPrivacyControl === true ||
    nav.msDoNotTrack === "1" ||
    (window as Window & { doNotTrack?: string }).doNotTrack === "1"
  );
}

/**
 * Session id, scoped to the tab. `sessionStorage` can throw outright in a
 * locked-down browser profile, so every access is guarded; failing to get an id
 * degrades the data slightly and must never break the page.
 */
function getSessionId(): string | undefined {
  try {
    const existing = window.sessionStorage.getItem("analytics_session_id");
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.sessionStorage.setItem("analytics_session_id", id);
    return id;
  } catch {
    return undefined;
  }
}

function send(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);

  // sendBeacon is fire-and-forget and survives page unload. It is also exempt
  // from the fetch keepalive size limits that matter on slow connections.
  if (typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(ENDPOINT, blob)) return;
  }

  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    // Same-origin only; the endpoint rejects anything else anyway.
    credentials: "same-origin",
  }).catch(() => {
    /* analytics must never surface an error to the user */
  });
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (hasOptedOut()) return;

    // Query strings can carry tokens and personal data, so only the path is
    // recorded — the search string is used for de-duplication and discarded.
    const key = `${pathname}?${searchParams.toString()}`;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    return onIdle(() => {
      send({
        path: pathname,
        event_name: "page_view",
        session_id: getSessionId(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: window.navigator.language,
        referrer: document.referrer || undefined,
      });
    });
  }, [pathname, searchParams]);

  return null;
}
