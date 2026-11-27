"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, isStatic } from "@/lib/motion";

/**
 * A trailing ring that follows the pointer and reacts to what it is over.
 *
 * It augments the system cursor rather than replacing it — hiding the real
 * cursor breaks precision for anyone who relies on it, and it never lags.
 *
 *   • links and buttons: the ring grows and fills
 *   • [data-cursor="label"]: the ring grows into a pill showing that label
 *   • text fields: the ring hides, the I-beam is all you need
 *
 * Only on fine pointers with hover, and never for reduced motion.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = ring.current;
    const text = label.current;
    if (!el || !text || isStatic() || !hasFinePointer()) return;

    gsap.set(el, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    const x = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3" });

    let state = "";
    let visible = false;
    // Tracked here so tweens never have to read the ring's computed width.
    let width = 36;

    const setState = (next: string, caption = "") => {
      if (next === state && text.textContent === caption) return;
      state = next;
      text.textContent = caption;
      // Colours come from CSS ([data-state] in globals.css) so they follow the
      // theme tokens, including root mode; GSAP handles only the geometry.
      el.dataset.state = next;
      const scale = next === "label" ? 1 : next === "link" ? 1.9 : next === "hidden" ? 0 : 0.6;
      const nextWidth = next === "label" ? Math.max(84, caption.length * 9 + 36) : 36;
      gsap.fromTo(
        el,
        { width },
        {
          scale,
          width: nextWidth,
          duration: 0.35,
          ease: "power3.out",
          overwrite: "auto",
        },
      );
      width = nextWidth;
      gsap.to(text, { autoAlpha: next === "label" ? 1 : 0, duration: 0.2 });
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (!visible) {
        visible = true;
        gsap.set(el, { x: event.clientX, y: event.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.3 });
      }
      x(event.clientX);
      y(event.clientY);
    };

    const onOver = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const labelled = target.closest<HTMLElement>("[data-cursor]");
      if (labelled) return setState("label", labelled.dataset.cursor ?? "");
      if (target.closest("input, textarea, select, [contenteditable]")) return setState("hidden");
      if (target.closest("a, button, [role='button'], label, summary")) return setState("link");
      setState("idle");
    };

    const onLeave = () => {
      visible = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.3 });
    };

    const onDown = () => gsap.to(el, { scale: "*=0.8", duration: 0.15 });
    const onUp = () => {
      const current = state;
      state = "";
      setState(current || "idle", text.textContent ?? "");
    };

    setState("idle");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("mouseover", onOver, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  });

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="cursor-ring pointer-events-none fixed top-0 left-0 z-[90] hidden h-9 w-9 items-center justify-center overflow-hidden rounded-full border opacity-0"
    >
      <span
        ref={label}
        className="whitespace-nowrap font-mono text-[11px] font-medium text-background opacity-0"
      />
    </div>
  );
}
