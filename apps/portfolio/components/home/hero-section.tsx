"use client";

import { motion } from "framer-motion";
import GlitchHeading from "@repo/ui/glitch-heading";
import MagneticButton from "@repo/ui/magnetic-button";
import Link from "next/link";
import { SITE_CONFIG } from "@repo/config/site";

export default function HeroSection() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4">
            <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="relative z-10 text-center"
            >
                <p className="font-mono text-sm md:text-base text-primary mb-4 tracking-widest uppercase">
                    {"// "}{SITE_CONFIG.roleSubtitle}
                </p>

                <GlitchHeading
                    as="h1"
                    lines={["MORGAN", "BARBER"]}
                    className="text-6xl md:text-8xl lg:text-[10rem] leading-none"
                    lineClassName={["mb-2", "text-transparent text-stroke"]}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="mt-12 flex flex-col md:flex-row gap-6 items-center"
            >
                <Link href="/projects">
                    <MagneticButton className="bg-primary text-background hover:bg-transparent hover:text-primary border-primary font-bold text-lg px-8 py-4">
                        PROJECTS
                    </MagneticButton>
                </Link>
                <Link href="/contact">
                    <MagneticButton className="text-foreground border-foreground text-lg px-8 py-4">
                        CONTACT
                    </MagneticButton>
                </Link>
            </motion.div>

            {/* Background Grid/Noise (Optional Visuals) */}
            <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </section>
    );
}
