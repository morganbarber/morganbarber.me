import Script from "next/script"

interface StructuredDataProps {
  type: "person" | "article" | "website" | "organization"
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  const generateStructuredData = () => {
    const baseData = {
      "@context": "https://schema.org",
    }

    switch (type) {
      case "person":
        return {
          ...baseData,
          "@type": "Person",
          name: "Morgan Barber",
          jobTitle: "Cybersecurity Specialist",
          description: "Cybersecurity specialist with CompTIA Network+ and A+ certifications",
          url: "https://morganbarber.dev",
          sameAs: ["https://linkedin.com/in/morganbarber", "https://github.com/morganbarber"],
          knowsAbout: [
            "Cybersecurity",
            "Network Security",
            "Threat Analysis",
            "Machine Learning",
            "Computer Vision",
            "IoT Security",
            "Penetration Testing",
          ],
          hasCredential: [
            {
              "@type": "EducationalOccupationalCredential",
              name: "CompTIA Network+",
              credentialCategory: "Professional Certification",
            },
            {
              "@type": "EducationalOccupationalCredential",
              name: "CompTIA A+",
              credentialCategory: "Professional Certification",
            },
          ],
          address: {
            "@type": "PostalAddress",
            addressRegion: "Colorado",
            addressCountry: "US",
          },
          ...data,
        }

      case "article":
        return {
          ...baseData,
          "@type": "Article",
          headline: data.title,
          description: data.description,
          author: {
            "@type": "Person",
            name: "Morgan Barber",
            url: "https://morganbarber.dev",
          },
          publisher: {
            "@type": "Person",
            name: "Morgan Barber",
            url: "https://morganbarber.dev",
          },
          datePublished: data.publishedAt,
          dateModified: data.modifiedAt,
          url: data.url,
          keywords: data.keywords,
          articleSection: "Technology",
          ...data,
        }

      case "website":
        return {
          ...baseData,
          "@type": "WebSite",
          name: "Morgan Barber - Cybersecurity Specialist",
          description:
            "Cybersecurity specialist with CompTIA certifications. Expert in network security, threat analysis, and innovative technology solutions.",
          url: "https://morganbarber.dev",
          author: {
            "@type": "Person",
            name: "Morgan Barber",
          },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://morganbarber.dev/blog?search={search_term_string}",
            "query-input": "required name=search_term_string",
          },
          ...data,
        }

      case "organization":
        return {
          ...baseData,
          "@type": "ProfessionalService",
          name: "Morgan Barber Cybersecurity Services",
          description: "Professional cybersecurity consulting and technology innovation services",
          url: "https://morganbarber.dev",
          founder: {
            "@type": "Person",
            name: "Morgan Barber",
          },
          serviceType: "Cybersecurity Consulting",
          areaServed: "United States",
          address: {
            "@type": "PostalAddress",
            addressRegion: "Colorado",
            addressCountry: "US",
          },
          ...data,
        }

      default:
        return baseData
    }
  }

  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateStructuredData()),
      }}
    />
  )
}
