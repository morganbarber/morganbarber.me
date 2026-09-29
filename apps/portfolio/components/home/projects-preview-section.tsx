"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MagneticButton from "@repo/ui/magnetic-button";

import type { ProjectSummary } from "@repo/types";

/**
 * Selected work as an editorial index: big outlined numbers, ruled rows, and
 * the description revealed on hover — no bordered cards.
 */
export default function ProjectsPreviewSection({ projects }: { projects: ProjectSummary[] }) {
  return (
    // w-full: the home <main> is a flex column, where mx-auto alone would
    // shrink this section to its content width.
    <section className="w-full py-24 lg:py-48 max-w-7xl mx-auto px-6">
      <div className="flex flex-wrap justify-between items-end mb-16 gap-8">
        <div>
          <p className="font-mono text-xs text-primary mb-2">0x002 // PROJECTS</p>
          <h2 className="text-4xl md:text-6xl font-bold uppercase">SELECTED WORK</h2>
        </div>
        <Link href="/projects">
          <MagneticButton>VIEW ALL PROJECTS</MagneticButton>
        </Link>
      </div>

      <ol className="border-t border-muted">
        {projects.slice(0, 3).map((project, i) => (
          <motion.li
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="border-b border-muted"
          >
            <Link
              href={`/projects/${project.id}`}
              className="group grid grid-cols-[4.5rem_1fr_auto] md:grid-cols-[8.5rem_1fr_auto] items-center gap-6 md:gap-10 py-8 md:py-10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <span
                aria-hidden="true"
                className="font-sans text-5xl md:text-8xl font-bold leading-none text-transparent text-stroke tabular-nums transition-colors duration-300 group-hover:text-primary"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="min-w-0">
                <span className="font-mono text-primary text-xs mb-2 block">
                  {"// "}
                  {project.category}
                  <span className="text-muted-foreground"> · {project.status}</span>
                </span>
                <h3 className="text-2xl md:text-4xl font-bold uppercase leading-tight transition-transform duration-300 group-hover:translate-x-2">
                  {project.title}
                </h3>
                {/* Revealed on hover for pointer users; always shown on touch. */}
                <p className="mt-3 max-w-xl text-sm text-muted-foreground leading-relaxed md:max-h-0 md:overflow-hidden md:opacity-0 md:transition-all md:duration-300 md:group-hover:max-h-24 md:group-hover:opacity-100 md:group-focus-visible:max-h-24 md:group-focus-visible:opacity-100">
                  {project.description}
                </p>
              </div>

              <ArrowUpRight
                aria-hidden="true"
                className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground transition-all duration-300 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
