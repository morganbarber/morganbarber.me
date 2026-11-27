"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import { copyText, hasFinePointer, isStatic } from "@/lib/motion";
import Magnetic from "@/components/motion/magnetic";

/**
 * The close. "Let's talk" set enormous in the variable font: each letter's
 * weight and width respond to how close the pointer is, so the words swell
 * toward you as you move over them. Letters rise in on arrival.
 */
export default function ContactCta({ email }: { email: string }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isStatic()) return;
      const heading = root.current?.querySelector<HTMLElement>("[data-flex]");
      if (!heading) return;
      const split = SplitText.create(heading, { type: "chars", mask: "chars" });

      gsap.from(split.chars, {
        yPercent: 110,
        stagger: 0.035,
        duration: 1.2,
        scrollTrigger: { trigger: heading, start: "top 85%", once: true },
      });

      if (!hasFinePointer()) return;
      const chars = split.chars as HTMLElement[];
      gsap.set(chars, { "--w": 400, "--d": 95 });

      const move = (event: PointerEvent) => {
        for (const char of chars) {
          const rect = char.getBoundingClientRect();
          const dist = Math.hypot(
            event.clientX - (rect.left + rect.width / 2),
            event.clientY - (rect.top + rect.height / 2),
          );
          const t = gsap.utils.clamp(0, 1, 1 - dist / 420);
          gsap.to(char, {
            "--w": 400 + t * 500,
            "--d": 95 + t * 30,
            duration: 0.5,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      };
      const leave = () =>
        gsap.to(chars, { "--w": 400, "--d": 95, duration: 0.9, ease: "elastic.out(1, 0.5)" });

      const host = root.current!;
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerleave", leave);
      return () => {
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerleave", leave);
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="contact"
      data-section="contact"
      className="shell section-pad overflow-hidden"
    >
      <div className="mb-10 flex items-center gap-4 label">
        <span className="text-primary">10</span>
        <span data-draw className="h-px flex-1 bg-line" />
        <span>contact</span>
      </div>

      <h2
        data-flex
        className="flex-type text-[clamp(4.5rem,17vw,16rem)] leading-[0.85] tracking-[-0.04em]"
      >
        Let&apos;s talk.
      </h2>

      <div className="mt-14 grid items-end gap-10 md:grid-cols-[minmax(0,1fr)_auto]">
        <div data-reveal>
          <p className="max-w-md text-lg leading-relaxed text-muted-foreground">
            Internships, CTF teams, or a system you want looked at, with permission. I reply within
            a day.
          </p>
          <button
            type="button"
            onClick={() => void copyText(email, "Email copied")}
            data-cursor="copy"
            className="link-draw mt-6 font-mono text-[clamp(1rem,2.4vw,1.6rem)] text-primary"
          >
            {email}
          </button>
        </div>
        <div data-reveal>
          <Magnetic>
            <Link href="/contact" className="btn btn-primary min-h-16 px-10 text-lg">
              <span data-magnetic-inner>Send a message</span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
