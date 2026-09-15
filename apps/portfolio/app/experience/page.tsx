import type { Metadata } from "next";
import ExperiencePage from "@/components/experience-page";
import { getEducation, getExperience } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Morgan Barber's professional experience and academic records in cybersecurity and engineering.",
  alternates: { canonical: `${getSiteUrl()}/experience` },
  openGraph: {
    title: "Experience | Morgan Barber",
    description: "Read about Morgan Barber's work history and education.",
    url: `${getSiteUrl()}/experience`,
  },
};

export default async function Experience() {
  // Independent reads: fan out rather than awaiting in sequence.
  const [experience, education] = await Promise.all([getExperience(), getEducation()]);

  return <ExperiencePage experience={experience.data} education={education.data} />;
}
