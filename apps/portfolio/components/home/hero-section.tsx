import GlitchHeading from "@repo/ui/glitch-heading";
import MagneticButton from "@repo/ui/magnetic-button";
import Link from "next/link";
import { SITE_CONFIG } from "@repo/config/site";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/*
              CSS animation, not framer-motion. The heading is the page's
              Largest Contentful Paint element. framer-motion server-renders it
              at opacity:0 and only starts the fade after hydration, so LCP
              waited on the whole JavaScript bundle — seconds on a slow phone,
              and LCP is a Core Web Vitals ranking signal. A CSS animation
              starts at first paint with no JavaScript at all.
            */}
      <div className="hero-rise relative z-10 text-center">
        <p className="eyebrow md:text-base mb-4 uppercase">
          {"// "}
          {SITE_CONFIG.roleSubtitle}
        </p>

        <GlitchHeading
          as="h1"
          lines={["MORGAN", "BARBER"]}
          className="text-6xl md:text-8xl lg:text-[10rem] leading-none"
          lineClassName={["mb-2", "text-stroke"]}
        />
      </div>

      <div className="hero-fade mt-12 flex flex-col md:flex-row gap-6 items-center">
        <Link href="/projects">
          <MagneticButton variant="solid" size="lg" className="font-bold">
            PROJECTS
          </MagneticButton>
        </Link>
        <Link href="/contact">
          <MagneticButton variant="outline" size="lg">
            CONTACT
          </MagneticButton>
        </Link>
      </div>

      {/* Background Grid/Noise (Optional Visuals) */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />
    </section>
  );
}
