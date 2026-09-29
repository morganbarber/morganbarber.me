import Link from "next/link";
import GlitchHeading from "@repo/ui/glitch-heading";
import MagneticButton from "@repo/ui/magnetic-button";

export default function NotFound() {
  return (
    <main className="splash">
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-8">
        <div className="space-y-2">
          <p className="eyebrow md:text-base uppercase animate-pulse">{"// ERROR_CODE_404"}</p>
          <GlitchHeading
            as="h1"
            lines={["SYSTEM", "FAILURE"]}
            className="text-6xl md:text-8xl lg:text-[10rem] leading-none"
            lineClassName={[undefined, "text-stroke"]}
          />
        </div>

        <div className="log-block mx-auto max-w-md border-primary/50 backdrop-blur-sm md:text-base">
          <p>Target not found.</p>
          <p>The requested segment is unreachable or has been deleted.</p>
        </div>

        <Link href="/">
          <MagneticButton variant="solid" size="lg" className="font-bold">
            RETURN TO WEBSITE
          </MagneticButton>
        </Link>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-8 left-8 size-16 border-t-2 border-l-2 border-primary opacity-50" />
      <div className="absolute bottom-8 right-8 size-16 border-b-2 border-r-2 border-primary opacity-50" />
    </main>
  );
}
