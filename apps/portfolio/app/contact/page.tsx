import type { Metadata } from "next";
import ContactPage from "@/components/contact-page";
import StructuredData from "@/components/structured-data";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbNode, contactPageNode, graph } from "@/lib/structured-data";

/*
  The title was previously "Contact | Morgan Barber", which the layout template
  then suffixed again — the page's search result read
  "Contact | Morgan Barber | Morgan Barber". It also had no canonical URL.
*/
export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Contact Morgan Barber about cybersecurity internships, collaboration or security research. Email or use the secure contact form — replies within 24 hours.",
  path: "/contact",
});

export default function Contact() {
  return (
    <>
      <StructuredData
        data={graph(
          contactPageNode(),
          breadcrumbNode([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        )}
      />
      <ContactPage />
    </>
  );
}
