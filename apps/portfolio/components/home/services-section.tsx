"use client";

import { motion } from "framer-motion";
import GlitchHeading from "@repo/ui/glitch-heading";
import { SERVICES } from "@repo/config/site";

export default function ServicesSection() {
    return (
        <section className="bg-muted/5 py-24 lg:py-32 border-y border-muted">
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
                            CAPABILITIES
                        </span>
                    </div>
                    <GlitchHeading
                        as="h2"
                        lines={["SECURITY", "SERVICES"]}
                        className="text-4xl md:text-6xl"
                        lineClassName={[undefined, "text-transparent text-stroke"]}
                    />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-muted border border-muted">
                    {SERVICES.map((service, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-background p-8 md:p-12 hover:bg-muted/10 transition-colors group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                <span className="font-mono text-xs border border-foreground/20 px-2 py-1">
                                    SYS.0{i + 1}
                                </span>
                            </div>
                            <h4 className="text-2xl font-bold uppercase mb-4 group-hover:text-primary transition-colors">
                                {service}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Specialized focus on securing and optimizing{" "}
                                {service.toLowerCase()} environments.
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
