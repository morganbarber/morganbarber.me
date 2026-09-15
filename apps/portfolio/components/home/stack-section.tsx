"use client";

import { motion } from "framer-motion";
import GlitchHeading from "@repo/ui/glitch-heading";
import { STACK } from "@repo/config/site";

export default function StackSection() {
    return (
        <section className="bg-muted/5 py-24 lg:py-32 border-y border-muted">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16 text-right md:text-left" // Align right on mobile for style
                >
                    <div className="flex items-center gap-4 mb-4 justify-end md:justify-start">
                        <span className="font-mono text-sm tracking-widest text-primary">
                            TECHNOLOGIES
                        </span>
                        <div className="h-px bg-primary w-12" />
                    </div>
                    <GlitchHeading
                        as="h2"
                        lines={["TECHNICAL", "STACK"]}
                        className="text-4xl md:text-6xl"
                        lineClassName={[undefined, "text-transparent text-stroke"]}
                    />
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {STACK.map((tech, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            className="bg-background border border-muted p-6 flex items-center justify-center hover:border-primary/50 hover:bg-muted/10 transition-all cursor-crosshair group"
                        >
                            <span className="font-mono font-bold text-sm md:text-base text-muted-foreground group-hover:text-primary transition-colors">
                                {tech}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
