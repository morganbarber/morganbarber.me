"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "../utils";
import { INTRO_STORAGE_KEY } from "../intro";

/**
 * Boot-sequence intro.
 *
 * Kept as the site's signature, with three fixes:
 *
 * 1. It no longer renders at all on the server or the first client paint. The
 *    old version initialised `loading` to `true`, so a returning visitor saw
 *    the overlay flash before the `sessionStorage` check removed it.
 * 2. It honours `prefers-reduced-motion` — a full-screen animated overlay is a
 *    vestibular trigger, and the sequence is decorative.
 * 3. It is `aria-hidden` with `role="presentation"`: a screen reader user gets
 *    the content immediately rather than a fake boot log.
 *
 * It still runs once per tab, not once per navigation.
 */

const BOOT_SEQUENCE = [
  "INITIALIZING...",
  "LOADING ASSETS...",
  "PREPARING CONTENT...",
  "WELCOME",
] as const;

const STEP_MS = 400;
const HOLD_MS = 800;
// Shared with the pre-paint script in the app layout.
const STORAGE_KEY = INTRO_STORAGE_KEY;

export default function Loader() {
  /*
    Starts TRUE, so the overlay is in the server-rendered HTML.

    The previous version started false and switched on in an effect, which meant
    a first-time visitor's browser painted the whole page, hydrated, and only
    then slammed the overlay over it — a visible flash of content followed by
    the intro. Starting true fixes that, and the opposite case (a returning
    visitor who should never see it) is handled before first paint by a small
    inline script in the app layout: it marks <html data-intro-seen> and CSS
    hides [data-intro-overlay]. Neither path ever paints the wrong state.

    Server and client both start true, so there is no hydration mismatch.
  */
  const [phase, setPhase] = useState<"intro" | "leaving" | "done">("intro");
  const [currentLine, setCurrentLine] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // The pre-paint script in the app layout is the source of truth: it has
    // already weighed storage, reduced motion, crawlers and search referrals.
    let alreadyLoaded =
      reduceMotion === true || document.documentElement.hasAttribute("data-intro-seen");
    if (!alreadyLoaded) {
      try {
        alreadyLoaded = window.sessionStorage.getItem(STORAGE_KEY) === "true";
      } catch {
        // Locked-down browser profiles throw on storage access. Treat that as
        // "already seen" so the intro never becomes a per-navigation obstacle.
        alreadyLoaded = true;
      }
    }

    if (alreadyLoaded) {
      // The overlay is already display:none via the pre-paint script, so
      // unmounting it here changes nothing visible — it just tidies the DOM.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
      return;
    }

    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setCurrentLine((previous) => {
        if (previous >= BOOT_SEQUENCE.length - 1) {
          clearInterval(interval);
          holdTimer = setTimeout(() => {
            setPhase("leaving");
            try {
              window.sessionStorage.setItem(STORAGE_KEY, "true");
            } catch {
              /* nothing to do; the intro simply repeats next navigation */
            }
          }, HOLD_MS);
          return previous;
        }
        return previous + 1;
      });
    }, STEP_MS);

    return () => {
      clearInterval(interval);
      // The old version leaked this timer, so unmounting mid-sequence left a
      // setState scheduled against a dead component.
      if (holdTimer) clearTimeout(holdTimer);
    };
  }, [reduceMotion]);

  if (phase === "done") return null;

  /*
    The exit is a CSS animation, not a framer-motion `exit`.

    framer-motion runs opacity on the compositor (Web Animations API). When that
    exit finished, it cancelled the animation before React removed the node —
    and for exactly one frame the element fell back to its inline opacity:1,
    still mid-slide. A frame-by-frame trace in Chrome showed it: opacity 0.00,
    then 1.00, then gone. A full-screen flash at the very end of the intro.

    `animation-fill-mode: forwards` holds the final keyframe (opacity 0) for as
    long as the element exists, and the node is removed on `animationend`, so
    there is no frame in which it can revert. `pointer-events: none` during the
    exit means the page underneath is usable immediately.
  */
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-background text-primary font-mono select-none",
        phase === "leaving" && "intro-leaving pointer-events-none",
      )}
      // Decorative: the real content is already in the DOM behind it.
      aria-hidden="true"
      role="presentation"
      data-intro-overlay=""
      onAnimationEnd={(event) => {
        // Only the overlay's own exit — not a bubbling animationend from a
        // child line's entrance.
        if (event.target === event.currentTarget && phase === "leaving") {
          setPhase("done");
        }
      }}
    >
      <div className="w-full max-w-md p-4 space-y-2">
        {BOOT_SEQUENCE.slice(0, currentLine + 1).map((text, index) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "text-sm md:text-base border-l-2 pl-2 border-transparent",
              index === currentLine && "border-primary bg-primary/10",
            )}
          >
            <span className="opacity-75 mr-2">{`>0${index + 1}`}</span>
            {text}
          </motion.div>
        ))}

        <div className="h-2 w-full bg-muted mt-8 overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: "0%" }}
            animate={{
              width: `${((currentLine + 1) / BOOT_SEQUENCE.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
