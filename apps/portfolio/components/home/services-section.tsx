"use client";

import { motion } from "framer-motion";
import SectionHeader from "@/components/section-header";
import { SERVICES } from "@repo/config/site";

/**
 * Capabilities as an engagement path rather than a grid of boxes: the phases
 * run top to bottom in the order a real engagement does, joined by a single
 * rail, each with the command it typically opens with. The heading column is
 * sticky on large screens so the path scrolls past it.
 */
export default function ServicesSection() {
  return (
    <section className="bg-muted/5 py-24 lg:py-32 border-y border-muted">
      <div className="shell grid lg:grid-cols-12 gap-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-4 lg:sticky lg:top-32 self-start"
        >
          <SectionHeader
            eyebrow="CAPABILITIES"
            title={["OFFENSIVE", "SECURITY"]}
            intro="The path an engagement takes, from agreeing the scope to handing over the fix."
            compact
          />
        </motion.div>

        <ol className="lg:col-span-8 relative">
          {/* The rail: one continuous line behind every phase marker. */}
          <span
            aria-hidden="true"
            className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-primary via-muted to-transparent"
          />

          {SERVICES.map((service, i) => (
            <motion.li
              key={service.title}
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="group relative grid grid-cols-[40px_1fr] gap-6 pb-12 last:pb-0"
            >
              <span
                aria-hidden="true"
                className="node relative z-10 grid size-10 place-items-center font-mono text-xs text-primary group-hover:text-background"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="pt-1">
                <h3 className="text-2xl md:text-3xl font-bold uppercase leading-tight transition-colors group-hover:text-primary">
                  {service.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm md:text-base text-muted-foreground leading-relaxed">
                  {service.description}
                </p>
                <code className="mt-4 inline-flex max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap font-mono text-xs text-muted-foreground/80">
                  <span className="text-primary">$</span>
                  {service.command}
                </code>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
