import type { Metadata } from "next";
import HomePage from "@/components/home-page";
import { getHomePageData } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

export const metadata: Metadata = {
  alternates: { canonical: getSiteUrl() },
};

export default async function Home() {
  const { posts, projects, experience, education } = await getHomePageData();

  return (
    <HomePage
      posts={posts}
      projects={projects}
      experience={experience}
      education={education}
    />
  );
}
