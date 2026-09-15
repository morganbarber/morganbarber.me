"use client";

import { motion } from "framer-motion";
import GlitchText from "@repo/ui/glitch-text";
import { Download } from "lucide-react";

import type { CertificationSummary } from "@repo/types";
const skills = [
    "PYTHON SCRIPTING", "VULNERABILITY ASSESSMENT", "SYSTEM HARDENING", "NETWORK SECURITY",
    "THREAT ANALYSIS", "LOG ANALYSIS", "COMMUNICATION", "IT OPERATIONS"
];

export default function AboutContent({ certifications }: { certifications: CertificationSummary[] }) {
    return (
        <main className="min-h-screen pt-32 pb-32 px-6 max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <GlitchText text="ABOUT" className="text-5xl md:text-8xl mb-12 block" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div className="space-y-6 font-mono text-lg text-muted-foreground">
                        <p>
                            Name: MORGAN BARBER<br />
                            Role: Aspiring Cybersecurity Specialist<br />
                            Status: ACTIVE<br />
                            Location: Longmont, CO
                        </p>
                        <p>
                            I am an aspiring cybersecurity specialist with a strong foundation in information security principles and hands-on technical problem solving.
                        </p>
                        <p>
                            My approach involves identifying vulnerabilities and collaborating with technical teams to strengthen organizational security posture. I have a keen attention to detail in vulnerability assessments and security log analysis.
                        </p>
                    </div>

                    <div className="space-y-12">
                        <div>
                            <h2 className="text-2xl font-bold mb-6 border-b border-primary pb-2 uppercase text-primary">Core Competencies</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {skills.map((skill, index) => (
                                    <div key={index} className="border border-muted p-4 hover:bg-primary hover:text-background transition-colors cursor-crosshair">
                                        <span className="text-xs opacity-50 block mb-1">0{index + 1}</span>
                                        <span className="font-bold tracking-wider">{skill}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold mb-6 border-b border-primary pb-2 uppercase text-primary">Certifications</h2>
                            <ul className="space-y-2 font-mono text-muted-foreground">
                                {certifications.map((cert) => (
                                    <li key={cert.id} className="flex items-center gap-2 group">
                                        <span className="text-primary">&gt;</span>
                                        <span>{cert.name}</span>
                                        <a
                                            href={cert.file_url}
                                            download
                                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-primary hover:text-primary/80"
                                            title="Download Certificate"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}
