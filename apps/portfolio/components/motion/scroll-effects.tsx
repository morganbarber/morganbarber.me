"use client";

import { usePathname } from "next/navigation";
import { gsap, useGSAP, ScrollTrigger, SplitText } from "@/lib/gsap";
import { isStatic, releaseAnimPending } from "@/lib/motion";

/**
 * Declarative scroll effects for server-rendered markup.
 *
 * Most of the site is server components. Rather than turning each into a
 * client component to animate it, markup opts in with a data attribute and
 * this one client component wires every match on the current route:
 *
 *   data-split            heading lines rise out of a mask on enter
 *   data-split="chars"    the same, per character
 *   data-reveal           fades up on enter, batched so neighbours stagger
 *   data-count            counts up from zero to its own text on enter
 *   data-scramble         decodes its own text on enter
 *   data-draw             a rule that draws itself left to right on enter
 *   data-parallax="0.2"   drifts against the scroll (fraction of its height)
 *
 * Without JavaScript, or for reduced-motion visitors, every element is simply
 * its final state — the attributes describe an entrance, never content.
 *
 * Re-runs on every route change (the old route's triggers are reverted with
 * it), and runs in a layout effect, after the page's own components have set
 * up their states, so `releaseAnimPending` can unhide everything at once.
 */
export default function ScrollEffects() {
  const pathname = usePathname();

  useGSAP(
    () => {
      if (isStatic()) {
        releaseAnimPending();
        return;
      }

      const root = document.getElementById("main") ?? document.body;
      const all = <T extends Element = HTMLElement>(selector: string) =>
        Array.from(root.querySelectorAll<T & Element>(selector)) as T[];

      // Headings: masked line (or char) reveal. autoSplit re-splits when the
      // webfont swaps in or the width changes, and onSplit hands the new
      // animation back so it resumes at the right progress.
      for (const el of all<HTMLElement>("[data-split]")) {
        const chars = el.dataset.split === "chars";
        SplitText.create(el, {
          type: chars ? "lines,chars" : "lines",
          mask: "lines",
          autoSplit: true,
          onSplit(self) {
            return gsap.from(chars ? self.chars : self.lines, {
              yPercent: 115,
              rotate: chars ? 6 : 2,
              duration: chars ? 1 : 1.15,
              stagger: chars ? 0.022 : 0.09,
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            });
          },
        });
      }

      const reveals = all<HTMLElement>("[data-reveal]");
      if (reveals.length) {
        gsap.set(reveals, { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch(reveals, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 1,
              stagger: 0.08,
              overwrite: true,
            }),
        });
      }

      const format = new Intl.NumberFormat("en-US");
      for (const el of all<HTMLElement>("[data-count]")) {
        const end = Number(el.dataset.count);
        if (!Number.isFinite(end)) continue;
        const counter = { value: 0 };
        el.textContent = "0";
        gsap.to(counter, {
          value: end,
          duration: Math.min(2.4, 0.9 + end / 200),
          ease: "power3.out",
          onUpdate: () => {
            el.textContent = format.format(Math.round(counter.value));
          },
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      }

      for (const el of all<HTMLElement>("[data-scramble]")) {
        const text = el.textContent ?? "";
        gsap.to(el, {
          duration: 1.3,
          scrambleText: { text, chars: "!<>-_\\/[]{}—=+*^?#01", revealDelay: 0.25, speed: 0.5 },
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      }

      for (const el of all<HTMLElement>("[data-draw]")) {
        gsap.from(el, {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 1.4,
          ease: "mb.inOut",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      }

      for (const el of all<HTMLElement>("[data-parallax]")) {
        const amount = Number(el.dataset.parallax) || 0.15;
        gsap.fromTo(
          el,
          { yPercent: -amount * 50 },
          {
            yPercent: amount * 50,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      }

      releaseAnimPending();

      // Webfonts change heading heights; re-measure once they settle.
      void document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return null;
}
