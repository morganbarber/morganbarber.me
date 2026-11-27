"use client";

import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";

/**
 * The hero background: a field of points that behaves like a sensor grid.
 *
 *   • points near the pointer are pushed away and light up in the signal colour
 *   • a click sends a ripple out through the field
 *   • every few seconds a "packet" runs along a random row, like traffic
 *
 * Drawn on one canvas from gsap.ticker (no React renders), paused whenever the
 * hero is off screen. Reduced motion gets a single still frame.
 */

const SPACING = 30;
const RADIUS = 160;
const PUSH = 22;

interface Ripple {
  x: number;
  y: number;
  r: number;
  life: number;
}

interface Packet {
  row: number;
  x: number;
  speed: number;
}

export default function SignalField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--foreground").trim() || "#ecebe6";
    let signal = css.getPropertyValue("--primary").trim() || "#ff5a36";

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const ripples: Ripple[] = [];
    const packets: Packet[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / SPACING) + 1;
      rows = Math.ceil(height / SPACING) + 1;
    };

    const draw = () => {
      // Ease the pointer so the field flows rather than snaps.
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;

      ctx.clearRect(0, 0, width, height);
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = offsetX + c * SPACING;
          let y = offsetY + r * SPACING;
          let energy = 0;

          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < RADIUS && dist > 0.01) {
            const force = 1 - dist / RADIUS;
            x += (dx / dist) * force * force * PUSH;
            y += (dy / dist) * force * force * PUSH;
            energy = force;
          }

          for (const ripple of ripples) {
            const rd = Math.hypot(x - ripple.x, y - ripple.y);
            const band = 1 - Math.min(Math.abs(rd - ripple.r) / 40, 1);
            if (band > 0) {
              const lift = band * ripple.life;
              x += ((x - ripple.x) / (rd || 1)) * lift * 10;
              y += ((y - ripple.y) / (rd || 1)) * lift * 10;
              energy = Math.max(energy, lift);
            }
          }

          for (const packet of packets) {
            if (packet.row === r) {
              const pd = Math.abs(x - packet.x);
              if (pd < 90) energy = Math.max(energy, (1 - pd / 90) * 0.9);
            }
          }

          if (energy > 0.02) {
            ctx.globalAlpha = 0.25 + energy * 0.75;
            ctx.fillStyle = signal;
            const size = 1.4 + energy * 2.2;
            ctx.fillRect(x - size / 2, y - size / 2, size, size);
          } else {
            ctx.globalAlpha = 0.16;
            ctx.fillStyle = ink;
            ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
          }
        }
      }
      ctx.globalAlpha = 1;

      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i]!;
        ripple.r += 9;
        ripple.life *= 0.965;
        if (ripple.life < 0.03) ripples.splice(i, 1);
      }
      for (let i = packets.length - 1; i >= 0; i--) {
        const packet = packets[i]!;
        packet.x += packet.speed;
        if (packet.x > width + 120) packets.splice(i, 1);
      }
    };

    resize();
    if (isStatic()) {
      draw();
      return;
    }

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      gsap.ticker.add(draw);
    };
    const stop = () => {
      running = false;
      gsap.ticker.remove(draw);
    };

    const host = canvas.parentElement ?? canvas;
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = event.clientX - rect.left;
      pointer.ty = event.clientY - rect.top;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    };
    const onLeave = () => {
      pointer.tx = -9999;
      pointer.ty = -9999;
    };
    const onDown = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ripples.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, r: 0, life: 1 });
    };

    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", resize);

    // Root mode swaps --primary; pick it up.
    const observer = new MutationObserver(() => {
      signal = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-root"],
    });

    const packetTimer = gsap.delayedCall(1.2, function spawn() {
      if (running) {
        packets.push({
          row: Math.floor(Math.random() * rows),
          x: -100,
          speed: 6 + Math.random() * 6,
        });
      }
      packetTimer.delay(1.5 + Math.random() * 2.5);
      packetTimer.restart(true);
    });

    ScrollTrigger.create({
      trigger: host,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? start() : stop()),
    });
    start();

    return () => {
      stop();
      packetTimer.kill();
      observer.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
    };
  });

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
