"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import GlitchText from "@repo/ui/glitch-text";
import MagneticButton from "@repo/ui/magnetic-button";
import type { ProjectSummary } from "@repo/types";

export default function ProjectsPage({ projects }: { projects: ProjectSummary[] }) {
    return (
        <main className="min-h-screen pt-32 px-6 max-w-7xl mx-auto">
            <GlitchText text="PROJECTS" className="text-5xl md:text-8xl mb-12 block" />

            <div className="space-y-8">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative border-t border-muted py-8 hover:bg-muted/10 transition-colors"
                    >
                        <Link href={`/projects/${project.id}`} className="block w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div className="mb-4 md:mb-0">
                                    <span className="font-mono text-primary text-sm mb-2 block">{"// "}{project.id}</span>
                                    <h2 className="text-4xl md:text-6xl font-bold uppercase group-hover:translate-x-4 transition-transform duration-300">
                                        {project.title}
                                    </h2>
                                    <p className="mt-2 text-muted-foreground max-w-xl text-sm hidden md:block">{project.description}</p>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right hidden md:block">
                                        <p className="text-muted-foreground uppercase text-sm tracking-widest">{project.category}</p>
                                        <p className="text-xs font-mono mt-1">{project.status}</p>
                                    </div>
                                    <MagneticButton className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        ACCESS
                                    </MagneticButton>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </main >
    );
}
