"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import type { Flip as FlipPlugin } from "gsap/Flip";
import { hasFinePointer, isStatic } from "@/lib/motion";
import type { ProjectSummary } from "@repo/types";

/**
 * Projects as an index: big ruled rows, the whole row is the link.
 *
 *   • on hover, a preview card follows the pointer with the project's
 *     category, status, stack and summary, and the row's title slides over
 *   • with `filterable`, category chips filter the list; rows that stay FLIP
 *     into their new places while the rest fade out
 *
 * Touch devices get the summary inline instead of the floating card.
 */
export default function ProjectList({
  projects,
  filterable = false,
}: {
  projects: ProjectSummary[];
  filterable?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<string>("all");
  const [hovered, setHovered] = useState<ProjectSummary | null>(null);
  const flipState = useRef<ReturnType<typeof FlipPlugin.getState> | null>(null);
  const flip = useRef<typeof FlipPlugin | null>(null);

  const categories = useMemo(
    () => ["all", ...new Set(projects.map((p) => p.category.toLowerCase()))],
    [projects],
  );
  const visible =
    filter === "all" ? projects : projects.filter((p) => p.category.toLowerCase() === filter);

  // Cursor-following preview card.
  useGSAP(
    () => {
      const card = preview.current;
      const list = root.current;
      if (!card || !list || isStatic() || !hasFinePointer()) return;
      gsap.set(card, { xPercent: -50, yPercent: -50, scale: 0.6, autoAlpha: 0 });
      const x = gsap.quickTo(card, "x", { duration: 0.6, ease: "power3" });
      const y = gsap.quickTo(card, "y", { duration: 0.6, ease: "power3" });
      const rot = gsap.quickTo(card, "rotation", { duration: 0.8, ease: "power3" });
      let lastX = 0;
      const move = (event: PointerEvent) => {
        x(event.clientX);
        y(event.clientY);
        rot(gsap.utils.clamp(-8, 8, (event.clientX - lastX) * 0.6));
        lastX = event.clientX;
      };
      list.addEventListener("pointermove", move);
      return () => list.removeEventListener("pointermove", move);
    },
    { scope: root },
  );

  const showPreview = (project: ProjectSummary | null) => {
    setHovered(project);
    const card = preview.current;
    if (!card || isStatic() || !hasFinePointer()) return;
    gsap.to(card, {
      autoAlpha: project ? 1 : 0,
      scale: project ? 1 : 0.6,
      duration: 0.45,
      ease: project ? "back.out(1.6)" : "power3.in",
      overwrite: "auto",
    });
  };

  const choose = async (next: string) => {
    if (next === filter) return;
    if (!isStatic() && root.current) {
      // Loaded on first use: only this filter needs Flip.
      if (!flip.current) {
        const { Flip } = await import("gsap/Flip");
        gsap.registerPlugin(Flip);
        flip.current = Flip;
      }
      flipState.current = flip.current.getState(root.current.querySelectorAll("[data-project]"));
    }
    setFilter(next);
  };

  // After a filter change re-renders the rows, animate from the saved state.
  useGSAP(
    () => {
      const state = flipState.current;
      const Flip = flip.current;
      if (!state || !Flip) return;
      flipState.current = null;
      Flip.from(state, {
        duration: 0.7,
        ease: "mb.inOut",
        absolute: true,
        stagger: 0.04,
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.05 },
          ),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, duration: 0.3 }),
      });
    },
    { dependencies: [filter], scope: root },
  );

  return (
    <div ref={root} className="relative">
      {filterable && categories.length > 2 ? (
        <div role="group" aria-label="Filter by category" className="mb-12 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={filter === category}
              onClick={() => void choose(category)}
              className={`rounded-full border px-4 py-2 font-mono text-xs transition-colors ${
                filter === category
                  ? "border-primary bg-primary text-background"
                  : "border-line text-muted-foreground hover:border-foreground hover:text-foreground"
              }`}
            >
              {category}
              <span className="ml-2 opacity-60">
                {category === "all"
                  ? projects.length
                  : projects.filter((p) => p.category.toLowerCase() === category).length}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      <ol className="border-t border-line" onPointerLeave={() => showPreview(null)}>
        {visible.map((project) => (
          <li
            key={project.id}
            data-project
            data-flip-id={project.id}
            data-reveal
            className="border-b border-line"
          >
            <Link
              href={`/projects/${project.id}`}
              data-cursor="open"
              onPointerEnter={() => showPreview(project)}
              onFocus={() => showPreview(project)}
              onBlur={() => showPreview(null)}
              className="group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 py-8 md:grid-cols-[6rem_minmax(0,1fr)_14rem_auto] md:gap-8 md:py-11"
            >
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                {String(projects.indexOf(project) + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="font-head block text-[clamp(2rem,5vw,4.5rem)] transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4 group-hover:text-primary capitalize">
                  {project.title.toLowerCase()}
                </span>
                <span className="mt-3 block max-w-xl text-muted-foreground [@media(hover:hover)]:hidden">
                  {project.description}
                </span>
              </span>
              <span className="hidden font-mono text-xs text-muted-foreground md:block">
                {project.category.toLowerCase()}
                <span className="block text-foreground/70">{project.status.toLowerCase()}</span>
              </span>
              <span
                aria-hidden="true"
                className="grid size-12 place-items-center rounded-full border border-line transition-[background-color,border-color,color,transform] duration-500 group-hover:-rotate-45 group-hover:border-primary group-hover:bg-primary group-hover:text-background"
              >
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Follows the pointer; decorative duplicate of the row's own content. */}
      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40 hidden w-80 rounded-2xl border border-line bg-surface/95 p-6 opacity-0 shadow-2xl shadow-black/60 backdrop-blur [@media(hover:hover)]:block"
      >
        {hovered ? (
          <>
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-primary">{hovered.category.toLowerCase()}</span>
              <span className="text-muted-foreground">{hovered.status.toLowerCase()}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed">{hovered.description}</p>
            {hovered.tags.length ? (
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {hovered.tags.slice(0, 5).map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {tag.toLowerCase()}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
