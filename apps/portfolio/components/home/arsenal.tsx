"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { copyText, emit, isStatic, navigateTo } from "@/lib/motion";
import { NAV_ITEMS, socialLabel } from "@/lib/site-nav";
import type { SkillGroup, Tool, ToolKind } from "@repo/config/site";
import type { SocialLink } from "@repo/types";
import SectionHeading from "@/components/section-heading";

/**
 * The toolkit as a working shell. Visitors can type real commands — `help`,
 * `whoami`, `ls`, `skills`, `htb`, `certs`, `contact`, `goto <page>` and a few
 * that are just for fun — and every answer comes from the same data the rest
 * of the page renders. It runs `whoami` and `ls` by itself the first time it
 * scrolls into view, so it reads as a terminal even if nobody types.
 *
 * The log is a polite live region; the input is a labelled text field with
 * history (↑/↓) and tab completion. It never takes focus by itself.
 */

type Tone = "fg" | "muted" | "primary" | "error" | ToolKind;

interface Part {
  text: string;
  tone?: Tone;
}

interface Line {
  id: number;
  kind: "command" | "output";
  parts: Part[];
}

const TONE: Record<Tone, string> = {
  fg: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  error: "text-secondary",
  platform: "text-foreground font-semibold underline underline-offset-4",
  recon: "text-kind-recon",
  exploit: "text-kind-exploit",
  post: "text-kind-post",
  script: "text-kind-script",
};

const KIND_LABEL: Record<ToolKind, string> = {
  platform: "platform",
  recon: "recon",
  exploit: "exploitation",
  post: "post-exploitation",
  script: "scripting",
};

const PROMPT = "morgan@kali:~/arsenal$";

const COMMANDS = [
  "help",
  "whoami",
  "ls",
  "skills",
  "htb",
  "certs",
  "contact",
  "socials",
  "goto",
  "date",
  "history",
  "clear",
  "nmap",
  "sudo",
  "cat",
  "exit",
] as const;

export interface ArsenalProps {
  name: string;
  role: string;
  location: string;
  email: string;
  stack: readonly Tool[];
  skillGroups: readonly SkillGroup[];
  socials: SocialLink[];
  certifications: string[];
  htb: {
    rank: string | null;
    systemOwns: number | null;
    userOwns: number | null;
    url: string | null;
  };
}

export default function Arsenal(props: ArsenalProps) {
  const root = useRef<HTMLElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const typing = useRef<HTMLSpanElement>(null);
  const nextId = useRef(0);
  const history = useRef<string[]>([]);
  const cursor = useRef(-1);
  const [lines, setLines] = useState<Line[]>([]);
  const [value, setValue] = useState("");

  const out = (...parts: (Part | string)[]): Line => ({
    id: ++nextId.current,
    kind: "output",
    parts: parts.map((p) => (typeof p === "string" ? { text: p } : p)),
  });

  const respond = (raw: string): Line[] | "clear" => {
    const [cmd = "", ...args] = raw.trim().split(/\s+/);
    const arg = args.join(" ");
    const { htb } = props;

    switch (cmd.toLowerCase()) {
      case "":
        return [];
      case "help":
        return [
          out({ text: "available commands", tone: "muted" }),
          ...[
            ["whoami", "who is this"],
            ["ls", "the toolkit, coloured by purpose"],
            ["skills", "what I work on, grouped"],
            ["htb", "live Hack The Box stats"],
            ["certs", "certifications"],
            ["contact", "how to reach me (copies the email)"],
            ["socials", "elsewhere on the internet"],
            ["goto <page>", NAV_ITEMS.map((n) => n.name.toLowerCase()).join(" | ")],
            ["clear", "wipe the screen"],
          ].map(([c, d]) =>
            out({ text: (c ?? "").padEnd(13), tone: "primary" }, { text: d ?? "", tone: "muted" }),
          ),
          out({ text: "there may be others.", tone: "muted" }),
        ];
      case "whoami":
        return [
          out({ text: props.name, tone: "fg" }, { text: ` — ${props.role}`, tone: "muted" }),
          out({ text: `based in ${props.location}. authorized targets only.`, tone: "muted" }),
        ];
      case "ls": {
        const parts: Part[] = [];
        props.stack.forEach((tool, i) => {
          if (i > 0) parts.push({ text: "  " });
          parts.push({ text: tool.name, tone: tool.kind });
        });
        const kinds = [...new Set(props.stack.map((t) => t.kind))];
        return [
          { id: ++nextId.current, kind: "output", parts },
          out(
            ...kinds.flatMap((kind, i): Part[] => [
              { text: i ? "   ■ " : "■ ", tone: kind },
              { text: KIND_LABEL[kind], tone: "muted" },
            ]),
          ),
        ];
      }
      case "skills":
        return props.skillGroups.flatMap((group) => [
          out({ text: `# ${group.title.toLowerCase()}`, tone: "primary" }),
          out({ text: group.skills.join(", "), tone: "muted" }),
        ]);
      case "htb":
        if (!htb.rank) return [out({ text: "htb: profile not configured", tone: "error" })];
        return [
          out({ text: "rank         ", tone: "muted" }, { text: htb.rank, tone: "primary" }),
          ...(htb.systemOwns !== null
            ? [out({ text: "system owns  ", tone: "muted" }, String(htb.systemOwns))]
            : []),
          ...(htb.userOwns !== null
            ? [out({ text: "user owns    ", tone: "muted" }, String(htb.userOwns))]
            : []),
          ...(htb.url ? [out({ text: "profile      ", tone: "muted" }, htb.url)] : []),
        ];
      case "certs":
        return props.certifications.length
          ? props.certifications.map((name) => out({ text: "✓ ", tone: "primary" }, name))
          : [out({ text: "no certifications loaded", tone: "muted" })];
      case "contact":
        void copyText(props.email, "Email copied");
        return [
          out(
            { text: "email   ", tone: "muted" },
            { text: props.email, tone: "primary" },
            {
              text: "  (copied)",
              tone: "muted",
            },
          ),
          out({ text: "form    ", tone: "muted" }, "goto contact"),
        ];
      case "socials":
        return props.socials.map((s) =>
          out({ text: socialLabel(s.name).padEnd(14), tone: "muted" }, s.url),
        );
      case "goto": {
        const page = NAV_ITEMS.find((n) => n.name.toLowerCase() === arg.toLowerCase());
        if (!page) {
          return [
            out({
              text: `goto: no such page '${arg}'. try: ${NAV_ITEMS.map((n) => n.name.toLowerCase()).join(", ")}`,
              tone: "error",
            }),
          ];
        }
        window.setTimeout(() => navigateTo(page.href), 350);
        return [out({ text: `connecting to ${page.href} …`, tone: "muted" })];
      }
      case "date":
        return [out(new Date().toString())];
      case "history":
        return history.current.length
          ? history.current.map((h, i) =>
              out({ text: String(i + 1).padStart(4) + "  ", tone: "muted" }, h),
            )
          : [out({ text: "no history yet", tone: "muted" })];
      case "clear":
        return "clear";
      case "nmap":
        return [
          out({ text: `Starting Nmap against ${arg || "morganbarber.me"}`, tone: "muted" }),
          out("PORT     STATE  SERVICE"),
          out(
            { text: "443/tcp  open   ", tone: "primary" },
            "https  (strict CSP, nonce-based — good luck)",
          ),
          out({
            text: "Nmap done: 1 host up. scope check: this one is mine, so you're fine.",
            tone: "muted",
          }),
        ];
      case "sudo":
        if (arg === "su" || arg === "-i") {
          emit("mb:root", { on: true });
          return [
            out({
              text: "# root shell obtained. the accent colour just changed.",
              tone: "primary",
            }),
          ];
        }
        return [
          out({ text: `[sudo] password for visitor: `, tone: "muted" }),
          out({
            text: "visitor is not in the sudoers file. This incident will be reported.",
            tone: "error",
          }),
        ];
      case "rm":
        return [out({ text: "rm: nice try. permission denied.", tone: "error" })];
      case "cat":
        if (arg === "flag.txt") {
          return [out({ text: "flag{y0u_r34d_th3_s0urc3_0r_gu3ss3d}", tone: "primary" })];
        }
        return [
          out({ text: `cat: ${arg || "<file>"}: No such file or directory`, tone: "error" }),
          out({ text: "hint: there is a flag.txt", tone: "muted" }),
        ];
      case "exit":
        return [out({ text: "there is no escape. (try scrolling)", tone: "muted" })];
      default:
        return [out({ text: `${cmd}: command not found. type 'help'.`, tone: "error" })];
    }
  };

  const run = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed) {
      history.current = [...history.current, trimmed].slice(-50);
    }
    cursor.current = -1;
    const result = respond(trimmed);
    if (result === "clear") {
      setLines([]);
      return;
    }
    const echo: Line = { id: ++nextId.current, kind: "command", parts: [{ text: trimmed }] };
    setLines((current) => [...current, echo, ...result].slice(-200));
  };

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      if (isStatic()) {
        run("whoami");
        run("ls");
        return;
      }

      // Type the first two commands out by hand when the terminal arrives.
      const typeOut = (command: string) => {
        const t = gsap.timeline();
        const counter = { n: 0 };
        t.to(counter, {
          n: command.length,
          duration: command.length * 0.07,
          ease: "none",
          onUpdate: () => {
            if (typing.current)
              typing.current.textContent = command.slice(0, Math.round(counter.n));
          },
        }).call(
          // The timeline belongs to this context, so it dies with the component.
          () => {
            if (typing.current) typing.current.textContent = "";
            run(command);
          },
          [],
          "+=0.25",
        );
        return t;
      };

      gsap
        .timeline({
          scrollTrigger: {
            trigger: el.querySelector("[data-terminal]"),
            start: "top 75%",
            once: true,
          },
        })
        .add(typeOut("whoami"))
        .add(typeOut("ls"), "+=0.5");
    },
    { scope: root },
  );

  // New output lines slide in.
  useGSAP(
    () => {
      const box = log.current;
      if (!box) return;
      const fresh = box.querySelectorAll<HTMLElement>("[data-line]:not([data-seen])");
      fresh.forEach((el) => (el.dataset.seen = ""));
      if (!isStatic() && fresh.length) {
        gsap.from(fresh, {
          autoAlpha: 0,
          x: -8,
          duration: 0.3,
          stagger: 0.025,
          ease: "power2.out",
        });
      }
      box.scrollTop = box.scrollHeight;
    },
    { dependencies: [lines], scope: root },
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const entries = history.current;
    if (event.key === "ArrowUp" && entries.length) {
      event.preventDefault();
      cursor.current = cursor.current < 0 ? entries.length - 1 : Math.max(0, cursor.current - 1);
      setValue(entries[cursor.current] ?? "");
    } else if (event.key === "ArrowDown" && entries.length) {
      event.preventDefault();
      if (cursor.current < 0) return;
      cursor.current = cursor.current + 1;
      if (cursor.current >= entries.length) {
        cursor.current = -1;
        setValue("");
      } else {
        setValue(entries[cursor.current] ?? "");
      }
    } else if (event.key === "Tab" && value.trim()) {
      const matches = COMMANDS.filter((c) => c.startsWith(value.trim().toLowerCase()));
      if (matches.length === 1) {
        event.preventDefault();
        setValue(`${matches[0]} `);
      }
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      setLines([]);
    }
  };

  const kinds = [...new Set(props.stack.map((t) => t.kind))];

  return (
    <section ref={root} id="arsenal" data-section="arsenal" className="shell section-pad">
      <SectionHeading
        index="05"
        label="arsenal"
        title="The toolkit. Go on, type something."
        intro="A working shell over this site's own data. Try help, htb or certs."
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <div data-reveal className="space-y-8">
          <div>
            <p className="mb-4 label">most-used first</p>
            <ul className="flex flex-wrap gap-2" aria-label="Tools I use">
              {props.stack.map((tool) => (
                <li
                  key={tool.name}
                  className={`rounded-full border border-line px-3 py-1 font-mono text-sm ${TONE[tool.kind]}`}
                >
                  {tool.name}
                  <span className="sr-only"> ({KIND_LABEL[tool.kind]})</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="space-y-1.5 font-mono text-xs text-muted-foreground" aria-label="Legend">
            {kinds.map((kind) => (
              <li key={kind} className="flex items-center gap-2">
                <span aria-hidden="true" className={TONE[kind]}>
                  ■
                </span>
                {KIND_LABEL[kind]}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {(["help", "htb", "certs", "skills", "cat flag.txt"] as const).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => run(suggestion)}
                className="rounded-md border border-line px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div
          data-terminal
          data-reveal
          className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_40px_120px_-40px_color-mix(in_srgb,var(--primary)_35%,transparent)]"
          onClick={(event) => {
            if (!(event.target instanceof HTMLButtonElement))
              input.current?.focus({ preventScroll: true });
          }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3 font-mono text-xs text-muted-foreground">
            <span>morgan@kali: ~/arsenal</span>
            <span>interactive</span>
          </div>

          <div
            ref={log}
            data-lenis-prevent
            role="log"
            aria-live="polite"
            aria-label="Terminal output"
            className="h-[22rem] overflow-y-auto p-5 font-mono text-sm leading-relaxed md:h-[26rem] md:text-[0.95rem]"
          >
            {lines.map((line) => (
              <div key={line.id} data-line className="break-words whitespace-pre-wrap">
                {line.kind === "command" ? (
                  <>
                    <span className="text-primary">{PROMPT}</span>{" "}
                    <span>{line.parts[0]?.text}</span>
                  </>
                ) : (
                  line.parts.map((part, i) => (
                    <span key={i} className={part.tone ? TONE[part.tone] : undefined}>
                      {part.text}
                    </span>
                  ))
                )}
              </div>
            ))}

            <form
              className="flex items-baseline gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                run(value);
                setValue("");
              }}
            >
              <label htmlFor="terminal-input" className="shrink-0 text-primary">
                {PROMPT}
                <span className="sr-only"> Terminal command</span>
              </label>
              <span ref={typing} aria-hidden="true" />
              <input
                ref={input}
                id="terminal-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={onKeyDown}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="send"
                className="min-w-0 flex-1 bg-transparent text-foreground caret-primary outline-none"
              />
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
