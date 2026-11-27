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
    (_context, contextSafe) => {
      if (!contextSafe) return;
      if (isStatic()) {
        releaseAnimPending();
        return;
      }

      const root = document.getElementById("main") ?? document.body;
      const all = <T extends Element = HTMLElement>(selector: string) =>
        Array.from(root.querySelectorAll<T & Element>(selector)) as T[];

      // Headings: masked line (or char) reveal.
      //
      // Split lazily: a heading is held invisible until it nears the viewport,
      // split then, revealed, and restored to plain text when the reveal ends.
      // Splitting every heading at mount measured as a layout pass per heading
      // inside the load-time long task, and left hundreds of transformed
      // spans in the DOM for the rest of the visit.
      for (const el of all<HTMLElement>("[data-split]")) {
        const chars = el.dataset.split === "chars";
        gsap.set(el, { autoAlpha: 0 });
        const reveal = contextSafe(() => {
          const split = SplitText.create(el, {
            type: chars ? "lines,chars" : "lines",
            mask: "lines",
          });
          gsap.set(el, { autoAlpha: 1 });
          // fromTo, not from: explicit end values mean GSAP never reads the
          // fresh spans' computed style, which forced a layout mid-scroll.
          gsap.fromTo(
            chars ? split.chars : split.lines,
            { yPercent: 115, rotate: chars ? 6 : 2 },
            {
              yPercent: 0,
              rotate: 0,
              duration: chars ? 1 : 1.15,
              stagger: chars ? 0.022 : 0.09,
              onComplete: () => split.revert(),
            },
          );
        });
        ScrollTrigger.create({
          trigger: el,
          // clamp(): a heading too near the end of the page to ever reach
          // 90% still triggers instead of staying hidden.
          start: "clamp(top 90%)",
          once: true,
          // Wait for the webfont so lines are measured in the real face.
          onEnter: () => void document.fonts.ready.then(reveal),
        });
      }

      const reveals = all<HTMLElement>("[data-reveal]");
      if (reveals.length) {
        gsap.set(reveals, { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch(reveals, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.fromTo(
              batch,
              { autoAlpha: 0, y: 48 },
              { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08, overwrite: true },
            ),
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
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 1.4,
            ease: "mb.inOut",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        );
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
