"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, isStatic } from "@/lib/motion";

/**
 * Pulls its child toward the pointer while the pointer is near, and springs
 * back on leave. The inner element moves further than the outer, which gives
 * the label a little parallax inside its button.
 *
 * Wrap a link or a button; the wrapper itself is not interactive.
 */
export default function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      const target = el?.firstElementChild as HTMLElement | null;
      if (!el || !target || isStatic() || !hasFinePointer()) return;
      const inner = target.querySelector<HTMLElement>("[data-magnetic-inner]");

      const xTo = gsap.quickTo(target, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(target, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const ixTo = inner
        ? gsap.quickTo(inner, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" })
        : null;
      const iyTo = inner
        ? gsap.quickTo(inner, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" })
        : null;

      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        xTo(dx * strength);
        yTo(dy * strength);
        ixTo?.(dx * strength * 0.4);
        iyTo?.(dy * strength * 0.4);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
        ixTo?.(0);
        iyTo?.(0);
      };

      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      return () => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  return (
    <span ref={root} className={`inline-block p-3 -m-3 ${className ?? ""}`}>
      {children}
    </span>
  );
}
