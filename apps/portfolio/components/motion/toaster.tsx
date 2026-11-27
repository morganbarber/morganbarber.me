"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { on, type MotionEvents } from "@/lib/motion";

/**
 * Transient confirmations ("email copied", "root shell obtained"). Any client
 * module raises one with `toast()` from lib/motion; this renders them in a
 * polite live region so screen readers hear them too.
 */

type Toast = MotionEvents["mb:toast"] & { id: number };

const LIFETIME_MS = 3200;

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const root = useRef<HTMLOListElement>(null);
  const nextId = useRef(0);

  useEffect(
    () =>
      on("mb:toast", (detail) => {
        const id = ++nextId.current;
        setToasts((list) => [...list.slice(-2), { ...detail, id }]);
      }),
    [],
  );

  const { contextSafe } = useGSAP({ scope: root });

  // Each new toast animates in, waits, animates out, then leaves state.
  useGSAP(
    () => {
      const fresh = root.current?.querySelectorAll<HTMLElement>("li:not([data-shown])");
      fresh?.forEach((el) => {
        el.dataset.shown = "";
        const id = Number(el.dataset.id);
        const remove = contextSafe(() =>
          setToasts((list) => list.filter((item) => item.id !== id)),
        );
        gsap
          .timeline()
          .from(el, { y: 32, autoAlpha: 0, scale: 0.96, duration: 0.5 })
          .to(
            el.querySelector("[data-progress]"),
            { scaleX: 0, duration: LIFETIME_MS / 1000, ease: "none" },
            0,
          )
          .to(el, { y: -12, autoAlpha: 0, duration: 0.35, ease: "power2.in", onComplete: remove });
      });
    },
    { scope: root, dependencies: [toasts] },
  );

  return (
    <ol
      ref={root}
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 left-1/2 z-[85] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2"
    >
      {toasts.map((item) => (
        <li
          key={item.id}
          data-id={item.id}
          className="relative overflow-hidden rounded-md border border-line bg-surface/95 px-4 py-3 font-mono text-sm backdrop-blur"
        >
          <span
            className={
              item.tone === "error"
                ? "text-secondary"
                : item.tone === "success"
                  ? "text-primary"
                  : "text-foreground"
            }
          >
            {item.message}
          </span>
          <span
            data-progress
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-px w-full origin-left bg-primary/60"
          />
        </li>
      ))}
    </ol>
  );
}
