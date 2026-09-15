"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useMotionValueEvent } from "framer-motion";

/**
 * Scroll progress bar and percentage readout.
 *
 * The previous version called `setState` from `useMotionValueEvent`, which
 * fires on every scroll frame. That re-rendered this component — and so the
 * percentage text — up to 60 times a second, for a value that changes at most
 * 100 times over the whole page. On a long page with the marquee and glitch
 * effects already running, it was a measurable source of dropped frames.
 *
 * The bar was always driven by a motion value (no re-render). The readout now
 * writes to the DOM node directly through a ref and only when the whole-number
 * percentage actually changes, so this component renders exactly once.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const readoutRef = useRef<HTMLDivElement>(null);
  const lastValue = useRef(-1);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const percent = Math.round(latest * 100);
    if (percent === lastValue.current) return;
    lastValue.current = percent;

    const node = readoutRef.current;
    if (node) node.textContent = `${String(percent).padStart(2, "0")}%`;
  });

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-primary origin-left z-50 mix-blend-difference"
        style={{ scaleX }}
        // Decorative: the readout below carries the same information.
        aria-hidden="true"
      />
      <div
        ref={readoutRef}
        aria-hidden="true"
        className="fixed bottom-8 right-8 z-50 font-mono text-4xl font-bold mix-blend-difference pointer-events-none select-none tabular-nums"
      >
        00%
      </div>
    </>
  );
}
