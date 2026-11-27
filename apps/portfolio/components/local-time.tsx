"use client";

import { useEffect, useRef } from "react";

/**
 * Live local time in Longmont (America/Denver), ticking each second.
 *
 * Server-renders a placeholder and writes the time through a ref after mount:
 * the server's clock and the visitor's will never agree to the second, so
 * rendering the time on the server is a guaranteed hydration mismatch.
 */
const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Denver",
  timeZoneName: "short",
});

export default function LocalTime({ className }: { className?: string }) {
  const el = useRef<HTMLTimeElement>(null);

  useEffect(() => {
    const tick = () => {
      if (el.current) el.current.textContent = formatter.format(new Date());
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time ref={el} className={`tabular-nums ${className ?? ""}`} suppressHydrationWarning>
      --:--:--
    </time>
  );
}
