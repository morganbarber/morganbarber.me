import type { Metadata } from "next";
import ProjectsPage from "@/components/projects-page";
import { getProjects } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Showcase of cybersecurity and development projects including machine learning, robotics, and network security environments.",
  alternates: { canonical: `${getSiteUrl()}/projects` },
  openGraph: {
    title: "Projects | Morgan Barber",
    description:
      "Explore Morgan Barber's portfolio of cybersecurity and engineering projects.",
    url: `${getSiteUrl()}/projects`,
  },
};

export default async function Projects() {
  const { data: projects } = await getProjects();
  return <ProjectsPage projects={projects} />;
}
