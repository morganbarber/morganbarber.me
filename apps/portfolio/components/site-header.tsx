"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { emit, getLenis, isStatic } from "@/lib/motion";
import { NAV_ITEMS, isActivePath, socialLabel } from "@/lib/site-nav";
import { SITE_CONFIG, SOCIAL_LINKS } from "@repo/config/site";
import ScrambleLink from "@/components/motion/scramble-link";

/**
 * Site header.
 *
 *   • slides away while scrolling down, returns on any scroll up
 *   • transparent over the top of a page, a blurred bar once scrolled
 *   • the active route carries a sliding marker that travels between links
 *   • a full-screen menu on small screens, with the links rising in
 *
 * The mobile menu is a real disclosure: the toggle has aria-expanded, Escape
 * closes it and returns focus, the page behind is inert and does not scroll.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // Close the menu on navigation (during render, not in an effect: no flash).
  const [routeAtOpen, setRouteAtOpen] = useState(pathname);
  if (routeAtOpen !== pathname) {
    setRouteAtOpen(pathname);
    if (open) setOpen(false);
  }

  // Hide on scroll down, show on scroll up; solid once off the top.
  useGSAP(
    () => {
      const el = header.current;
      if (!el) return;
      let hidden = false;

      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          el.toggleAttribute("data-scrolled", self.scroll() > 40);
          if (isStatic()) return;
          const shouldHide = self.direction === 1 && self.scroll() > 240;
          if (shouldHide === hidden) return;
          hidden = shouldHide;
          gsap.to(el, {
            yPercent: hidden ? -110 : 0,
            duration: 0.45,
            ease: hidden ? "power3.in" : "mb.out",
            overwrite: true,
          });
        },
      });
    },
    { scope: header },
  );

  // The active-route marker slides between links.
  useGSAP(
    () => {
      const bar = marker.current;
      const active = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!bar) return;
      if (!active) {
        gsap.to(bar, { autoAlpha: 0, duration: 0.2 });
        return;
      }
      const parent = list.current!.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      gsap.to(bar, {
        autoAlpha: 1,
        x: rect.left - parent.left,
        width: rect.width,
        duration: isStatic() ? 0 : 0.6,
      });
    },
    { dependencies: [pathname], scope: header },
  );

  // Mobile menu choreography.
  useGSAP(
    () => {
      const el = menu.current;
      if (!el) return;
      const fast = isStatic();
      if (open) {
        getLenis()?.stop();
        gsap.to(header.current, { yPercent: 0, duration: 0.3, overwrite: true });
        document.body.style.overflow = "hidden";
        gsap
          .timeline()
          .set(el, { visibility: "visible" })
          .fromTo(
            el,
            { clipPath: "inset(0 0 100% 0)" },
            { clipPath: "inset(0 0 0% 0)", duration: fast ? 0 : 0.7, ease: "mb.inOut" },
          )
          .fromTo(
            "[data-menu-link]",
            { yPercent: 110 },
            { yPercent: 0, duration: fast ? 0 : 0.8, stagger: 0.05 },
            fast ? 0 : 0.3,
          )
          .fromTo("[data-menu-foot]", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, "<0.2");
      } else if (el.style.visibility === "visible") {
        getLenis()?.start();
        document.body.style.overflow = "";
        gsap.to(el, {
          clipPath: "inset(0 0 100% 0)",
          duration: fast ? 0 : 0.5,
          ease: "mb.inOut",
          onComplete: () => {
            gsap.set(el, { visibility: "hidden" });
          },
        });
      }
    },
    { dependencies: [open], scope: menu },
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        ref={header}
        className="site-header fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color] duration-500"
      >
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <nav
          aria-label="Primary"
          className="shell flex h-16 items-center justify-between gap-6 md:h-20"
        >
          <Link
            href="/"
            className="group flex items-center gap-3"
            aria-label="Morgan Barber — home"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-md border border-line font-mono text-xs transition-colors group-hover:border-primary group-hover:text-primary"
            >
              mb
            </span>
            <span className="hidden font-medium tracking-tight sm:inline">Morgan Barber</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <ul ref={list} className="relative flex items-center gap-7">
              {NAV_ITEMS.slice(1).map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <ScrambleLink
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`text-sm transition-colors hover:text-foreground ${
                        active ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                    </ScrambleLink>
                  </li>
                );
              })}
              <span
                ref={marker}
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 left-0 h-px w-0 bg-primary opacity-0"
              />
            </ul>

            <button
              type="button"
              onClick={() => emit("mb:palette", { open: true })}
              className="flex items-center gap-3 rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
            >
              search
              <kbd className="kbd">⌘K</kbd>
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => emit("mb:palette", { open: true })}
              className="rounded-md border border-line px-3 py-2 font-mono text-xs text-muted-foreground"
              aria-label="Open command palette"
            >
              ⌘K
            </button>
            <button
              ref={toggle}
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="relative z-10 grid size-10 place-items-center"
            >
              <span aria-hidden="true" className="flex w-6 flex-col gap-1.5">
                <span
                  className={`h-px w-full bg-foreground transition-transform duration-300 ${
                    open ? "translate-y-[3.5px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-px w-full bg-foreground transition-transform duration-300 ${
                    open ? "-translate-y-[3.5px] -rotate-45" : ""
                  }`}
                />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <div
        ref={menu}
        id="mobile-menu"
        inert={!open}
        className="invisible fixed inset-0 z-[45] flex flex-col justify-between bg-surface px-6 pt-24 pb-10 md:hidden"
      >
        <ul className="space-y-1">
          {NAV_ITEMS.map((item, i) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href} className="overflow-hidden">
                <Link
                  href={item.href}
                  data-menu-link
                  aria-current={active ? "page" : undefined}
                  className={`flex items-baseline gap-4 font-display text-5xl leading-[1.05] ${
                    active ? "text-primary" : "text-foreground"
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <div data-menu-foot className="space-y-3 font-mono text-sm text-muted-foreground">
          <a href={`mailto:${SITE_CONFIG.email}`} className="block text-foreground">
            {SITE_CONFIG.email}
          </a>
          <ul className="flex gap-5">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.name}>
                <a href={link.url} target="_blank" rel="noopener noreferrer external">
                  {socialLabel(link.name)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
