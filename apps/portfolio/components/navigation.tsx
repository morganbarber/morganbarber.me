"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@repo/ui/utils";

/**
 * Site navigation.
 *
 * The previous version rendered a single always-horizontal `<ul>` with
 * `gap-8`, which overflowed the viewport on any phone — six items simply did
 * not fit. This adds a proper mobile drawer and fixes the accessibility gaps
 * that came with it:
 *
 *   • real landmark + `aria-current` on the active link
 *   • the toggle is a button with `aria-expanded` / `aria-controls`
 *   • Escape closes the drawer and focus returns to the toggle
 *   • body scroll is locked while the drawer is open
 *   • honours `prefers-reduced-motion`
 *
 * `mix-blend-difference` was also removed from the header: combined with the
 * backdrop blur it made the active-link colour unreadable over light sections.
 */

const NAV_ITEMS = [
  { name: "HOME", href: "/" },
  { name: "ABOUT", href: "/about" },
  { name: "EXP", href: "/experience" },
  { name: "PROJECTS", href: "/projects" },
  { name: "BLOG", href: "/blog" },
  { name: "CONTACT", href: "/contact" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // Marks /blog active while reading /blog/some-post.
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Navigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  /*
    Close the drawer on navigation by adjusting state during render rather than
    in an effect. An effect would paint the new route with the menu still open
    and then immediately re-render to close it — a visible flash, and the
    cascading render that `react-hooks/set-state-in-effect` warns about. React
    discards this render and restarts before committing, so nothing is painted
    in the stale state.
  */
  const [routeAtOpen, setRouteAtOpen] = useState(pathname);
  if (routeAtOpen !== pathname) {
    setRouteAtOpen(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    // Locking scroll prevents the page behind the drawer from moving under it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const linkClass = (active: boolean) =>
    cn(
      "relative font-mono tracking-widest transition-colors hover:text-primary",
      "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
      active ? "text-primary" : "text-foreground",
    );

  return (
    <header className="fixed top-0 left-0 w-full z-40 bg-background/80 backdrop-blur-md border-b border-muted">
      {/* Keyboard users can jump straight past the nav. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:text-background focus:px-4 focus:py-2 focus:font-mono focus:text-sm"
      >
        SKIP TO CONTENT
      </a>

      <nav
        aria-label="Primary"
        className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto"
      >
        <Link
          href="/"
          className="font-sans text-xl font-bold tracking-tighter hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          morganbarber.me
        </Link>

        {/* Desktop */}
        <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(linkClass(active), "text-sm")}
                >
                  {item.name}
                  {active ? (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 w-full h-[2px] bg-primary"
                      transition={reduceMotion ? { duration: 0 } : undefined}
                    />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden p-2 -mr-2 text-foreground hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {open ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={reduceMotion ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden border-t border-muted bg-background/95 backdrop-blur-md"
          >
            <ul className="flex flex-col list-none m-0 p-0">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.name} className="border-b border-muted/50 last:border-b-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        linkClass(active),
                        "block px-6 py-4 text-base",
                        active && "bg-primary/5",
                      )}
                    >
                      <span className="text-primary/50 mr-3">&gt;</span>
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
