"use client"

import TerminalWindow from "@/components/terminal-window"
import TypingText from "@/components/typing-text"
import { Award, Code, Zap } from "lucide-react"

export default function AboutClientPage() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <TerminalWindow title="morgan@barber:~/about$ cat README.md">
          <div className="space-y-6">
            <div className="border-b border-green-400/20 pb-4">
              <h1 className="text-2xl font-bold text-green-300 mb-2">About Morgan Barber</h1>
              <div className="text-green-400 font-mono">
                <TypingText text="Cybersecurity Specialist | Innovation Enthusiast | Problem Solver" />
              </div>
            </div>

            <div className="space-y-4 text-green-400/90">
              <p>
                I'm a dedicated cybersecurity professional with a passion for protecting digital infrastructure and
                developing innovative technology solutions. My journey in tech combines security expertise with creative
                problem-solving, always staying ahead of emerging threats and technologies.
              </p>

              <p>
                My experience spans from hands-on network security implementation to cutting-edge machine learning
                applications. I believe in the power of technology to solve real-world problems while maintaining the
                highest security standards.
              </p>
            </div>
          </div>
        </TerminalWindow>

        <div className="grid md:grid-cols-2 gap-6">
          <TerminalWindow title="certifications.json">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-mono">Active Certifications</span>
              </div>

              <div className="space-y-3">
                <div className="glass rounded p-3 border border-green-400/20">
                  <div className="text-green-300 font-semibold">CompTIA Network+</div>
                  <div className="text-green-400/80 text-sm">Network infrastructure and security</div>
                </div>

                <div className="glass rounded p-3 border border-green-400/20">
                  <div className="text-green-300 font-semibold">CompTIA A+</div>
                  <div className="text-green-400/80 text-sm">Hardware and software troubleshooting</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="skills.sh">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Code className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-mono">Core Competencies</span>
              </div>

              <div className="space-y-2">
                {[
                  { skill: "Network Security", level: 90 },
                  { skill: "Threat Analysis", level: 85 },
                  { skill: "Machine Learning", level: 80 },
                  { skill: "C++ Development", level: 75 },
                  { skill: "System Administration", level: 85 },
                ].map((item) => (
                  <div key={item.skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-400">{item.skill}</span>
                      <span className="text-green-400/60">{item.level}%</span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${item.level}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TerminalWindow>
        </div>

        <TerminalWindow title="interests.log">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="h-5 w-5 text-green-400" />
              <span className="text-green-300 font-mono">Areas of Interest</span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">Security & Defense</h4>
                <ul className="text-green-400/80 text-sm space-y-1">
                  <li>• Network penetration testing</li>
                  <li>• Threat intelligence analysis</li>
                  <li>• Security automation</li>
                  <li>• Incident response</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-green-300 font-semibold">Innovation & Tech</h4>
                <ul className="text-green-400/80 text-sm space-y-1">
                  <li>• Computer vision applications</li>
                  <li>• IoT security solutions</li>
                  <li>• Embedded systems</li>
                  <li>• Creative technology</li>
                </ul>
              </div>
            </div>
          </div>
        </TerminalWindow>
      </div>
    </div>
  )
}
