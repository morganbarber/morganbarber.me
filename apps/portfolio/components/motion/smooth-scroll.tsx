"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { isStatic, setLenis } from "@/lib/motion";

/**
 * Lenis smooth scrolling, driven by GSAP's ticker.
 *
 * One clock for everything: Lenis advances on gsap.ticker rather than its own
 * requestAnimationFrame loop, and every Lenis scroll event updates
 * ScrollTrigger. Two independent loops is what makes scrubbed animations
 * shimmer half a frame behind the scroll position.
 *
 * Lenis runs FIRST in each tick (the `prioritize` flag). Its scroll write
 * and ScrollTrigger's scroll read then happen before any tween has written a
 * style that frame; run after the tweens, the same write forced a full style
 * and layout recalculation of the page on every frame of scrolling (measured:
 * ~2.4 s of main-thread time per 8 s of scroll at 4x CPU throttle).
 *
 * Lag smoothing is disabled because Lenis already integrates time; with it on,
 * a long frame makes GSAP pretend less time passed than Lenis did, and pinned
 * sections drift against the content.
 *
 * Skipped entirely for reduced-motion visitors: hijacked scrolling is a common
 * vestibular trigger.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (isStatic()) return;

    const lenis = new Lenis({
      duration: 0.95,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // A touch quicker than the default: long smoothing reads as input lag.
      // Touch keeps native momentum; Lenis on touch feels laggy.
      syncTouch: false,
    });
    setLenis(lenis);

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick, false, true);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
