import type { Metadata } from "next";
import AboutContent from "./content";
import StructuredData from "@/components/structured-data";
import { getCertifications } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { aboutPageNode, breadcrumbNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "About Morgan Barber, an aspiring cybersecurity specialist from Longmont, Colorado: core competencies, CompTIA certifications and hands-on security background.",
  path: "/about",
  type: "profile",
});

export default async function About() {
  const { data: certifications } = await getCertifications();

  return (
    <>
      <StructuredData
        data={graph(
          aboutPageNode(certifications),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        )}
      />
      <AboutContent certifications={certifications} />
    </>
  );
}
