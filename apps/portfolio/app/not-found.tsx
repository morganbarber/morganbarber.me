import Link from "next/link";
import GlitchHeading from "@repo/ui/glitch-heading";
import MagneticButton from "@repo/ui/magnetic-button";

export default function NotFound() {
    return (
        <main className="relative flex flex-col items-center justify-center min-h-screen px-4 overflow-hidden bg-background">
            {/* Background Grid */}
            <div className="absolute inset-0 -z-10 opacity-20 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                <div className="space-y-2">
                    <p className="font-mono text-sm md:text-base text-primary tracking-widest uppercase animate-pulse">
            {"// ERROR_CODE_404"}
                    </p>
                    <GlitchHeading
                        as="h1"
                        lines={["SYSTEM", "FAILURE"]}
                        className="text-6xl md:text-8xl lg:text-[10rem] leading-none"
                        lineClassName={[undefined, "text-transparent text-stroke"]}
                    />
                </div>

                <div className="max-w-md mx-auto font-mono text-sm md:text-base text-muted-foreground space-y-2 border-l-2 border-primary/50 pl-4 py-2 text-left bg-muted/10 backdrop-blur-sm">
                    <p className="before:content-['>'] before:mr-2 before:text-primary">
                        Target not found.
                    </p>
                    <p className="before:content-['>'] before:mr-2 before:text-primary">
                        The requested segment is unreachable or has been deleted.
                    </p>
                </div>

                <Link href="/">
                    <MagneticButton className="bg-primary text-background hover:bg-transparent hover:text-primary border-primary font-bold text-lg px-8 py-4">
                        RETURN TO WEBSITE
                    </MagneticButton>
                </Link>
            </div>

            {/* Decorative corners */}
            <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-primary opacity-50" />
            <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-primary opacity-50" />
        </main>
    );
}
