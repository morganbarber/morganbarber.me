"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SITE_CONFIG } from "@repo/config/site";

export default function PhilosophySection() {
    return (
        <section className="max-w-7xl mx-auto px-6 py-24 lg:py-48 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-mono text-primary text-lg"
            >
                <p className="mb-4 text-xs opacity-50">ABOUT ME</p>
                <h3 className="text-4xl md:text-6xl font-bold uppercase mb-6 text-foreground leading-none">
                    ASPIRING
                    <br />
                    CYBERSECURITY
                    <br />
                    SPECIALIST
                </h3>
            </motion.div>
            <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-muted-foreground leading-relaxed text-lg lg:text-xl"
            >
                <p className="mb-6">
                    I possess a strong foundation in information security principles and
                    hands-on technical problem solving.
                </p>
                <p className="mb-8">{SITE_CONFIG.description}</p>
                <Link href="/about">
                    <span className="inline-block border-b border-primary text-primary hover:text-foreground hover:border-foreground transition-colors cursor-pointer pb-1">
                        READ FULL ABOUT ME &rarr;
                    </span>
                </Link>
            </motion.div>
        </section>
    );
}
