/**
 * Navigation shared by the header, the footer, the command palette and the
 * home page's section rail. Plain data, importable from server and client.
 */

export const NAV_ITEMS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Experience", href: "/experience" },
  { name: "Projects", href: "/projects" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
] as const;

/** Home page sections, in page order. `id` is the anchor. */
export const HOME_SECTIONS = [
  { id: "top", label: "Intro" },
  { id: "kill-chain", label: "Kill chain" },
  { id: "hackthebox", label: "Hack The Box" },
  { id: "credentials", label: "Credentials" },
  { id: "arsenal", label: "Arsenal" },
  { id: "track-record", label: "Track record" },
  { id: "competitions", label: "Competitions" },
  { id: "work", label: "Work" },
  { id: "writing", label: "Writing" },
  { id: "contact", label: "Contact" },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const SOCIAL_LABELS: Record<string, string> = {
  GITHUB: "GitHub",
  LINKEDIN: "LinkedIn",
  HACKTHEBOX: "Hack The Box",
};

/** "GITHUB" → "GitHub". The config stores names upper-cased. */
export function socialLabel(name: string): string {
  return SOCIAL_LABELS[name] ?? name.charAt(0) + name.slice(1).toLowerCase();
}
