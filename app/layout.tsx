import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://morganbarber.dev"),
  title: {
    default: "Morgan Barber - Cybersecurity Specialist & Technology Innovator",
    template: "%s | Morgan Barber",
  },
  description:
    "Cybersecurity specialist with CompTIA Network+ and A+ certifications. Expert in network security, threat analysis, machine learning, and innovative technology solutions. Based in Colorado, USA.",
  keywords: [
    "cybersecurity",
    "network security",
    "CompTIA Network+",
    "CompTIA A+",
    "threat analysis",
    "machine learning",
    "computer vision",
    "IoT security",
    "penetration testing",
    "security consultant",
    "Colorado cybersecurity",
    "technology innovation",
    "C++ development",
    "Python security",
    "network infrastructure",
    "security automation",
  ],
  authors: [{ name: "Morgan Barber", url: "https://morganbarber.dev" }],
  creator: "Morgan Barber",
  publisher: "Morgan Barber",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://morganbarber.dev",
    siteName: "Morgan Barber - Cybersecurity Specialist",
    title: "Morgan Barber - Cybersecurity Specialist & Technology Innovator",
    description:
      "Cybersecurity specialist with CompTIA Network+ and A+ certifications. Expert in network security, threat analysis, machine learning, and innovative technology solutions.",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Morgan Barber - Cybersecurity Specialist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morgan Barber - Cybersecurity Specialist",
    description:
      "Cybersecurity specialist with CompTIA certifications. Expert in network security, threat analysis, and technology innovation.",
    images: ["/og-image.png"],
    creator: "@morganbarber",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  alternates: {
    canonical: "https://morganbarber.dev",
    languages: {
      "en-US": "https://morganbarber.dev",
    },
  },
  category: "technology",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body
        className={`${inter.className} ${jetbrainsMono.variable} bg-black text-green-400 min-h-screen overflow-x-hidden`}
      >
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>
        </div>
        <div className="relative z-10">
          <Navigation />
          <main className="pt-20">{children}</main>
        </div>
      </body>
    </html>
  )
}
