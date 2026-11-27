"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";
import { copyText, emit, getLenis, isStatic, navigateTo, on, scrollToTarget } from "@/lib/motion";
import { HOME_SECTIONS, NAV_ITEMS, socialLabel } from "@/lib/site-nav";
import { SITE_CONFIG, SOCIAL_LINKS } from "@repo/config/site";

/**
 * ⌘K / Ctrl+K command palette. Also opens with "/" when focus is not in a
 * field, and from the header button.
 *
 * Built as a WAI-ARIA combobox over a listbox: typing filters, ↑/↓ moves the
 * active option, Enter runs it, Escape closes and returns focus to whatever
 * opened it.
 */

interface Command {
  id: string;
  group: "Go to" | "Jump to" | "Actions" | "Elsewhere";
  label: string;
  hint?: string;
  run: () => void;
}

/** Subsequence match: every query character appears in order. Lower is better. */
function score(label: string, query: string): number {
  if (!query) return 0;
  const text = label.toLowerCase();
  const q = query.toLowerCase();
  const direct = text.indexOf(q);
  if (direct !== -1) return direct;
  let last = -1;
  let gaps = 0;
  for (const ch of q) {
    const next = text.indexOf(ch, last + 1);
    if (next === -1) return Infinity;
    gaps += next - last - 1;
    last = next;
  }
  return 100 + gaps;
}

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

export default function CommandPalette() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const listId = useId();

  const commands = useMemo<Command[]>(() => {
    const go = NAV_ITEMS.map((item) => ({
      id: `go-${item.href}`,
      group: "Go to" as const,
      label: item.name,
      hint: item.href,
      run: () => navigateTo(item.href),
    }));
    const jump = HOME_SECTIONS.filter((s) => s.id !== "top").map((section) => ({
      id: `jump-${section.id}`,
      group: "Jump to" as const,
      label: section.label,
      hint: `/#${section.id}`,
      run: () => navigateTo(`/#${section.id}`),
    }));
    const actions: Command[] = [
      {
        id: "copy-email",
        group: "Actions",
        label: "Copy email address",
        hint: SITE_CONFIG.email,
        run: () => void copyText(SITE_CONFIG.email, "Email copied"),
      },
      {
        id: "top",
        group: "Actions",
        label: "Back to top",
        run: () => scrollToTarget(0),
      },
      {
        id: "root",
        group: "Actions",
        label: "Toggle root mode",
        hint: "↑↑↓↓←→←→BA",
        run: () => emit("mb:root", {}),
      },
    ];
    const elsewhere = [
      ...SOCIAL_LINKS.map((link) => ({
        id: `ext-${link.name}`,
        group: "Elsewhere" as const,
        label: socialLabel(link.name),
        hint: new URL(link.url).hostname,
        run: () => window.open(link.url, "_blank", "noopener,noreferrer"),
      })),
      {
        id: "rss",
        group: "Elsewhere" as const,
        label: "RSS feed",
        hint: "/blog/feed.xml",
        run: () => window.open("/blog/feed.xml", "_blank", "noopener"),
      },
    ];
    return [...go, ...jump, ...actions, ...elsewhere];
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return commands;
    return commands
      .map((command) => ({
        command,
        rank: score(`${command.label} ${command.hint ?? ""}`, query.trim()),
      }))
      .filter((entry) => entry.rank !== Infinity)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.command);
  }, [commands, query]);

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  // Global shortcuts + the header button's event.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      } else if (event.key === "/" && !isTyping(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    const off = on("mb:palette", (detail) => setOpen((value) => detail.open ?? !value));
    return () => {
      window.removeEventListener("keydown", onKey);
      off();
    };
  }, []);

  // Open / close choreography. Scroll is held while open.
  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const fast = isStatic();
      if (open) {
        returnFocus.current =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        getLenis()?.stop();
        gsap.set(el, { visibility: "visible" });
        gsap.fromTo(
          "[data-backdrop]",
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: fast ? 0 : 0.3 },
        );
        gsap.fromTo(
          "[data-panel]",
          // Opacity, not autoAlpha: a visibility:hidden panel cannot take focus.
          { opacity: 0, y: -24, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: fast ? 0 : 0.5 },
        );
        gsap.fromTo(
          "[data-option]",
          { autoAlpha: 0, x: -10 },
          { autoAlpha: 1, x: 0, duration: fast ? 0 : 0.4, stagger: 0.015, delay: 0.08 },
        );
        input.current?.focus();
      } else if (el.style.visibility === "visible") {
        getLenis()?.start();
        gsap.to("[data-panel]", { opacity: 0, y: -12, scale: 0.98, duration: fast ? 0 : 0.2 });
        gsap.to("[data-backdrop]", {
          autoAlpha: 0,
          duration: fast ? 0 : 0.25,
          onComplete: () => {
            gsap.set(el, { visibility: "hidden" });
          },
        });
        returnFocus.current?.focus();
      }
    },
    { scope: root, dependencies: [open] },
  );

  // Closing on navigation.
  const [routeAtOpen, setRouteAtOpen] = useState(pathname);
  if (routeAtOpen !== pathname) {
    setRouteAtOpen(pathname);
    if (open) setOpen(false);
  }

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const runCommand = (command: Command | undefined) => {
    if (!command) return;
    close();
    // Let the close animation start before navigating or scrolling.
    window.setTimeout(command.run, 120);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((activeIndex + 1) % Math.max(results.length, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((activeIndex - 1 + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runCommand(results[activeIndex]);
    } else if (event.key === "Tab") {
      // The input is the only focus stop; keep focus inside the dialog.
      event.preventDefault();
    }
  };

  // Keep the active option scrolled into view.
  useEffect(() => {
    root.current
      ?.querySelector(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div ref={root} className="invisible fixed inset-0 z-[96]" inert={!open} onKeyDown={onKeyDown}>
      <div
        data-backdrop
        className="absolute inset-0 bg-background/70 opacity-0 backdrop-blur-sm"
        onClick={close}
      />
      <div
        data-panel
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative mx-auto mt-[14vh] w-[min(92%,40rem)] overflow-hidden rounded-xl border border-line bg-surface opacity-0 shadow-2xl shadow-black/60"
      >
        <div className="flex items-center gap-3 border-b border-line px-5">
          <span aria-hidden="true" className="font-mono text-primary">
            &gt;
          </span>
          <input
            ref={input}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-activedescendant={results[activeIndex] ? `${listId}-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-label="Search commands"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Type a command or search…"
            spellCheck={false}
            className="h-14 w-full bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="kbd">esc</kbd>
        </div>

        <ul
          id={listId}
          role="listbox"
          aria-label="Commands"
          data-lenis-prevent
          className="max-h-[min(56vh,28rem)] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center font-mono text-sm text-muted-foreground">
              no match for “{query}”
            </li>
          ) : null}
          {results.map((command, index) => {
            const heading = command.group !== results[index - 1]?.group ? command.group : null;
            const selected = index === activeIndex;
            return (
              <li key={command.id} role="presentation">
                {heading ? (
                  <p
                    role="presentation"
                    className="px-3 pt-3 pb-1 font-mono text-xs text-muted-foreground"
                  >
                    {heading.toLowerCase()}
                  </p>
                ) : null}
                <div
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={selected}
                  data-option
                  data-index={index}
                  onMouseMove={() => {
                    if (!selected) setActive(index);
                  }}
                  onClick={() => runCommand(command)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2.5 text-sm ${
                    selected ? "bg-primary text-background" : "text-foreground"
                  }`}
                >
                  <span>{command.label}</span>
                  {command.hint ? (
                    <span
                      className={`truncate font-mono text-xs ${
                        selected ? "text-background/75" : "text-muted-foreground"
                      }`}
                    >
                      {command.hint}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex gap-5 border-t border-line px-5 py-3 font-mono text-xs text-muted-foreground">
          <span>
            <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> move
          </span>
          <span>
            <kbd className="kbd">↵</kbd> run
          </span>
          <span className="ml-auto hidden sm:inline">
            <kbd className="kbd">/</kbd> or <kbd className="kbd">⌘K</kbd> anywhere
          </span>
        </div>
      </div>
    </div>
  );
}
