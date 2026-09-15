"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scrolling.
 *
 * Fixes two real bugs in the previous implementation:
 *
 * 1. rAF LEAK. The old `raf` function called `requestAnimationFrame(raf)`
 *    unconditionally, so the loop kept rescheduling itself forever — including
 *    after `lenis.destroy()`. Every remount added another permanent loop
 *    calling `raf()` on a destroyed instance. The cancellation handle is now
 *    kept and the loop stops on cleanup.
 *
 * 2. useLayoutEffect ON THE SERVER. `useLayoutEffect` warns during SSR and runs
 *    synchronously before paint for work that has no layout dependency.
 *    `useEffect` is correct here and does not block the first frame.
 *
 * Also honours `prefers-reduced-motion`: hijacked scrolling is a common
 * migraine and vestibular trigger, and overriding a user's explicit OS-level
 * request for less motion is not a style choice.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
