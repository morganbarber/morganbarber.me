"use client";

import { motion } from "framer-motion";
import SectionHeader from "@/components/section-header";
import type { EducationSummary } from "@repo/types";

export default function EducationSection({ education }: { education: EducationSummary[] }) {
  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="shell">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <SectionHeader eyebrow="EDUCATION" title={["EDUCATION", "HISTORY"]} />
        </motion.div>

        {/* Ruled rows with the years stamped large in outline type — a ledger,
            not a grid of cards. */}
        <ol className="border-t border-muted">
          {education.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group grid gap-4 border-b border-muted py-10 md:grid-cols-[16rem_1fr] md:gap-12"
            >
              <span className="font-sans text-4xl md:text-5xl font-bold uppercase leading-none tracking-tight text-stroke transition-colors group-hover:text-primary/90">
                {item.period}
              </span>

              <div>
                <h3 className="text-xl md:text-2xl font-bold uppercase leading-tight transition-colors group-hover:text-primary">
                  {item.degree}
                </h3>
                <p className="mt-2 font-mono text-sm text-primary">{item.school}</p>
                <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed text-sm md:text-base">
                  {item.details}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
