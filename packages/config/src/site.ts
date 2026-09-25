import type { SocialLink } from "@repo/types";

export const SITE_CONFIG = {
  name: "Morgan Barber",
  email: "morgan@morganbarber.me",
  location: "Longmont, CO",
  role: "Aspiring Cybersecurity Specialist",
  roleSubtitle: "16 Year Old Aspiring Cybersecurity Professional",
  /**
   * The home page's meta description: who, where, what — within the ~155
   * characters Google shows. Leads with the name because name searches are the
   * query this site most needs to win.
   */
  seoDescription:
    "Morgan Barber, aspiring cybersecurity specialist in Longmont, CO. CompTIA Security+ certified, focused on network security, threat analysis and system hardening.",
  shortDescription:
    "Aspiring Cybersecurity Specialist focused on Network Security, Threat Analysis, and System Hardening.",
  description:
    "I possess a strong foundation in information security principles and hands-on technical problem solving. My focus is on developing expertise in network security, threat analysis, and system hardening, identifying vulnerabilities to strengthen organizational security postures.",
} as const;

export const SERVICES = [
  "PENETRATION TESTING",
  "INFRASTRUCTURE HARDENING",
  "MALWARE ANALYSIS",
  "INCIDENT RESPONSE",
  "CLOUD SECURITY",
  "SECURE CODE REVIEW",
] as const;

export const STACK = [
  "PYTHON",
  "RUST",
  "TYPESCRIPT",
  "NEXT.JS",
  "TAILWIND",
  "LINUX",
  "WIRESHARK",
  "METASPLOIT",
  "DOCKER",
  "GIT",
  "BASH",
  "SQL",
] as const;

export const MARQUEE_TEXT =
  "NETWORK SECURITY // THREAT ANALYSIS // COMPTIA SECURITY+ // SYSTEM HARDENING // PYTHON // ";

/**
 * HackTheBox profile, shown in its own section on the home page.
 *
 * Two identifiers, because HackTheBox uses two:
 *
 *   • `profileId` — the numeric account ID, from app.hackthebox.com/users/<id>.
 *     Used for the stats API. The section is hidden until it is set.
 *   • `publicProfileUrl` — the shareable page on profile.hackthebox.com. This
 *     is where visitors are linked: app.hackthebox.com is HTB's logged-in app,
 *     so a visitor without an account would hit a sign-in wall there.
 *
 * `fallback` is what the section shows when live stats are unavailable — no
 * `HTB_APP_TOKEN` configured, or HackTheBox unreachable. With a token set,
 * live values replace these automatically (refreshed every 6 hours). Any field
 * left null is simply not shown.
 */
export const HACKTHEBOX: {
  profileId: number | null;
  publicProfileUrl: string | null;
  username: string | null;
  /**
   * Shown only when the live API is unavailable (no HTB_APP_TOKEN, or HTB is
   * down). Leave a field null — or 0 — to hide it; only real stats render.
   */
  fallback: {
    rank: string | null;
    points: number | null;
    userOwns: number | null;
    systemOwns: number | null;
    challengesSolved: number | null;
    sherlocksSolved: number | null;
  };
  /** Short line under the heading. */
  tagline: string;
} = {
  profileId: 2623084,
  publicProfileUrl: "https://profile.hackthebox.com/profile/019eafa8-fe0f-72e2-b308-40ed904de31a",
  username: "MorganBarber",
  fallback: {
    rank: "Script Kiddie",
    points: 10,
    userOwns: 14,
    systemOwns: 12,
    challengesSolved: 8,
    sherlocksSolved: 1,
  },
  tagline:
    "Hands-on offensive practice: enumerating, exploiting and escalating on live lab machines.",
};

/**
 * Where visitors are sent: the public profile page when configured, otherwise
 * the app URL built from the numeric ID. Null until an ID is configured.
 */
export function hackTheBoxProfileUrl(): string | null {
  if (!HACKTHEBOX.profileId) return null;
  return HACKTHEBOX.publicProfileUrl ?? `https://app.hackthebox.com/users/${HACKTHEBOX.profileId}`;
}

const htbUrl = hackTheBoxProfileUrl();

/** The HackTheBox entry appears only once a profile ID is configured. */
export const SOCIAL_LINKS: SocialLink[] = [
  { name: "GITHUB", url: "https://github.com/morganbarber" },
  { name: "LINKEDIN", url: "https://linkedin.com/in/MorganEthanBarber" },
  ...(htbUrl ? [{ name: "HACKTHEBOX", url: htbUrl }] : []),
];
