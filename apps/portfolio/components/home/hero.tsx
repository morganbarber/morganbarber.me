"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import { isStatic, whenIntroDone } from "@/lib/motion";
import Magnetic from "@/components/motion/magnetic";
import LocalTime from "@/components/local-time";
import SignalField from "@/components/home/signal-field";

/**
 * The first screen: the name set huge over the interactive signal field, one
 * line about what I do, two actions.
 *
 * The entrance waits for the boot intro (or runs at once when there is none):
 * letters rise out of a mask, then the supporting lines decode in. Scrolling
 * away pulls the two halves of the name apart and fades the field.
 */

const ROLES = [
  "rooting HackTheBox machines",
  "writing Python tooling",
  "hardening systems in CyberPatriot",
  "playing picoCTF",
  "working toward red team",
] as const;

export default function Hero({
  rank,
  profileUrl,
  age,
}: {
  rank: string | null;
  profileUrl: string | null;
  age: number;
}) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el || isStatic()) return;

      const lines = gsap.utils.toArray<HTMLElement>("[data-name-line]", el);
      const role = el.querySelector<HTMLElement>("[data-role]");
      const split = SplitText.create(lines, { type: "chars", mask: "chars" });
      // Resolved now: the intro callback runs later, outside this context,
      // where scoped selector strings would no longer find anything.
      const fadeIns = gsap.utils.toArray<HTMLElement>("[data-hero-in]", el);
      const rule = el.querySelector<HTMLElement>("[data-hero-rule]");

      // Hidden states are applied now, before the pending flag is released.
      gsap.set(split.chars, { yPercent: 110 });
      gsap.set(fadeIns, { autoAlpha: 0, y: 24 });

      let intro: gsap.core.Timeline | null = null;
      const off = whenIntroDone(() => {
        intro = gsap
          .timeline()
          .to(split.chars, {
            yPercent: 0,
            duration: 1.3,
            stagger: { each: 0.045, from: "start" },
            ease: "mb.out",
          })
          .to(fadeIns, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 0.45)
          .from(rule, { scaleX: 0, duration: 1.4, ease: "mb.inOut" }, 0.3);

        if (role) {
          const cycle = gsap.timeline({ repeat: -1, delay: 1.6 });
          for (const text of [...ROLES.slice(1), ROLES[0]]) {
            cycle.to(role, {
              duration: 1,
              scrambleText: { text, chars: "lowerCase", speed: 0.6 },
              delay: 2.2,
            });
          }
          intro.add(cycle, 1.2);
        }
      });

      // Scroll-away: the name splits apart and the content drifts up.
      gsap
        .timeline({
          scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.5 },
        })
        .to(lines[0] ?? [], { xPercent: -14, ease: "none" }, 0)
        .to(lines[1] ?? [], { xPercent: 14, ease: "none" }, 0)
        .to("[data-hero-content]", { yPercent: -30, autoAlpha: 0, ease: "none" }, 0)
        .to("[data-hero-field]", { autoAlpha: 0.2, scale: 1.08, ease: "none" }, 0);

      return () => {
        off();
        intro?.kill();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="top"
      data-section="top"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden"
    >
      <div data-hero-field className="absolute inset-0 -z-10">
        <SignalField className="h-full w-full" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,transparent_0%,var(--background)_100%)]"
        />
      </div>

      <div
        data-hero-content
        className="shell flex flex-1 flex-col justify-between gap-10 pt-28 pb-10 md:pt-32"
      >
        <div data-hero-in data-hero-hide className="flex justify-between gap-6 label">
          <span>ethical hacking / red team</span>
          <span className="text-right">
            Longmont, CO <span className="text-foreground">/</span> <LocalTime />
          </span>
        </div>

        <h1 aria-label="Morgan Barber" className="font-display select-none">
          <span
            data-name-line
            data-hero-hide
            aria-hidden="true"
            className="block text-[clamp(3rem,13.2vw,13rem)] leading-[0.84] whitespace-nowrap"
          >
            Morgan
          </span>
          <span
            data-name-line
            data-hero-hide
            aria-hidden="true"
            className="block text-right text-[clamp(3rem,13.2vw,13rem)] leading-[0.84] whitespace-nowrap text-primary"
          >
            Barber
          </span>
        </h1>

        <div>
          <div data-hero-rule className="mb-6 h-px origin-left bg-line" />
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="max-w-xl">
              <p data-hero-in data-hero-hide className="text-xl leading-snug md:text-2xl">
                {age}-year-old ethical hacker. I break into systems, with permission, so they get
                fixed.
              </p>
              <p
                data-hero-in
                data-hero-hide
                className="mt-3 font-mono text-sm text-muted-foreground"
              >
                <span className="text-primary">$</span> currently{" "}
                <span data-role className="text-foreground">
                  {ROLES[0]}
                </span>
              </p>
            </div>

            <div data-hero-in data-hero-hide className="flex flex-wrap items-center gap-4">
              <Magnetic>
                <Link href="#work" className="btn btn-primary">
                  <span data-magnetic-inner>See the work</span>
                </Link>
              </Magnetic>
              <Magnetic>
                <Link href="/contact" className="btn btn-ghost">
                  <span data-magnetic-inner>Get in touch</span>
                </Link>
              </Magnetic>
            </div>
          </div>

          <div
            data-hero-in
            data-hero-hide
            className="mt-8 flex flex-wrap items-center justify-between gap-4 label"
          >
            {rank && profileUrl ? (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer external"
                className="link-quiet"
              >
                hack the box rank: <span className="text-foreground">{rank}</span>
              </a>
            ) : (
              <span />
            )}
            <span className="flex items-center gap-3">
              scroll
              <span aria-hidden="true" className="relative block h-8 w-px overflow-hidden bg-line">
                <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-primary" />
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
