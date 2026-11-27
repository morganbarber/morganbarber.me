"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";

/**
 * The statement, read at the speed of the scroll: every word starts dim and
 * lights up as the paragraph passes through the viewport.
 */
export default function Manifesto({ description }: { description: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isStatic()) return;
      SplitText.create("[data-scrub]", {
        type: "words",
        autoSplit: true,
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: 0.12 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.1,
              scrollTrigger: {
                trigger: root.current,
                start: "top 75%",
                end: "bottom 60%",
                scrub: true,
              },
            },
          ),
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="shell section-pad" aria-label="About me">
      <div className="mb-10 flex items-center gap-4 label">
        <span className="text-primary">01</span>
        <span data-draw className="h-px flex-1 bg-line" />
        <span>about</span>
      </div>
      <p data-scrub className="font-head max-w-6xl text-[clamp(2rem,4.6vw,4.5rem)] leading-[1.04]">
        Attackers only need one way in. I train to find it first: legally, with permission, and with
        the goal of getting it closed.
      </p>
      <div className="mt-14 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <span />
        <div data-reveal>
          <p className="text-lg leading-relaxed text-muted-foreground">{description}</p>
          <Link href="/about" className="link-draw mt-6 inline-block text-primary">
            More about me
          </Link>
        </div>
      </div>
    </section>
  );
}
