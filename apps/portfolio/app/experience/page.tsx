import type { Metadata } from "next";
import ExperiencePage from "@/components/experience-page";
import StructuredData from "@/components/structured-data";
import { getCompetitions, getEducation, getExperience } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbNode, experiencePageNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Experience, Education & Competitions",
  description:
    "Morgan Barber's work history, education and competitions: a NIST-based security audit internship, AIMS cybersecurity coursework, CTFs and CyberPatriot.",
  path: "/experience",
  type: "profile",
});

export default async function Experience() {
  // Independent reads: fan out rather than awaiting in sequence.
  const [experience, education, competitions] = await Promise.all([
    getExperience(),
    getEducation(),
    getCompetitions(),
  ]);

  return (
    <>
      <StructuredData
        data={graph(
          experiencePageNode(education.data),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Experience", path: "/experience" },
          ]),
        )}
      />
      <ExperiencePage
        experience={experience.data}
        education={education.data}
        competitions={competitions.data}
      />
    </>
  );
}
