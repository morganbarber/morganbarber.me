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
 * Performance — this runs behind the first screen, so it must be nearly free:
 *
 *   • The resting grid is drawn ONCE to an offscreen canvas. A frame repaints
 *     only the dirty rectangles (around the pointer, along a packet's row, and
 *     wherever those were last frame) from that image, then redraws only the
 *     points something disturbs: a few dozen instead of ~2,000, and a small
 *     texture upload instead of the whole canvas.
 *   • When nothing is disturbing the field (pointer still or away, no ripple,
 *     no packet) the frame is skipped entirely; the canvas keeps its pixels.
 *   • It stops whenever the hero is off screen. Device pixel ratio is capped at
 *     1.5: the points are 1–4px squares, and sharper buys nothing.
 *   • Pointer positions are computed from a cached page offset, never from a
 *     layout read per event.
 *
 * Measured before this rewrite: ~2.4 s of main-thread time per 4 s idle on the
 * hero at 4x CPU throttle. Reduced motion gets a single still frame.
 */

const SPACING = 30;
const RADIUS = 160;
const PUSH = 22;
const PACKET_REACH = 90;

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

type Hit = [col: number, row: number, x: number, y: number, energy: number];
type Rect = [x: number, y: number, w: number, h: number];

export default function SignalField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGSAP(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const base = document.createElement("canvas");
    const baseCtx = base.getContext("2d");
    if (!canvas || !ctx || !baseCtx) return;

    const css = getComputedStyle(document.documentElement);
    const ink = css.getPropertyValue("--foreground").trim() || "#ecebe6";
    let signal = css.getPropertyValue("--primary").trim() || "#ff5a36";

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let offsetX = 0;
    let offsetY = 0;
    // The canvas's position in page coordinates (stable while scrolling).
    let pageLeft = 0;
    let pageTop = 0;
    let dpr = 1;
    const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const ripples: Ripple[] = [];
    const packets: Packet[] = [];
    let dirty = true;
    let lastRegions: Rect[] = [];
    let fullNext = true;

    const measure = () => {
      const rect = canvas.getBoundingClientRect();
      pageLeft = rect.left + window.scrollX;
      pageTop = rect.top + window.scrollY;
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      for (const c of [canvas, base]) {
        c.width = Math.round(width * dpr);
        c.height = Math.round(height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / SPACING) + 1;
      rows = Math.ceil(height / SPACING) + 1;
      offsetX = (width - (cols - 1) * SPACING) / 2;
      offsetY = (height - (rows - 1) * SPACING) / 2;

      // The resting field, drawn once.
      baseCtx.clearRect(0, 0, width, height);
      baseCtx.globalAlpha = 0.16;
      baseCtx.fillStyle = ink;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          baseCtx.fillRect(offsetX + c * SPACING - 0.7, offsetY + r * SPACING - 0.7, 1.4, 1.4);
        }
      }
      measure();
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(base, 0, 0, width, height);
      lastRegions = [];
      dirty = true;
    };

    /** A grid point's displaced position and energy, or null if at rest. */
    const disturb = (c: number, r: number): [number, number, number] | null => {
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
          if (pd < PACKET_REACH) energy = Math.max(energy, (1 - pd / PACKET_REACH) * 0.9);
        }
      }
      return energy > 0.02 ? [x, y, energy] : null;
    };

    const draw = () => {
      const px = pointer.x;
      const py = pointer.y;
      pointer.x += (pointer.tx - pointer.x) * 0.12;
      pointer.y += (pointer.ty - pointer.y) * 0.12;
      const pointerMoving = Math.abs(pointer.x - px) > 0.05 || Math.abs(pointer.y - py) > 0.05;
      const active = pointerMoving || ripples.length > 0 || packets.length > 0;

      // Nothing changing: keep the last frame's pixels.
      if (!active && !dirty) return;
      dirty = active;

      // Repaint only what changed: this frame's disturbed regions plus last
      // frame's (to erase what was drawn there). A full redraw re-uploads the
      // whole canvas to the compositor every frame.
      const regions: Rect[] = [];
      if (pointer.x > -1000) {
        const reach = RADIUS + PUSH + 4;
        regions.push([pointer.x - reach, pointer.y - reach, reach * 2, reach * 2]);
      }
      for (const packet of packets) {
        const y = offsetY + packet.row * SPACING;
        regions.push([packet.x - PACKET_REACH - 12, y - 6, PACKET_REACH * 2 + 24, 12]);
      }
      const full = ripples.length > 0 || fullNext;
      fullNext = ripples.length > 0; // one more full frame to clear the last ring
      ctx.globalAlpha = 1;
      for (const [x, y, w, h] of full
        ? [[0, 0, width, height] as Rect]
        : [...regions, ...lastRegions]) {
        const x0 = Math.max(0, Math.floor(x));
        const y0 = Math.max(0, Math.floor(y));
        const x1 = Math.min(width, Math.ceil(x + w));
        const y1 = Math.min(height, Math.ceil(y + h));
        if (x1 <= x0 || y1 <= y0) continue;
        ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
        ctx.drawImage(
          base,
          x0 * dpr,
          y0 * dpr,
          (x1 - x0) * dpr,
          (y1 - y0) * dpr,
          x0,
          y0,
          x1 - x0,
          y1 - y0,
        );
      }
      lastRegions = regions;

      const seen = new Set<number>();
      const hits: Hit[] = [];
      const visit = (c: number, r: number) => {
        if (c < 0 || r < 0 || c >= cols || r >= rows) return;
        const key = r * cols + c;
        if (seen.has(key)) return;
        seen.add(key);
        const hit = disturb(c, r);
        if (hit) hits.push([c, r, hit[0], hit[1], hit[2]]);
      };

      if (pointer.x > -1000) {
        const c0 = Math.floor((pointer.x - RADIUS - offsetX) / SPACING);
        const c1 = Math.ceil((pointer.x + RADIUS - offsetX) / SPACING);
        const r0 = Math.floor((pointer.y - RADIUS - offsetY) / SPACING);
        const r1 = Math.ceil((pointer.y + RADIUS - offsetY) / SPACING);
        for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) visit(c, r);
      }
      for (const packet of packets) {
        const c0 = Math.floor((packet.x - PACKET_REACH - offsetX) / SPACING);
        const c1 = Math.ceil((packet.x + PACKET_REACH - offsetX) / SPACING);
        for (let c = c0; c <= c1; c++) visit(c, packet.row);
      }
      if (ripples.length) {
        // A ripple sweeps the whole field; rare and short-lived.
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) visit(c, r);
      }

      ctx.fillStyle = signal;
      for (const [c, r, x, y, energy] of hits) {
        // Erase the resting point, then draw it displaced and lit.
        ctx.clearRect(offsetX + c * SPACING - 1, offsetY + r * SPACING - 1, 2, 2);
        ctx.globalAlpha = 0.25 + energy * 0.75;
        const size = 1.4 + energy * 2.2;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
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
        if (packet.x > width + PACKET_REACH) packets.splice(i, 1);
      }
    };

    resize();
    if (isStatic()) return;

    let running = false;
    const start = () => {
      if (running) return;
      running = true;
      dirty = true;
      gsap.ticker.add(draw);
    };
    const stop = () => {
      running = false;
      gsap.ticker.remove(draw);
    };

    // Listen on the whole hero, not the canvas's wrapper: the field sits
    // behind the content (-z-10), so pointer events land on the headline and
    // buttons above it and never reach the wrapper itself.
    const host = canvas.closest("section") ?? canvas.parentElement ?? canvas;
    const onMove = (event: PointerEvent) => {
      pointer.tx = event.pageX - pageLeft;
      pointer.ty = event.pageY - pageTop;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    };
    const onLeave = () => {
      // Erase the lit region where the pointer was before forgetting it.
      pointer.tx = pointer.ty = pointer.x = pointer.y = -9999;
      dirty = true;
    };
    const onDown = (event: PointerEvent) => {
      ripples.push({ x: event.pageX - pageLeft, y: event.pageY - pageTop, r: 0, life: 1 });
    };

    host.addEventListener("pointerenter", measure);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    window.addEventListener("resize", resize);

    // Root mode swaps --primary; pick it up.
    const observer = new MutationObserver(() => {
      signal = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
      dirty = true;
      fullNext = true;
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-root"],
    });

    const packetTimer = gsap.delayedCall(1.2, function spawn() {
      if (running && packets.length < 2) {
        packets.push({
          row: Math.floor(Math.random() * rows),
          x: -100,
          speed: 6 + Math.random() * 6,
        });
      }
      packetTimer.delay(2 + Math.random() * 3);
      packetTimer.restart(true);
    });

    ScrollTrigger.create({
      trigger: host,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (self.isActive ? start() : stop()),
      onRefresh: measure,
    });
    start();

    return () => {
      stop();
      packetTimer.kill();
      observer.disconnect();
      host.removeEventListener("pointerenter", measure);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
    };
  });

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
