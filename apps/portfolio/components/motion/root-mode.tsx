"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { isStatic, on, toast } from "@/lib/motion";

/**
 * Root mode — the easter egg.
 *
 * The Konami code (↑ ↑ ↓ ↓ ← → ← → B A), `sudo su` in the terminal, or the
 * command palette toggles it. The accent swaps to the phosphor green of the
 * old site, and a burst of digital rain crosses the screen. Remembered for the
 * tab in sessionStorage.
 */

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const STORAGE_KEY = "mb_root";
const GLYPHS = "01アイウエオカキクケコサシスセソ<>/{}[]#$%";

function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
  );
}

export default function RootMode() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    try {
      if (window.sessionStorage.getItem(STORAGE_KEY) === "1") html.setAttribute("data-root", "");
    } catch {
      /* storage blocked */
    }

    const rain = () => {
      const el = canvas.current;
      const ctx = el?.getContext("2d");
      if (!el || !ctx || isStatic()) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      el.width = window.innerWidth * dpr;
      el.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      const size = 16;
      const columns = Math.ceil(window.innerWidth / size);
      const drops = Array.from({ length: columns }, () => Math.random() * -40);
      const color = getComputedStyle(html).getPropertyValue("--primary").trim() || "#3dff7a";
      ctx.font = `${size}px ui-monospace, monospace`;
      const fade = getComputedStyle(html).getPropertyValue("--background").trim() || "#08090b";

      const draw = () => {
        // Translucent wash of the page background: older glyphs fade into trails.
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = fade;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        drops.forEach((y, i) => {
          const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0";
          ctx.fillText(glyph, i * size, y * size);
          drops[i] = y > window.innerHeight / size && Math.random() > 0.96 ? 0 : y + 1;
        });
      };

      gsap.ticker.add(draw);
      gsap
        .timeline({
          onComplete: () => {
            gsap.ticker.remove(draw);
            ctx.clearRect(0, 0, el.width, el.height);
          },
        })
        .set(el, { autoAlpha: 1 })
        .to(el, { autoAlpha: 0, duration: 0.8, delay: 1.8 });
    };

    const toggle = (force?: boolean) => {
      const next = force ?? !html.hasAttribute("data-root");
      html.toggleAttribute("data-root", next);
      try {
        window.sessionStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked */
      }
      if (next) {
        rain();
        toast("root shell obtained — # whoami → root", "success");
      } else {
        toast("dropped privileges — back to user");
      }
    };

    let position = 0;
    const onKey = (event: KeyboardEvent) => {
      if (isTyping(event.target)) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      position = key === SEQUENCE[position] ? position + 1 : key === SEQUENCE[0] ? 1 : 0;
      if (position === SEQUENCE.length) {
        position = 0;
        toggle();
      }
    };

    window.addEventListener("keydown", onKey);
    const off = on("mb:root", (detail) => toggle(detail.on));
    return () => {
      window.removeEventListener("keydown", onKey);
      off();
    };
  }, []);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none invisible fixed inset-0 z-[80] h-full w-full opacity-0"
    />
  );
}
