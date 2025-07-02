import type { Metadata } from "next"
import AboutClientPage from "./AboutClientPage"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Morgan Barber, a dedicated cybersecurity professional with CompTIA Network+ and A+ certifications. Expert in network security, threat analysis, and innovative technology solutions.",
  openGraph: {
    title: "About Morgan Barber - Cybersecurity Expert",
    description:
      "Dedicated cybersecurity professional with CompTIA certifications. Expert in network security, threat analysis, machine learning, and innovative technology solutions.",
    url: "https://morganbarber.dev/about",
  },
}

export default function About() {
  return <AboutClientPage />
}
