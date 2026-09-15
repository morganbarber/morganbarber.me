"use client";

import { motion } from "framer-motion";
import { MARQUEE_TEXT } from "@repo/config/site";

const marqueeVariants = {
    animate: {
        x: [0, -1000],
        transition: {
            x: {
                repeat: Infinity,
                repeatType: "loop" as const,
                duration: 20,
                ease: "linear" as const,
            },
        },
    },
};

export default function MarqueeSection() {
    return (
        <div className="w-full bg-primary text-background overflow-hidden py-4 border-y border-background">
            <motion.div
                className="whitespace-nowrap flex gap-8"
                variants={marqueeVariants}
                animate="animate"
            >
                {Array(4)
                    .fill(MARQUEE_TEXT)
                    .map((text, i) => (
                        <span
                            key={i}
                            className="font-oswald text-2xl md:text-4xl font-bold uppercase tracking-wide"
                        >
                            {text}
                        </span>
                    ))}
            </motion.div>
        </div>
    );
}
