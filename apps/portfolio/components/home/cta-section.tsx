"use client";

import Link from "next/link";
import MagneticButton from "@repo/ui/magnetic-button";

export default function CtaSection() {
  return (
    <section className="py-32 flex flex-col items-center justify-center text-center px-6">
      <h2 className="text-4xl md:text-6xl font-bold uppercase mb-8">LET'S WORK TOGETHER</h2>
      <Link href="/contact">
        <MagneticButton variant="solid" size="xl">
          GET IN TOUCH
        </MagneticButton>
      </Link>
    </section>
  );
}
