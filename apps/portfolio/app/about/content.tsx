import GlitchText from "@repo/ui/glitch-text";
import { Download } from "lucide-react";

import { SITE_CONFIG, SKILL_GROUPS } from "@repo/config/site";
import type { CertificationSummary } from "@repo/types";

export default function AboutContent({
  certifications,
}: {
  certifications: CertificationSummary[];
}) {
  return (
    <main className="min-h-screen pt-32 pb-32 px-6 max-w-7xl mx-auto">
      <div>
        <GlitchText text="ABOUT" className="text-5xl md:text-8xl mb-12 block" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div className="space-y-6 font-mono text-lg text-muted-foreground">
            <p>
              Name: MORGAN BARBER
              <br />
              Role: {SITE_CONFIG.role}
              <br />
              Status: ACTIVE
              <br />
              Location: Longmont, CO
            </p>
            <p>
              I&apos;m an ethical hacker working toward a career in red teaming. I learn by doing:
              rooting HackTheBox machines, working through challenges and Sherlocks, and writing
              Python tools to automate what I do by hand.
            </p>
            <p>
              My focus is the attack path — reconnaissance, web exploitation and privilege
              escalation — backed by CompTIA Security+ and Network+ fundamentals. I only test what
              I&apos;m authorized to test, and I write up findings so they get fixed, not just
              found.
            </p>
            <p>
              I compete too: picoCTF and Lockheed Martin CYBERQUEST on the offensive side, and
              CyberPatriot on defense, hardening Windows and Linux systems against the clock.
              Knowing how systems are defended makes me a better attacker, and the other way around.
            </p>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-6 border-b border-primary pb-2 uppercase text-primary">
                Skills
              </h2>
              <div className="space-y-8">
                {SKILL_GROUPS.map((group, g) => (
                  <section key={group.title} aria-labelledby={`skills-${g}`}>
                    <h3
                      id={`skills-${g}`}
                      className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3"
                    >
                      <span className="text-primary">0{g + 1}</span> {"// "}
                      {group.title}
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {group.skills.map((skill) => (
                        <li
                          key={skill}
                          className="border border-muted p-4 font-bold uppercase tracking-wider hover:bg-primary hover:text-background transition-colors cursor-crosshair"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 border-b border-primary pb-2 uppercase text-primary">
                Certifications
              </h2>
              <ul className="space-y-2 font-mono text-muted-foreground">
                {certifications.map((cert) => (
                  <li key={cert.id} className="flex items-center gap-2 group">
                    <span className="text-primary">&gt;</span>
                    <span>{cert.name}</span>
                    <a
                      href={cert.file_url}
                      download
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary hover:text-primary/80"
                      title="Download Certificate"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
