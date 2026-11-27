import Link from "next/link";
import Hero from "@/components/home/hero";
import Marquee from "@/components/home/marquee";
import Manifesto from "@/components/home/manifesto";
import KillChain from "@/components/home/kill-chain";
import HackTheBox from "@/components/home/hackthebox";
import Credentials from "@/components/home/credentials";
import Arsenal from "@/components/home/arsenal";
import ContactCta from "@/components/home/contact-cta";
import SectionRail from "@/components/home/section-rail";
import SectionHeading from "@/components/section-heading";
import Timeline, { type TimelineEntry } from "@/components/timeline";
import Scoreboard from "@/components/scoreboard";
import ProjectList from "@/components/project-list";
import PostList from "@/components/post-list";
import {
  HACKTHEBOX,
  SERVICES,
  SITE_CONFIG,
  SKILL_GROUPS,
  SOCIAL_LINKS,
  STACK,
  hackTheBoxProfileUrl,
} from "@repo/config/site";
import type { HackTheBoxStats } from "@repo/data/hackthebox";
import type {
  BlogPostSummary,
  CertificationSummary,
  CompetitionSummary,
  EducationSummary,
  ExperienceSummary,
  ProjectSummary,
} from "@repo/types";

export function toTimeline(
  experience: ExperienceSummary[],
  education: EducationSummary[],
): TimelineEntry[] {
  return [
    ...experience.map((e) => ({
      id: e.id,
      period: e.period,
      title: e.role,
      org: e.company,
      body: e.description,
      tag: "work",
    })),
    ...education.map((e) => ({
      id: e.id,
      period: e.period,
      title: e.degree,
      org: e.school,
      body: e.details,
      tag: "education",
    })),
  ];
}

export default function HomePage({
  posts,
  experience,
  projects,
  education,
  hackTheBox,
  competitions,
  certifications,
}: {
  posts: BlogPostSummary[];
  experience: ExperienceSummary[];
  projects: ProjectSummary[];
  education: EducationSummary[];
  /** Null until a HackTheBox profile ID is configured; the section is then omitted. */
  hackTheBox: HackTheBoxStats | null;
  competitions: CompetitionSummary[];
  certifications: CertificationSummary[];
}) {
  const timeline = toTimeline(experience, education);

  return (
    <main>
      <Hero
        rank={hackTheBox?.rank ?? null}
        profileUrl={hackTheBoxProfileUrl()}
        age={SITE_CONFIG.age}
      />
      <Marquee />
      <Manifesto description={SITE_CONFIG.description} />
      <KillChain phases={SERVICES} />

      {hackTheBox ? <HackTheBox stats={hackTheBox} tagline={HACKTHEBOX.tagline} /> : null}

      <Credentials certifications={certifications} />

      <Arsenal
        name={SITE_CONFIG.name}
        role={SITE_CONFIG.role}
        location={SITE_CONFIG.location}
        email={SITE_CONFIG.email}
        stack={STACK}
        skillGroups={SKILL_GROUPS}
        socials={SOCIAL_LINKS}
        certifications={certifications.map((c) => c.name)}
        htb={{
          rank: hackTheBox?.rank ?? null,
          systemOwns: hackTheBox?.systemOwns ?? null,
          userOwns: hackTheBox?.userOwns ?? null,
          url: hackTheBox?.profileUrl ?? null,
        }}
      />

      {timeline.length > 0 ? (
        <section id="track-record" data-section="track-record" className="shell section-pad">
          <SectionHeading index="06" label="track record" title="Where I've worked and studied." />
          <Timeline entries={timeline} />
        </section>
      ) : null}

      {competitions.length > 0 ? (
        <section id="competitions" data-section="competitions" className="bg-surface section-pad">
          <div className="shell">
            <SectionHeading
              index="07"
              label="competitions"
              title="Offense and defense, against the clock."
              intro="CTFs on the attacking side, CyberPatriot on defense. Competitions are where the practice gets tested."
            />
            <Scoreboard competitions={competitions} />
          </div>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section id="work" data-section="work" className="shell section-pad">
          <SectionHeading index="08" label="selected work" title="Things I've built.">
            <Link href="/projects" className="btn btn-ghost shrink-0">
              All projects
            </Link>
          </SectionHeading>
          <ProjectList projects={projects} />
        </section>
      ) : null}

      {posts.length > 0 ? (
        <section id="writing" data-section="writing" className="shell section-pad pt-0">
          <SectionHeading index="09" label="writing" title="Notes from the lab.">
            <Link href="/blog" className="btn btn-ghost shrink-0">
              All posts
            </Link>
          </SectionHeading>
          <PostList posts={posts} />
        </section>
      ) : null}

      <ContactCta email={SITE_CONFIG.email} />

      {/* Last on purpose: its ScrollTriggers must be created after the pinned
          kill chain adds its scroll distance, or every section below it is
          measured too high. */}
      <SectionRail />
    </main>
  );
}
