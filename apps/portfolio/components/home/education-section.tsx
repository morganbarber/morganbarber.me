"use client";

import { motion } from "framer-motion";
import GlitchHeading from "@repo/ui/glitch-heading";
import type { EducationSummary } from "@repo/types";

export default function EducationSection({ education }: { education: EducationSummary[] }) {
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
            <span className="font-mono text-sm tracking-widest text-primary">EDUCATION</span>
          </div>
          <GlitchHeading
            as="h2"
            lines={["EDUCATION", "HISTORY"]}
            className="text-4xl md:text-6xl"
            lineClassName={[undefined, "text-transparent text-stroke"]}
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {education.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-muted p-8 relative overflow-hidden group hover:border-primary/50 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <span className="font-mono text-xs border border-foreground/20 px-2 py-1">
                  {i + 1}
                </span>
              </div>

              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold uppercase mb-2 group-hover:text-primary transition-colors">
                  {item.degree}
                </h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-mono text-muted-foreground">
                  <span className="text-primary">{item.school}</span>
                  <span>{"//"}</span>
                  <span>{item.period}</span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                {item.details}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
