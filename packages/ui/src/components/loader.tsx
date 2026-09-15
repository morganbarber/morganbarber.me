"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "../utils";

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
const STORAGE_KEY = "portfolio_loaded";

export default function Loader() {
  // Starts false so nothing is painted until we know it should be.
  const [loading, setLoading] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    let alreadyLoaded = false;
    try {
      alreadyLoaded = window.sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      // Locked-down browser profiles throw on storage access. Treat that as
      // "already seen" so the intro never becomes a per-navigation obstacle.
      alreadyLoaded = true;
    }
    if (alreadyLoaded) return;

    // Syncing with an external store (sessionStorage) that cannot be read
    // during render: the server has no access to it, so reading it in a
    // useState initialiser would make the server and client disagree and break
    // hydration. Starting false and enabling here is the correct trade — it
    // costs one extra client render and guarantees no hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setCurrentLine((previous) => {
        if (previous >= BOOT_SEQUENCE.length - 1) {
          clearInterval(interval);
          holdTimer = setTimeout(() => {
            setLoading(false);
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

  return (
    <AnimatePresence>
      {loading ? (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.5, ease: "circIn" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background text-primary font-mono select-none"
          // Decorative: the real content is already in the DOM behind it.
          aria-hidden="true"
          role="presentation"
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
                <span className="opacity-50 mr-2">{`>0${index + 1}`}</span>
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
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
