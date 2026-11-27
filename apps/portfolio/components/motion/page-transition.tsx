"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis, isStatic, on, scrollToTarget } from "@/lib/motion";

/**
 * Route transitions: a five-column shutter closes, the route changes behind
 * it, and the shutter opens upward onto the new page.
 *
 * App Router has no exit hook, so internal link clicks are intercepted in the
 * capture phase — before next/link sees them — and navigation happens through
 * the router once the cover is closed. Anything that is not a plain left-click
 * on a same-origin page link (new-tab modifiers, target=_blank, downloads,
 * files like .pdf and .xml) is left completely alone. In-page hash links
 * scroll through Lenis instead of jumping.
 *
 * Reduced motion: navigation is immediate, with no cover.
 */

const PANELS = 5;
const SAFETY_MS = 6000;

function routeLabel(pathname: string): string {
  if (pathname === "/") return "~/home";
  return `~${pathname}`;
}

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const covering = useRef(false);
  const pendingHash = useRef<string | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Opens the shutter. Shared by the route-change effect and the safety timer.
  const uncover = useCallback(() => {
    const el = root.current;
    if (!el || !covering.current) return;
    if (safety.current) clearTimeout(safety.current);

    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
    ScrollTrigger.refresh();

    const hash = pendingHash.current;
    pendingHash.current = null;

    gsap
      .timeline({
        onComplete: () => {
          covering.current = false;
          gsap.set(el, { visibility: "hidden" });
          if (hash) scrollToTarget(hash);
        },
      })
      .to(label.current, { autoAlpha: 0, y: -24, duration: 0.35, ease: "power2.in" })
      .to(
        el.querySelectorAll("[data-panel]"),
        {
          scaleY: 0,
          transformOrigin: "top center",
          duration: 0.75,
          stagger: { each: 0.06, from: "end" },
          ease: "mb.inOut",
        },
        0.1,
      );
  }, []);

  // A route change landed: open onto it.
  useEffect(() => {
    if (covering.current) uncover();
  }, [pathname, uncover]);

  useEffect(() => {
    const navigate = (href: string, hash: string) => {
      if (covering.current) return;
      const el = root.current;
      if (isStatic() || !el) {
        router.push(href + hash);
        return;
      }

      covering.current = true;
      pendingHash.current = hash || null;
      const target = new URL(href, window.location.href).pathname;
      if (label.current) label.current.textContent = routeLabel(target);

      gsap
        .timeline()
        .set(el, { visibility: "visible" })
        .fromTo(
          el.querySelectorAll("[data-panel]"),
          { scaleY: 0, transformOrigin: "bottom center" },
          { scaleY: 1, duration: 0.6, stagger: 0.06, ease: "mb.inOut" },
        )
        .fromTo(
          label.current,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            scrambleText: { text: routeLabel(target), chars: "/~_-01" },
          },
          0.35,
        )
        .call(() => {
          router.push(href, { scroll: false });
          safety.current = setTimeout(uncover, SAFETY_MS);
        });
    };

    /** Returns false when the URL is not a route this should handle. */
    const go = (url: URL): boolean => {
      if (url.origin !== window.location.origin) return false;
      // Files (PDF certificates, the RSS feed, llms.txt) are not routes.
      if (/\.[a-z0-9]+$/i.test(url.pathname)) return false;

      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        if (url.hash) {
          const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (target) scrollToTarget(target);
          window.history.replaceState(null, "", url.hash);
        } else {
          scrollToTarget(0);
        }
        return true;
      }

      navigate(url.pathname + url.search, url.hash);
      return true;
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = event.target instanceof Element ? event.target.closest("a") : null;
      if (!anchor || !anchor.href) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      if (anchor.hasAttribute("data-no-transition")) return;

      if (go(new URL(anchor.href, window.location.href))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const off = on("mb:navigate", ({ href }) => {
      const url = new URL(href, window.location.href);
      if (!go(url)) window.location.assign(url.href);
    });

    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      off();
      if (safety.current) clearTimeout(safety.current);
    };
  }, [router, uncover]);

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-[95] flex"
    >
      {Array.from({ length: PANELS }, (_, i) => (
        <div key={i} data-panel className="h-full flex-1 scale-y-0 bg-surface" />
      ))}
      <div className="absolute inset-0 grid place-items-center">
        <span ref={label} className="font-mono text-sm text-primary opacity-0 md:text-base" />
      </div>
    </div>
  );
}
