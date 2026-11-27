"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Hairline reading-progress bar along the top edge. Scrubbed straight from
 * ScrollTrigger, so it is exactly the scroll position with no React renders.
 * Re-measures on every route (`pathname` in the layout keys it).
 */
export default function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        },
      },
    );
  });

  return (
    <div
      ref={bar}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[60] h-[2px] w-full origin-left scale-x-0 bg-primary"
    />
  );
}
