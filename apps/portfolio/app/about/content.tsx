import Link from "next/link";
import { SITE_CONFIG, SKILL_GROUPS } from "@repo/config/site";
import type { CertificationSummary } from "@repo/types";
import PageIntro from "@/components/page-intro";
import SectionHeading from "@/components/section-heading";

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function issued(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? "" : dateFormat.format(date);
}

export default function AboutContent({
  certifications,
}: {
  certifications: CertificationSummary[];
}) {
  const facts = [
    ["name", SITE_CONFIG.name],
    ["role", SITE_CONFIG.role],
    ["age", String(SITE_CONFIG.age)],
    ["based in", SITE_CONFIG.location],
    ["status", "open to internships"],
  ] as const;

  return (
    <main>
      <PageIntro path="/about" title="About" lede={SITE_CONFIG.shortDescription} />

      <section className="shell grid gap-16 pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <dl className="self-start border-t border-line lg:sticky lg:top-28">
          {facts.map(([term, value]) => (
            <div
              key={term}
              data-reveal
              className="flex justify-between gap-6 border-b border-line py-4"
            >
              <dt className="label">{term}</dt>
              <dd className="text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-8 text-[clamp(1.25rem,2vw,1.6rem)] leading-[1.5]">
          <p data-reveal>
            I&apos;m an ethical hacker working toward a career in red teaming. I learn by doing:
            rooting HackTheBox machines, working through challenges and Sherlocks, and writing
            Python tools to automate what I do by hand.
          </p>
          <p data-reveal className="text-muted-foreground">
            My focus is the attack path — reconnaissance, web exploitation and privilege escalation
            — backed by CompTIA Security+ and Network+ fundamentals. I only test what I&apos;m
            authorized to test, and I write up findings so they get fixed, not just found.
          </p>
          <p data-reveal className="text-muted-foreground">
            I compete too: picoCTF and Lockheed Martin CYBERQUEST on the offensive side, and
            CyberPatriot on defense, hardening Windows and Linux systems against the clock. Knowing
            how systems are defended makes me a better attacker, and the other way around.
          </p>
        </div>
      </section>

      <section className="shell section-pad">
        <SectionHeading index="01" label="skills" title="What I work on." />
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2">
          {SKILL_GROUPS.map((group, g) => (
            <section
              key={group.title}
              data-reveal
              aria-labelledby={`skills-${g}`}
              className="bg-background p-8 md:p-10"
            >
              <h3 id={`skills-${g}`} className="flex items-baseline gap-3">
                <span className="font-mono text-xs text-primary">0{g + 1}</span>
                <span className="font-head text-3xl">{group.title}</span>
              </h3>
              <ul className="mt-6 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-full border border-line px-3.5 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>

      {certifications.length > 0 ? (
        <section className="shell section-pad pt-0">
          <SectionHeading index="02" label="certifications" title="Credentials on file." />
          <ul className="border-t border-line">
            {certifications.map((cert) => (
              <li key={cert.id} data-reveal className="border-b border-line">
                <a
                  href={cert.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="view pdf"
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-6 md:grid-cols-[8rem_minmax(0,1fr)_10rem_auto] md:gap-8"
                >
                  <span className="hidden font-mono text-sm text-muted-foreground md:block">
                    {issued(cert.issued_on)}
                  </span>
                  <span className="text-xl transition-colors group-hover:text-primary md:text-2xl">
                    {cert.name}
                  </span>
                  <span className="hidden font-mono text-xs text-muted-foreground md:block">
                    {cert.issuer}
                  </span>
                  <span className="font-mono text-xs text-primary">
                    pdf <span aria-hidden="true">↗</span>
                    <span className="sr-only">(opens in a new tab)</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="shell pb-32">
        <Link href="/contact" className="btn btn-primary">
          Get in touch
        </Link>
      </section>
    </main>
  );
}
