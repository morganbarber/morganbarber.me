import type { SocialLink } from "@repo/types";

/** Update on your birthday — every mention of your age on the site reads this. */
const AGE = 17;

export const SITE_CONFIG = {
  name: "Morgan Barber",
  age: AGE,
  email: "morgan@morganbarber.me",
  location: "Longmont, CO",
  role: "Ethical Hacker & Aspiring Red Teamer",
  roleSubtitle: `${AGE} Year Old Cybersecurity Specialist // Aspiring Red Teamer`,
  /**
   * The home page's meta description: who, where, what — within the ~155
   * characters Google shows. Leads with the name because name searches are the
   * query this site most needs to win.
   */
  seoDescription: `Morgan Barber, ${AGE}-year-old ethical hacker and aspiring red teamer in Longmont, CO. CompTIA Security+ certified, sharpening offensive skills on HackTheBox.`,
  shortDescription:
    "Cybersecurity specialist and aspiring red teamer focused on penetration testing, web exploitation and privilege escalation, grounded in system hardening and defense.",
  description:
    "I build offensive security skills the hands-on way: enumerating, exploiting and escalating privileges on HackTheBox lab machines, and writing my own tooling in Python. A background in defense — system hardening, network security and CyberPatriot — means I know what I'm up against and how findings get fixed. Everything I do is authorized and in scope.",
} as const;

export interface Capability {
  title: string;
  description: string;
  /** The command this phase typically opens with — shown on the engagement path. */
  command: string;
}

/** Home page "capabilities" grid — ordered the way an engagement runs. */
export const SERVICES: readonly Capability[] = [
  {
    title: "PENETRATION TESTING",
    command: "cat rules-of-engagement.txt",
    description:
      "Scoped, methodical testing from first scan to final report, with findings written so they can actually be fixed.",
  },
  {
    title: "RECON & ENUMERATION",
    command: "nmap -sC -sV -p- $TARGET",
    description:
      "Mapping the attack surface before touching it: ports, services, directories, subdomains and public information.",
  },
  {
    title: "WEB EXPLOITATION",
    command: "ffuf -w common.txt -u http://$TARGET/FUZZ",
    description:
      "Finding and proving OWASP Top 10 flaws — injection, broken access control, authentication bypasses — with Burp Suite.",
  },
  {
    title: "PRIVILEGE ESCALATION",
    command: "sudo -l && ./linpeas.sh",
    description:
      "Turning a foothold into root or SYSTEM on Linux and Windows through misconfigurations, weak permissions and vulnerable services.",
  },
  {
    title: "VULNERABILITY ASSESSMENT",
    command: "nmap --script vuln $TARGET",
    description:
      "Auditing systems against frameworks like NIST — the work I did reviewing my school district's security.",
  },
  {
    title: "OFFENSIVE TOOLING",
    command: "python3 scanner.py --target $TARGET",
    description:
      "Writing Python to automate the repetitive parts of an attack, like my own web vulnerability scanner.",
  },
];

export type ToolKind = "recon" | "exploit" | "post" | "script" | "platform";

export interface Tool {
  name: string;
  kind: ToolKind;
}

/** Home page toolkit, most-used first. `kind` colours it in the terminal listing. */
export const STACK: readonly Tool[] = [
  { name: "kali-linux", kind: "platform" },
  { name: "nmap", kind: "recon" },
  { name: "burp-suite", kind: "exploit" },
  { name: "metasploit", kind: "exploit" },
  { name: "python3", kind: "script" },
  { name: "bash", kind: "script" },
  { name: "ffuf", kind: "recon" },
  { name: "netcat", kind: "post" },
  { name: "sqlmap", kind: "exploit" },
  { name: "hashcat", kind: "post" },
  { name: "wireshark", kind: "recon" },
  { name: "linpeas", kind: "post" },
];

export interface SkillGroup {
  title: string;
  skills: readonly string[];
}

/**
 * About page skills, grouped and ordered by importance: the attack path
 * first, then the tools that carry it out, the foundations underneath, and
 * the defensive side last. Also feeds `knowsAbout` in the structured data.
 */
export const SKILL_GROUPS: readonly SkillGroup[] = [
  {
    title: "Offensive",
    skills: [
      "Penetration Testing",
      "Reconnaissance & Enumeration",
      "Web Application Exploitation",
      "Linux Privilege Escalation",
      "Windows Privilege Escalation",
      "Password Attacks",
    ],
  },
  {
    title: "Tooling & Scripting",
    skills: [
      "Python Scripting",
      "Bash Scripting",
      "Burp Suite",
      "Nmap",
      "Metasploit",
      "Kali Linux",
    ],
  },
  {
    title: "Foundations",
    skills: [
      "Networking & Protocols",
      "Linux & Windows Internals",
      "Vulnerability Assessment",
      "Report Writing",
    ],
  },
  {
    title: "Defensive",
    skills: ["System Hardening", "Network Defense", "Threat Analysis", "Log Analysis"],
  },
];

export const MARQUEE_TEXT =
  "ETHICAL HACKING // RED TEAMING // PENETRATION TESTING // CAPTURE THE FLAG // HACKTHEBOX // SYSTEM HARDENING // COMPTIA SECURITY+ // ";

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
    "Where the red-team skills get built: enumerating, exploiting and escalating on live lab machines.",
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
