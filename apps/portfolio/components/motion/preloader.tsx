"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone } from "@/lib/motion";
import { INTRO_STORAGE_KEY } from "@repo/ui/intro";

/**
 * Boot sequence, first visit per tab only.
 *
 * Server-rendered so a first-time visitor's very first paint is the overlay,
 * not a flash of the page underneath. Returning visitors, reduced-motion
 * visitors, crawlers and search landings never see it: the pre-paint script in
 * the layout marks <html data-intro-seen> and CSS hides the overlay before
 * anything is drawn.
 *
 * Decorative and aria-hidden: the real content is already in the DOM behind it.
 */

const LINES = [
  "handshake ............ ok",
  "loading htb telemetry  ok",
  "mounting credentials . ok",
  "scope confirmed ...... ok",
  "access granted",
] as const;

export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      const overlay = root.current;
      if (!overlay) return;

      if (document.documentElement.hasAttribute("data-intro-seen")) {
        markIntroDone();
        setDone(true);
        return;
      }

      const counter = overlay.querySelector<HTMLElement>("[data-counter]");
      const lines = gsap.utils.toArray<HTMLElement>("[data-line]", overlay);
      const value = { n: 0 };

      const finish = () => {
        try {
          window.sessionStorage.setItem(INTRO_STORAGE_KEY, "true");
        } catch {
          /* storage blocked: the intro simply plays again next tab */
        }
        document.documentElement.setAttribute("data-intro-seen", "");
        setDone(true);
      };

      const tl = gsap.timeline({ defaults: { ease: "mb.out" }, onComplete: finish });

      tl.to(value, {
        n: 100,
        duration: 1.3,
        ease: "power2.inOut",
        onUpdate: () => {
          if (counter) counter.textContent = String(Math.round(value.n)).padStart(3, "0");
        },
      })
        .from("[data-bar]", { scaleX: 0, duration: 1.3, ease: "power2.inOut" }, 0)
        .from(
          lines,
          {
            autoAlpha: 0,
            x: -16,
            duration: 0.4,
            stagger: 0.24,
          },
          0.1,
        )
        .to(lines, { duration: 0.6, scrambleText: { text: "{original}", chars: "01" } }, 0.1)
        .addLabel("exit", "+=0.05")
        .to("[data-inner]", { yPercent: 40, autoAlpha: 0, duration: 0.7, ease: "mb.inOut" }, "exit")
        .to(overlay, { yPercent: -100, duration: 0.8, ease: "mb.inOut" }, "exit")
        // The hero starts rising while the cover is still lifting off it.
        .call(markIntroDone, [], "exit+=0.2");
    },
    { scope: root },
  );

  if (done) return null;

  return (
    <div
      ref={root}
      data-intro-overlay=""
      aria-hidden="true"
      role="presentation"
      className="fixed inset-0 z-[100] bg-background text-foreground select-none will-change-transform"
    >
      <div data-inner className="shell flex h-full flex-col justify-between py-10">
        <div className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>morganbarber.me</span>
          <span>session 0x01</span>
        </div>

        <div>
          <ul className="mb-10 space-y-1 font-mono text-xs text-muted-foreground md:text-sm">
            {LINES.map((line, i) => (
              <li
                key={line}
                data-line
                className={i === LINES.length - 1 ? "text-primary" : undefined}
              >
                {line}
              </li>
            ))}
          </ul>
          <div className="flex items-end justify-between gap-6">
            <span
              data-counter
              className="font-display text-[22vw] leading-[0.8] tabular-nums md:text-[16vw]"
            >
              000
            </span>
            <span className="mb-3 font-mono text-xs text-muted-foreground">loading</span>
          </div>
          <div data-bar className="mt-6 h-px origin-left bg-primary" />
        </div>
      </div>
    </div>
  );
}
