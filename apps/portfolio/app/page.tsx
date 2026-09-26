import type { Metadata } from "next";
import HomePage from "@/components/home-page";
import StructuredData from "@/components/structured-data";
import { getHomePageData } from "@repo/data/content";
import { getHackTheBoxStats } from "@repo/data/hackthebox";
import { SITE_CONFIG } from "@repo/config/site";
import { pageMetadata } from "@/lib/seo";
import { graph, profilePageNode } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  // Absolute, so the template does not append the name a second time.
  absoluteTitle: `${SITE_CONFIG.name} | ${SITE_CONFIG.role}`,
  description: SITE_CONFIG.seoDescription,
  path: "/",
  type: "profile",
});

export default async function Home() {
  // Independent reads, fetched together: the HackTheBox call is cached for six
  // hours but a cold miss is a network round trip that should not queue
  // behind the database.
  const [{ posts, projects, experience, education, competitions }, hackTheBox] = await Promise.all([
    getHomePageData(),
    getHackTheBoxStats(),
  ]);

  return (
    <>
      <StructuredData data={graph(profilePageNode())} />
      <HomePage
        posts={posts}
        projects={projects}
        experience={experience}
        education={education}
        hackTheBox={hackTheBox}
        competitions={competitions}
      />
    </>
  );
}
