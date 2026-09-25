import type { Metadata } from "next";
import ExperiencePage from "@/components/experience-page";
import StructuredData from "@/components/structured-data";
import { getEducation, getExperience } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbNode, experiencePageNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Experience & Education",
  description:
    "Morgan Barber's cybersecurity work history and education, including the SVVSD Innovation Center cybersecurity pathway and hands-on technical roles.",
  path: "/experience",
  type: "profile",
});

export default async function Experience() {
  // Independent reads: fan out rather than awaiting in sequence.
  const [experience, education] = await Promise.all([getExperience(), getEducation()]);

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
      <ExperiencePage experience={experience.data} education={education.data} />
    </>
  );
}
