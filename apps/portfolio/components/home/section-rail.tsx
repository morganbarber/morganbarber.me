"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/motion";
import { HOME_SECTIONS } from "@/lib/site-nav";

/**
 * A fixed index of the home page's sections down the right edge (wide
 * screens). The current section's tick extends and its label shows; clicking
 * one scrolls there. Fades in once the hero is passed.
 */
export default function SectionRail() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const nav = root.current;
      if (!nav) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-rail-item]", nav);

      gsap.set(nav, { autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: document.getElementById("top"),
        start: "bottom 60%",
        onEnter: () => gsap.to(nav, { autoAlpha: 1, duration: 0.4 }),
        onLeaveBack: () => gsap.to(nav, { autoAlpha: 0, duration: 0.3 }),
      });

      const activate = (id: string) => {
        for (const item of items) {
          const on = item.dataset.railItem === id;
          item.toggleAttribute("data-active", on);
          if (on) item.setAttribute("aria-current", "true");
          else item.removeAttribute("aria-current");
        }
      };

      for (const section of HOME_SECTIONS) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        ScrollTrigger.create({
          trigger: el,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => self.isActive && activate(section.id),
        });
      }
    },
    { scope: root },
  );

  return (
    <nav
      ref={root}
      aria-label="Sections"
      className="fixed top-1/2 right-6 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ul className="flex flex-col items-end gap-3">
        {HOME_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              data-rail-item={section.id}
              onClick={() => scrollToTarget(`#${section.id}`)}
              className="rail-item group flex items-center gap-3 py-0.5"
            >
              <span className="rail-label font-mono text-[11px] text-muted-foreground">
                {section.label.toLowerCase()}
              </span>
              <span
                aria-hidden="true"
                className="rail-tick block h-px w-4 bg-muted-foreground/50"
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
