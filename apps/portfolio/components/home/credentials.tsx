"use client";

import { useRef } from "react";
import { gsap, useGSAP, Draggable } from "@/lib/gsap";
import { hasFinePointer, isStatic } from "@/lib/motion";
import type { CertificationSummary } from "@repo/types";
import SectionHeading from "@/components/section-heading";

/**
 * Certifications as a rail of credential cards.
 *
 *   • drag it, throw it (inertia), or use the arrow buttons; it is also a real
 *     horizontal scroller, so keyboard focus and touch scrolling just work
 *   • each card tilts toward the pointer with a sheen that follows it
 *   • the cards deal in from the right as the section arrives
 *
 * Every card opens the certificate PDF (candidate IDs redacted).
 */

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function issued(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

/** "CompTIA Security+" → "Security+": the issuer is already on the card. */
function shortName(name: string, issuer: string): string {
  return name.startsWith(`${issuer} `) ? name.slice(issuer.length + 1) : name;
}

export default function Credentials({
  certifications,
}: {
  certifications: CertificationSummary[];
}) {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);

  const issuers = Object.entries(
    certifications.reduce<Record<string, number>>((acc, cert) => {
      const issuer = cert.issuer ?? "Other";
      acc[issuer] = (acc[issuer] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  useGSAP(
    () => {
      const scroller = rail.current;
      if (!scroller || isStatic()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", scroller);

      gsap.from(cards, {
        x: 160,
        rotateY: -25,
        autoAlpha: 0,
        duration: 1.2,
        stagger: 0.07,
        scrollTrigger: { trigger: scroller, start: "top 85%", once: true },
      });

      // Reading position along the rail.
      const progress = root.current?.querySelector<HTMLElement>("[data-rail-progress]");
      const onScroll = () => {
        const max = scroller.scrollWidth - scroller.clientWidth;
        if (progress) gsap.set(progress, { scaleX: max > 0 ? scroller.scrollLeft / max : 1 });
      };
      onScroll();
      scroller.addEventListener("scroll", onScroll, { passive: true });

      if (!hasFinePointer()) {
        return () => scroller.removeEventListener("scroll", onScroll);
      }

      const [drag] = Draggable.create(scroller, {
        type: "scrollLeft",
        inertia: true,
        edgeResistance: 0.85,
        cursor: "grab",
        activeCursor: "grabbing",
        allowContextMenu: true,
        // Clicks still reach the links unless the pointer actually moved.
        minimumMovement: 6,
      });

      // Tilt + sheen, per card.
      const cleanups = cards.map((card) => {
        const inner = card.querySelector<HTMLElement>("[data-card-inner]");
        if (!inner) return () => {};
        gsap.set(inner, { transformPerspective: 900 });
        const rx = gsap.quickTo(inner, "rotationX", { duration: 0.5, ease: "power3" });
        const ry = gsap.quickTo(inner, "rotationY", { duration: 0.5, ease: "power3" });
        const move = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;
          rx((0.5 - py) * 14);
          ry((px - 0.5) * 18);
          inner.style.setProperty("--mx", `${px * 100}%`);
          inner.style.setProperty("--my", `${py * 100}%`);
        };
        const leave = () => {
          rx(0);
          ry(0);
        };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        return () => {
          card.removeEventListener("pointermove", move);
          card.removeEventListener("pointerleave", leave);
        };
      });

      return () => {
        drag?.kill();
        cleanups.forEach((fn) => fn());
        scroller.removeEventListener("scroll", onScroll);
      };
    },
    { scope: root },
  );

  const step = (direction: 1 | -1) => {
    const scroller = rail.current;
    const card = scroller?.querySelector<HTMLElement>("[data-card]");
    if (!scroller || !card) return;
    const amount = (card.offsetWidth + 24) * direction;
    gsap.to(scroller, {
      scrollTo: { x: scroller.scrollLeft + amount },
      duration: isStatic() ? 0 : 0.9,
      ease: "mb.out",
    });
  };

  if (certifications.length === 0) return null;

  return (
    <section ref={root} id="credentials" data-section="credentials" className="section-pad">
      <div className="shell">
        <SectionHeading
          index="04"
          label="credentials"
          title="Certified, and still collecting."
          intro={
            <>
              {issuers.map(([issuer, count], i) => (
                <span key={issuer}>
                  {i > 0 ? ", " : ""}
                  <span className="text-foreground">{count}</span> from {issuer}
                </span>
              ))}
              . Every card opens the certificate itself.
            </>
          }
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous certificates"
              className="grid size-12 place-items-center rounded-full border border-line transition-colors hover:border-primary hover:text-primary"
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="More certificates"
              className="grid size-12 place-items-center rounded-full border border-line transition-colors hover:border-primary hover:text-primary"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </SectionHeading>
      </div>

      <div
        ref={rail}
        className="no-scrollbar flex snap-x gap-6 overflow-x-auto px-6 pb-6 [perspective:1200px] md:px-[max(1.5rem,calc((100%_-_80rem)/2_+_1.5rem))]"
        aria-label="Certifications"
        role="list"
      >
        {certifications.map((cert, i) => {
          const date = issued(cert.issued_on);
          return (
            <div key={cert.id} role="listitem" data-card className="shrink-0 snap-start">
              <a
                href={cert.file_url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="view pdf"
                className="block"
                aria-label={`${cert.name}, ${cert.issuer}${date ? `, issued ${date}` : ""} (PDF, opens in a new tab)`}
              >
                <div
                  data-card-inner
                  className="credential relative flex h-[25rem] w-[19rem] flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface p-7 md:h-[27rem] md:w-[21rem]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} /{" "}
                      {String(certifications.length).padStart(2, "0")}
                    </span>
                    <span className="rounded-full border border-line px-3 py-1 font-mono text-xs">
                      {cert.issuer}
                    </span>
                  </div>

                  <div>
                    <p className="font-head text-[2rem] leading-[1] [overflow-wrap:anywhere]">
                      {shortName(cert.name, cert.issuer ?? "")}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-line pt-5">
                    <div>
                      <p className="label">issued</p>
                      <p className="mt-1 text-sm">{date ?? "—"}</p>
                    </div>
                    <span className="font-mono text-xs text-primary">open pdf ↗</span>
                  </div>
                </div>
              </a>
            </div>
          );
        })}
      </div>

      <div className="shell mt-6">
        <div className="h-px bg-line">
          <div data-rail-progress className="h-full origin-left scale-x-0 bg-primary" />
        </div>
      </div>
    </section>
  );
}
