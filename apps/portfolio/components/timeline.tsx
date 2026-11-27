"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";

/**
 * A vertical record: a rail that fills as you read down it, and a marker on
 * each entry that lights when the entry crosses the middle of the screen.
 * Shared by the home page and /experience.
 */

export interface TimelineEntry {
  id: string | number;
  period: string;
  title: string;
  org: string;
  body: string | null;
  tag: string;
}

export default function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const root = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      if (isStatic()) return;
      gsap.fromTo(
        "[data-fill]",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom 60%", scrub: 0.4 },
        },
      );

      for (const item of gsap.utils.toArray<HTMLElement>("[data-entry]", root.current)) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: item,
              start: "top 60%",
              toggleActions: "play none none reverse",
            },
          })
          .to(item.querySelector("[data-node]"), {
            scale: 1,
            backgroundColor: getComputedStyle(document.documentElement).getPropertyValue(
              "--primary",
            ),
            duration: 0.4,
          })
          .from(
            item.querySelectorAll("[data-entry-in]"),
            { autoAlpha: 0.25, x: 24, stagger: 0.06, duration: 0.6 },
            0,
          );
      }
    },
    { scope: root },
  );

  return (
    <ol ref={root} className="relative">
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[7px] w-px bg-line md:left-[calc(14rem+7px)]"
      >
        <span data-fill className="block h-full w-full origin-top bg-primary" />
      </span>

      {entries.map((entry) => (
        <li
          key={`${entry.tag}-${entry.id}`}
          data-entry
          className="relative grid gap-3 pb-16 pl-10 last:pb-0 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-0 md:pl-0"
        >
          <div
            data-entry-in
            className="font-mono text-sm text-muted-foreground md:pt-1 md:pr-10 md:text-right"
          >
            {entry.period}
          </div>
          <span
            data-node
            aria-hidden="true"
            className="absolute top-1.5 left-0 size-[15px] scale-75 rounded-full border-2 border-background bg-muted ring-1 ring-line md:left-[14rem]"
          />
          <div className="md:pl-12">
            <p data-entry-in className="label">
              {entry.tag}
            </p>
            <h3
              data-entry-in
              className="font-head mt-2 text-[clamp(1.75rem,3vw,2.75rem)] capitalize"
            >
              {entry.title.toLowerCase()}
            </h3>
            <p data-entry-in className="mt-2 text-primary capitalize">
              {entry.org.toLowerCase()}
            </p>
            {entry.body ? (
              <p data-entry-in className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
                {entry.body}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
