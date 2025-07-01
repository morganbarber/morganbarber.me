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
  title: "Morgan Barber - Cybersecurity Specialist",
  description:
    "Personal portfolio of Morgan Barber, Cybersecurity Specialist with CompTIA Network+ and A+ certifications",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
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
