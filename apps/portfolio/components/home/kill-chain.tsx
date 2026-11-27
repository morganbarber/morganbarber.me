"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Capability } from "@repo/config/site";

/**
 * Capabilities as an engagement, phase by phase.
 *
 * On wide screens the section pins and the phases travel sideways as you
 * scroll down — one long horizontal track tied 1:1 to the vertical scroll —
 * with a progress rail along the bottom. As each phase reaches the middle of
 * the screen its opening command types itself out and its number fills in.
 *
 * Narrow screens and reduced motion get the same panels stacked vertically.
 */
export default function KillChain({ phases }: { phases: readonly Capability[] }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const track = section?.querySelector<HTMLElement>("[data-track]");
      if (!section || !track) return;

      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.scrollWidth - window.innerWidth;
        const signal = getComputedStyle(document.documentElement).getPropertyValue("--primary");

        const scroll = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        gsap.fromTo(
          "[data-rail]",
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          },
        );

        for (const panel of gsap.utils.toArray<HTMLElement>("[data-phase]", section)) {
          const command = panel.querySelector<HTMLElement>("[data-command]");
          const number = panel.querySelector<HTMLElement>("[data-number]");
          const text = command?.textContent ?? "";
          gsap
            .timeline({
              scrollTrigger: {
                trigger: panel,
                containerAnimation: scroll,
                start: "left 65%",
                toggleActions: "play none none reverse",
              },
            })
            .fromTo(number, { color: "rgba(0,0,0,0)" }, { color: signal, duration: 0.6 })
            .fromTo(
              panel.querySelectorAll("[data-phase-in]"),
              { autoAlpha: 0, y: 30 },
              { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.8 },
              0,
            )
            .to(command, { duration: 1, scrambleText: { text, chars: "01", speed: 0.7 } }, 0.3);
        }

        return () => scroll.scrollTrigger?.kill();
      });

      // Stacked layout: plain reveals.
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-phase]", section).forEach((panel) => {
          gsap.from(panel, {
            autoAlpha: 0,
            y: 50,
            duration: 1,
            scrollTrigger: { trigger: panel, start: "top 88%", once: true },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="kill-chain"
      data-section="kill-chain"
      aria-labelledby="kill-chain-title"
      className="relative overflow-hidden bg-surface lg:h-[100svh]"
    >
      <div
        data-track
        className="flex flex-col gap-px lg:h-full lg:w-max lg:flex-row lg:items-stretch lg:gap-0"
      >
        <div className="flex flex-col justify-between gap-10 px-6 pt-28 pb-14 lg:w-[42vw] lg:px-[6vw] lg:py-28">
          <div className="flex items-center gap-4 label">
            <span className="text-primary">02</span>
            <span>kill chain</span>
          </div>
          <div>
            <h2
              id="kill-chain-title"
              data-split
              className="font-head text-[clamp(3rem,6.5vw,7rem)]"
            >
              Scope to fix, in six moves.
            </h2>
            <p data-reveal className="mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
              The path an engagement takes. Keep scrolling: each phase opens with the command it
              usually starts with.
            </p>
          </div>
          <p className="hidden label lg:block">scroll to advance</p>
        </div>

        {phases.map((phase, i) => (
          <article
            key={phase.title}
            data-phase
            className="relative flex flex-col justify-between gap-10 border-t border-line px-6 py-14 lg:w-[min(62vw,52rem)] lg:border-t-0 lg:border-l lg:px-[4vw] lg:py-28"
          >
            <span
              data-number
              aria-hidden="true"
              className="font-display text-stroke text-[clamp(6rem,14vw,13rem)] leading-[0.8]"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 data-phase-in className="font-head text-[clamp(2rem,3.6vw,3.5rem)] capitalize">
                {phase.title.toLowerCase()}
              </h3>
              <p
                data-phase-in
                className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground"
              >
                {phase.description}
              </p>
              <p
                data-phase-in
                className="mt-8 flex max-w-full items-center gap-3 overflow-x-auto rounded-md border border-line bg-background px-4 py-3 font-mono text-sm whitespace-nowrap no-scrollbar"
              >
                <span className="text-primary">$</span>
                <code data-command>{phase.command}</code>
              </p>
            </div>
          </article>
        ))}
        <div aria-hidden="true" className="hidden w-[8vw] lg:block" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-px bg-line lg:block">
        <div data-rail className="h-full origin-left scale-x-0 bg-primary" />
      </div>
    </section>
  );
}
