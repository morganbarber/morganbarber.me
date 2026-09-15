import type { Metadata } from "next";
import AboutContent from "./content";
import { getCertifications } from "@repo/data/content";
import { getSiteUrl } from "@repo/config/env";

export const metadata: Metadata = {
  title: "About",
  description:
    "Morgan Barber — aspiring cybersecurity specialist. Core competencies, certifications and background.",
  alternates: { canonical: `${getSiteUrl()}/about` },
  openGraph: {
    title: "About | Morgan Barber",
    description: "Background, core competencies and certifications.",
    url: `${getSiteUrl()}/about`,
  },
};

export default async function About() {
  const { data: certifications } = await getCertifications();
  return <AboutContent certifications={certifications} />;
}
