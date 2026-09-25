import type { Metadata } from "next";
import ProjectsPage from "@/components/projects-page";
import StructuredData from "@/components/structured-data";
import { getProjects } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbNode, graph, projectsIndexNode } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Cybersecurity Projects",
  description:
    "Cybersecurity projects by Morgan Barber: a Python network intrusion detection system, an end-to-end encrypted chat app and a web vulnerability scanner.",
  path: "/projects",
});

export default async function Projects() {
  const { data: projects } = await getProjects();

  return (
    <>
      <StructuredData
        data={graph(
          projectsIndexNode(projects),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/projects" },
          ]),
        )}
      />
      <ProjectsPage projects={projects} />
    </>
  );
}
