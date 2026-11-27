"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, SplitText } from "@/lib/gsap";
import { copyText, isStatic, scrollToTarget } from "@/lib/motion";
import { NAV_ITEMS, socialLabel } from "@/lib/site-nav";
import { SITE_CONFIG, SOCIAL_LINKS } from "@repo/config/site";
import LocalTime from "@/components/local-time";

/**
 * Footer: a giant wordmark whose letters rise out of the floor as the page
 * runs out, scrubbed to the scroll, above the link columns.
 */
export default function Footer({ year }: { year: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (isStatic()) return;
      const mark = root.current?.querySelector<HTMLElement>("[data-wordmark]");
      if (!mark) return;
      SplitText.create(mark, {
        type: "chars",
        mask: "chars",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.chars, {
            yPercent: 100,
            ease: "none",
            stagger: { each: 0.04, from: "center" },
            scrollTrigger: {
              trigger: root.current,
              start: "top 85%",
              end: "bottom bottom",
              scrub: 0.6,
            },
          }),
      });
    },
    { scope: root },
  );

  return (
    <footer ref={root} className="relative overflow-hidden border-t border-line pt-20">
      <div className="shell grid gap-12 pb-16 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="max-w-sm">
          <p className="text-2xl leading-snug font-medium tracking-tight">
            Ethical hacker in Longmont, Colorado. Open to internships and security conversations.
          </p>
          <button
            type="button"
            onClick={() => void copyText(SITE_CONFIG.email, "Email copied")}
            data-cursor="copy"
            className="mt-6 font-mono text-sm text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
          >
            {SITE_CONFIG.email}
          </button>
        </div>

        <nav aria-label="Footer">
          <p className="label mb-4">pages</p>
          <ul className="space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="link-quiet">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="label mb-4">elsewhere</p>
          <ul className="space-y-2 text-sm">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.name}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer external"
                  className="link-quiet"
                >
                  {socialLabel(link.name)}
                </a>
              </li>
            ))}
            <li>
              <a href="/blog/feed.xml" className="link-quiet">
                RSS feed
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="label mb-4">local time</p>
          <p className="font-mono text-sm">
            <LocalTime />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{SITE_CONFIG.location}</p>
          <button
            type="button"
            onClick={() => scrollToTarget(0)}
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            Back to top
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>

      <div className="shell flex flex-wrap items-center justify-between gap-4 border-t border-line py-6 font-mono text-xs text-muted-foreground">
        <span>
          © {year} {SITE_CONFIG.name}
        </span>
        <span>
          press <kbd className="kbd">/</kbd> for commands, or try the konami code
        </span>
      </div>

      <p
        data-wordmark
        aria-hidden="true"
        className="font-display pointer-events-none -mb-[0.2em] text-center text-[8.4vw] leading-[0.9] whitespace-nowrap text-foreground/[0.07] select-none"
      >
        MORGAN BARBER
      </p>
    </footer>
  );
}
