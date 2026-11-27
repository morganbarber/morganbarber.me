"use client";

import type Lenis from "lenis";

/**
 * Shared client-side motion state. Deliberately tiny and framework-free: the
 * pieces that talk to each other (preloader → hero, palette → toaster,
 * terminal → root mode) are siblings in the tree, and a window event is the
 * cheapest wire between them that needs no provider.
 */

// -----------------------------------------------------------------------------
// Static mode
// -----------------------------------------------------------------------------

/**
 * True when the page should render without choreography: the visitor prefers
 * reduced motion, or the pre-paint script identified a crawler or audit tool
 * (their snapshot should be the content, not an entrance in progress).
 */
export function isStatic(): boolean {
  if (typeof document === "undefined") return true;
  return (
    document.documentElement.hasAttribute("data-static") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Fine pointer with hover — where cursor effects and drag make sense. */
export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/**
 * Removes the pre-paint "hold everything hidden" flag. Called once the first
 * set of entrance states has been applied, so content goes from hidden to
 * animating with no visible frame in between.
 */
export function releaseAnimPending(): void {
  document.documentElement.removeAttribute("data-anim-pending");
}

// -----------------------------------------------------------------------------
// Intro
// -----------------------------------------------------------------------------

type IntroWindow = Window & { __mbIntroDone?: boolean };

const INTRO_EVENT = "mb:intro-done";

export function markIntroDone(): void {
  (window as IntroWindow).__mbIntroDone = true;
  window.dispatchEvent(new Event(INTRO_EVENT));
}

/** Runs `cb` once the boot intro has finished (immediately if it never runs). */
export function whenIntroDone(cb: () => void): () => void {
  const w = window as IntroWindow;
  if (w.__mbIntroDone || document.documentElement.hasAttribute("data-intro-seen")) {
    cb();
    return () => {};
  }
  window.addEventListener(INTRO_EVENT, cb, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, cb);
}

// -----------------------------------------------------------------------------
// Events
// -----------------------------------------------------------------------------

export interface MotionEvents {
  "mb:toast": { message: string; tone?: "default" | "success" | "error" };
  "mb:palette": { open?: boolean };
  "mb:root": { on?: boolean };
  /** Navigate through the page transition (same rules as a link click). */
  "mb:navigate": { href: string };
}

export function emit<K extends keyof MotionEvents>(name: K, detail: MotionEvents[K]): void {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on<K extends keyof MotionEvents>(
  name: K,
  handler: (detail: MotionEvents[K]) => void,
): () => void {
  const listener = (event: Event) => handler((event as CustomEvent<MotionEvents[K]>).detail);
  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

export function navigateTo(href: string): void {
  emit("mb:navigate", { href });
}

export function toast(message: string, tone: MotionEvents["mb:toast"]["tone"] = "default"): void {
  emit("mb:toast", { message, tone });
}

// -----------------------------------------------------------------------------
// Scrolling
// -----------------------------------------------------------------------------

let lenis: Lenis | null = null;

export function setLenis(instance: Lenis | null): void {
  lenis = instance;
}

export function getLenis(): Lenis | null {
  return lenis;
}

/** Header height the anchor targets should clear. */
const SCROLL_OFFSET = -80;

/**
 * Scrolls to an element, selector or position through Lenis when it is
 * running (so the motion matches every other scroll), natively otherwise.
 */
export function scrollToTarget(
  target: string | HTMLElement | number,
  options: { immediate?: boolean } = {},
): void {
  const immediate = options.immediate || isStatic();
  if (lenis) {
    lenis.scrollTo(target, {
      offset: typeof target === "number" ? 0 : SCROLL_OFFSET,
      immediate,
      duration: 1.4,
    });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: immediate ? "auto" : "smooth" });
    return;
  }
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!(element instanceof HTMLElement)) return;
  const top = element.getBoundingClientRect().top + window.scrollY + SCROLL_OFFSET;
  window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
}

export async function copyText(text: string, label = "Copied"): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label}: ${text}`, "success");
  } catch {
    toast("Clipboard unavailable — select the text instead", "error");
  }
}
