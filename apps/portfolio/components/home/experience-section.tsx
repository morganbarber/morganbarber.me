"use client";

import { motion } from "framer-motion";
import GlitchHeading from "@repo/ui/glitch-heading";
import type { ExperienceSummary } from "@repo/types";

export default function ExperienceSection({ experience }: { experience: ExperienceSummary[] }) {
    return (
        <section className="bg-background py-24 lg:py-32">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-primary w-12" />
                        <span className="font-mono text-sm tracking-widest text-primary">
                            PROFESSIONAL EXPERIENCE
                        </span>
                    </div>
                    <GlitchHeading
                        as="h2"
                        lines={["WORK", "EXPERIENCE"]}
                        className="text-4xl md:text-6xl"
                        lineClassName={[undefined, "text-transparent text-stroke"]}
                    />
                </motion.div>

                <div className="space-y-8">
                    {experience.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="border-l-2 border-muted pl-8 md:pl-12 relative py-4 group"
                        >
                            <div className="absolute left-[-9px] top-6 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:bg-primary transition-colors" />

                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between mb-2">
                                <h3 className="text-2xl md:text-3xl font-bold uppercase text-foreground group-hover:text-primary transition-colors">
                                    {item.role}
                                </h3>
                                <span className="font-mono text-sm text-primary tracking-wider">
                                    [{item.period}]
                                </span>
                            </div>

                            <div className="mb-4">
                                <span className="text-sm font-mono text-muted-foreground border border-muted px-2 py-1 inline-block">
                                    @{item.company}
                                </span>
                            </div>

                            <p className="text-muted-foreground max-w-2xl leading-relaxed">
                                {item.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
