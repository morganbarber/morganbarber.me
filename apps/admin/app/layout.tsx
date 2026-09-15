import type { Metadata } from "next";
import "./globals.css";

/**
 * The dashboard is explicitly excluded from indexing at every level available:
 * this metadata, an X-Robots-Tag header in proxy.ts, and the fact that it never
 * gets deployed in the first place.
 */
export const metadata: Metadata = {
  title: "Admin — morganbarber.me",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
