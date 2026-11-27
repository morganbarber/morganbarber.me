"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";

/**
 * Two counter-running ticker rows that answer the scroll: scrolling fast
 * speeds them up and leans them into the motion, and they ease back to
 * cruising speed when the page settles.
 *
 * Each row is two identical halves translated by -50%, so the loop point is
 * exact whatever the text width.
 */

const ROW_A = [
  "Penetration testing",
  "Red teaming",
  "Web exploitation",
  "Privilege escalation",
  "Recon & enumeration",
] as const;
const ROW_B = [
  "Hack The Box",
  "CompTIA Security+",
  "Capture the flag",
  "CyberPatriot",
  "Python tooling",
] as const;

function Row({
  items,
  outline,
  hidden,
}: {
  items: readonly string[];
  outline?: boolean;
  hidden?: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span
            className={`font-display px-6 text-[clamp(2.5rem,6vw,5.5rem)] leading-none whitespace-nowrap md:px-10 ${
              outline ? "text-stroke" : ""
            }`}
          >
            {item}
          </span>
          <span aria-hidden="true" className="size-3 rotate-45 bg-primary md:size-4" />
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isStatic()) return;
      const [a, b] = gsap.utils.toArray<HTMLElement>("[data-track]");
      if (!a || !b) return;

      const loops = [
        gsap.to(a, { xPercent: -50, duration: 38, ease: "none", repeat: -1 }),
        gsap.fromTo(b, { xPercent: -50 }, { xPercent: 0, duration: 42, ease: "none", repeat: -1 }),
      ];
      const skew = gsap.quickTo("[data-skew]", "skewX", { duration: 0.5, ease: "power3" });

      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const velocity = self.getVelocity();
          const boost = gsap.utils.clamp(1, 7, 1 + Math.abs(velocity) / 250);
          skew(gsap.utils.clamp(-12, 12, velocity / -200));
          for (const loop of loops) {
            gsap.to(loop, { timeScale: boost, duration: 0.2, overwrite: true });
            gsap.to(loop, { timeScale: 1, duration: 1.2, delay: 0.2 });
          }
        },
        onLeave: () => skew(0),
        onLeaveBack: () => skew(0),
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="relative -rotate-2 overflow-hidden border-y border-line bg-surface py-8 md:py-12"
      role="presentation"
    >
      <div data-skew className="space-y-4 md:space-y-6">
        <div data-track className="flex w-max">
          <Row items={ROW_A} />
          <Row items={ROW_A} hidden />
        </div>
        <div data-track className="flex w-max text-muted-foreground">
          <Row items={ROW_B} outline />
          <Row items={ROW_B} outline hidden />
        </div>
      </div>
    </div>
  );
}
