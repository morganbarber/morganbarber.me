import type { SocialLink } from "@repo/types";

export const SITE_CONFIG = {
  name: "Morgan Barber",
  email: "morgan@morganbarber.me",
  location: "Longmont, CO",
  role: "Aspiring Cybersecurity Specialist",
  roleSubtitle: "16 Year Old Aspiring Cybersecurity Professional",
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

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "GITHUB", url: "https://github.com/morganbarber" },
  { name: "LINKEDIN", url: "https://linkedin.com/in/MorganEthanBarber" },
];
