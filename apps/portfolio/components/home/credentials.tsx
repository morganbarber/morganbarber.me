"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hasFinePointer, isStatic } from "@/lib/motion";
import type { CertificationSummary } from "@repo/types";
import SectionHeading from "@/components/section-heading";

/**
 * Certifications as a grid of credential cards, every one visible at once.
 *
 *   • the cards deal in, staggered, as the grid arrives
 *   • each card tilts toward the pointer with a sheen that follows it
 *
 * This was a horizontal rail, which hid most certificates off the edge of the
 * screen; a grid that wraps shows all of them at every width.
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

/**
 * Lets a long name wrap after a slash ("Word/PowerPoint") instead of breaking
 * mid-word.
 */
function breakable(text: string): React.ReactNode {
  const parts = text.split("/");
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </span>
  ));
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
  const grid = useRef<HTMLUListElement>(null);

  const issuers = Object.entries(
    certifications.reduce<Record<string, number>>((acc, cert) => {
      const issuer = cert.issuer ?? "Other";
      acc[issuer] = (acc[issuer] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  useGSAP(
    () => {
      const list = grid.current;
      if (!list || isStatic()) return;
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", list);
      if (!cards.length) return;

      gsap.from(cards, {
        y: 80,
        rotateX: -18,
        autoAlpha: 0,
        duration: 1.1,
        stagger: { each: 0.07, grid: "auto", from: "start" },
        scrollTrigger: { trigger: list, start: "top 85%", once: true },
      });

      if (!hasFinePointer()) return;

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
          rx((0.5 - py) * 12);
          ry((px - 0.5) * 16);
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

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: root },
  );

  if (certifications.length === 0) return null;

  return (
    <section ref={root} id="credentials" data-section="credentials" className="shell section-pad">
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
      />

      <ul
        ref={grid}
        aria-label="Certifications"
        className="grid grid-cols-1 gap-5 [perspective:1400px] sm:grid-cols-2 lg:grid-cols-4"
      >
        {certifications.map((cert, i) => {
          const date = issued(cert.issued_on);
          return (
            <li key={cert.id} data-card className="min-w-0">
              <a
                href={cert.file_url}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="view pdf"
                className="block h-full"
                aria-label={`${cert.name}, ${cert.issuer}${date ? `, issued ${date}` : ""} (PDF, opens in a new tab)`}
              >
                <div
                  data-card-inner
                  className="credential relative flex h-full min-h-[17rem] flex-col justify-between gap-8 overflow-hidden rounded-2xl border border-line bg-surface p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, "0")} /{" "}
                      {String(certifications.length).padStart(2, "0")}
                    </span>
                    <span className="rounded-full border border-line px-3 py-1 font-mono text-xs whitespace-nowrap">
                      {cert.issuer}
                    </span>
                  </div>

                  <p className="font-head text-[1.75rem] leading-[1.02] hyphens-auto [overflow-wrap:break-word]">
                    {breakable(shortName(cert.name, cert.issuer ?? ""))}
                  </p>

                  <div className="flex items-end justify-between gap-4 border-t border-line pt-4">
                    {date ? (
                      <div>
                        <p className="label">issued</p>
                        <p className="mt-1 text-sm">{date}</p>
                      </div>
                    ) : (
                      <span className="label">{cert.issuer}</span>
                    )}
                    <span className="font-mono text-xs text-primary">open pdf ↗</span>
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
