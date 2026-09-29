import GlitchHeading from "@repo/ui/glitch-heading";
import { STACK, type ToolKind } from "@repo/config/site";

/**
 * The toolkit as a terminal session instead of a wall of tiles: an `ls` of
 * ~/arsenal, coloured by what each tool is for, the way `ls --color` colours
 * by file type. A server component — nothing here needs JavaScript.
 */

const KIND_STYLE: Record<ToolKind, { className: string; label: string }> = {
  platform: {
    className: "text-foreground font-bold underline underline-offset-4",
    label: "platform",
  },
  recon: { className: "text-sky-400", label: "recon" },
  exploit: { className: "text-primary", label: "exploitation" },
  post: { className: "text-secondary", label: "post-exploitation" },
  script: { className: "text-amber-300", label: "scripting" },
};

/** Kali's two-line prompt; the command (children) follows the `$` on the same line. */
function Prompt({ children }: { children?: React.ReactNode }) {
  return (
    <div className="leading-snug">
      <span aria-hidden="true">
        <span className="text-primary">┌──(</span>
        <span className="text-sky-400 font-bold">morgan㉿kali</span>
        <span className="text-primary">)-[</span>
        <span className="text-foreground font-bold">~/arsenal</span>
        <span className="text-primary">]</span>
        <br />
        <span className="text-primary">└─</span>
        <span className="text-sky-400 font-bold">$</span>{" "}
      </span>
      {children}
    </div>
  );
}

export default function StackSection() {
  const kinds = [...new Set(STACK.map((tool) => tool.kind))];

  return (
    <section className="bg-muted/5 py-24 lg:py-32 border-y border-muted">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-right md:text-left">
          <div className="flex items-center gap-4 mb-4 justify-end md:justify-start">
            <span className="font-mono text-sm tracking-widest text-primary">ARSENAL</span>
            <div className="h-px bg-primary w-12" />
          </div>
          <GlitchHeading
            as="h2"
            lines={["OFFENSIVE", "TOOLKIT"]}
            className="text-4xl md:text-6xl"
            lineClassName={[undefined, "text-transparent text-stroke"]}
          />
        </div>

        <figure className="max-w-4xl overflow-hidden rounded-lg border border-muted bg-[#0b0b0b] shadow-[0_0_60px_-20px_rgba(0,255,65,0.25)]">
          <figcaption className="flex items-center gap-2 border-b border-muted px-4 py-3">
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-secondary/80" />
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-amber-300/80" />
            <span aria-hidden="true" className="h-3 w-3 rounded-full bg-primary/80" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              morgan@kali: ~/arsenal
            </span>
          </figcaption>

          <div className="p-5 md:p-8 font-mono text-sm md:text-base">
            <Prompt>
              <span className="text-foreground">ls --color</span>
            </Prompt>

            {/* ls-style output: wraps like a terminal, but it is a list of tools. */}
            <ul className="mt-3 mb-5 flex flex-wrap gap-x-8 gap-y-2" aria-label="Tools I use">
              {STACK.map((tool) => (
                <li key={tool.name}>
                  <span
                    className={`${KIND_STYLE[tool.kind].className} cursor-default transition-colors hover:bg-foreground hover:text-background`}
                  >
                    {tool.name}
                  </span>
                  <span className="sr-only"> ({KIND_STYLE[tool.kind].label})</span>
                </li>
              ))}
            </ul>

            <Prompt>
              <span
                aria-hidden="true"
                className="inline-block h-[1.1em] w-[0.6em] translate-y-[0.15em] bg-primary animate-pulse"
              />
            </Prompt>
          </div>
        </figure>

        <ul
          className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground"
          aria-label="Legend"
        >
          {kinds.map((kind) => (
            <li key={kind} className="flex items-center gap-2">
              <span className={`${KIND_STYLE[kind].className} no-underline`}>■</span>
              {KIND_STYLE[kind].label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
