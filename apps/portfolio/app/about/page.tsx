import type { Metadata } from "next";
import AboutContent from "./content";
import StructuredData from "@/components/structured-data";
import { getCertifications } from "@repo/data/content";
import { pageMetadata } from "@/lib/seo";
import { aboutPageNode, breadcrumbNode, graph } from "@/lib/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "About",
  description:
    "About Morgan Barber, a 16-year-old ethical hacker and aspiring red teamer from Longmont, Colorado: offensive skills, toolkit and CompTIA certifications.",
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
