
import { SOCIAL_LINKS } from "@repo/config/site";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="border-t border-muted py-12 bg-background relative z-10">
            <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col items-center md:items-start opacity-50 hover:opacity-100 transition-opacity">
                    <span className="font-sans text-xl font-bold tracking-tighter">morganbarber.me</span>
                    <span className="font-mono text-xs text-muted-foreground mt-1">
                        © {new Date().getFullYear()} ALL RIGHTS RESERVED.
                    </span>
                </div>

                <div className="flex gap-8">
                    {SOCIAL_LINKS.map((link) => (
                        <Link
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-sm tracking-widest hover:text-primary transition-colors hover:underline decoration-primary underline-offset-4"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}
