"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MagneticButton from "@repo/ui/magnetic-button";

import type { ProjectSummary } from "@repo/types";

export default function ProjectsPreviewSection({ projects }: { projects: ProjectSummary[] }) {
    return (
        <section className="py-24 lg:py-48 max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap justify-between items-end mb-16 gap-8">
                <div>
                    <p className="font-mono text-xs text-primary mb-2">
                        0x002 // PROJECTS
                    </p>
                    <h3 className="text-4xl md:text-6xl font-bold uppercase">
                        SELECTED WORK
                    </h3>
                </div>
                <Link href="/projects" className="hidden md:block">
                    <MagneticButton>VIEW ALL PROJECTS</MagneticButton>
                </Link>
            </div>

            <div className="space-y-4">
                {projects.slice(0, 3).map((project, i) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link
                            href={`/projects/${project.id}`}
                            className="group block border border-muted p-8 hover:bg-primary/5 transition-all hover:border-primary items-center flex justify-between"
                        >
                            <div>
                                <span className="font-mono text-primary text-xs mb-2 block">
                                    {"// "}{project.category}
                                </span>
                                <h4 className="text-3xl font-bold uppercase group-hover:translate-x-4 transition-transform">
                                    {project.title}
                                </h4>
                            </div>
                            <span className="font-mono opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                                ACCESS &rarr;
                            </span>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
