"use client"

import TerminalWindow from "@/components/terminal-window"
import { Building, Calendar, Award } from "lucide-react"

export default function Experience() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <TerminalWindow title="morgan@barber:~/experience$ git log --oneline">
          <div className="space-y-6">
            <div className="border-b border-green-400/20 pb-4">
              <h1 className="text-2xl font-bold text-green-300 mb-2">Professional Experience</h1>
              <div className="text-green-400/80">Career timeline and achievements</div>
            </div>

            {/* SVVSD Innovation Center */}
            <div className="glass rounded-lg p-6 border border-green-400/20 hover:border-green-400/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Building className="h-6 w-6 text-green-400" />
                  <div>
                    <h3 className="text-green-300 font-semibold text-lg">SVVSD Innovation Center</h3>
                    <p className="text-green-400/80">Technology Specialist</p>
                  </div>
                </div>
                <div className="text-right text-sm text-green-400/60">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>1 Year</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-2 border-green-400/30 pl-4">
                  <h4 className="text-green-300 font-semibold mb-2">Machine Learning Division</h4>
                  <ul className="text-green-400/80 space-y-1 text-sm">
                    <li>• Developed computer vision system for fish detection and classification</li>
                    <li>• Implemented deep learning models using TensorFlow and OpenCV</li>
                    <li>• Achieved 94% accuracy in species identification</li>
                    <li>• Optimized model performance for real-time processing</li>
                  </ul>
                </div>

                <div className="border-l-2 border-green-400/30 pl-4">
                  <h4 className="text-green-300 font-semibold mb-2">Creative Technology Division</h4>
                  <ul className="text-green-400/80 space-y-1 text-sm">
                    <li>• Designed and implemented secure voting system using Raspberry Pi</li>
                    <li>• Developed C++ backend for vote processing and encryption</li>
                    <li>• Created 3D-printed hardware components using CAD software</li>
                    <li>• Ensured system security and vote integrity</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {["Machine Learning", "Computer Vision", "C++", "Raspberry Pi", "CAD", "TensorFlow", "OpenCV"].map(
                  (tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded border border-green-400/20"
                    >
                      {tech}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </TerminalWindow>

        <div className="grid md:grid-cols-2 gap-6">
          <TerminalWindow title="achievements.md">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Award className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-mono">Key Achievements</span>
              </div>

              <div className="space-y-3">
                <div className="glass rounded p-3 border border-green-400/20">
                  <div className="text-green-300 font-semibold text-sm">Fish Detection System</div>
                  <div className="text-green-400/80 text-xs">94% accuracy in real-time species identification</div>
                </div>

                <div className="glass rounded p-3 border border-green-400/20">
                  <div className="text-green-300 font-semibold text-sm">Secure Voting Platform</div>
                  <div className="text-green-400/80 text-xs">End-to-end encrypted voting system</div>
                </div>

                <div className="glass rounded p-3 border border-green-400/20">
                  <div className="text-green-300 font-semibold text-sm">CompTIA Certifications</div>
                  <div className="text-green-400/80 text-xs">Network+ and A+ certified professional</div>
                </div>
              </div>
            </div>
          </TerminalWindow>

          <TerminalWindow title="technologies.json">
            <div className="space-y-4">
              <div className="text-green-300 font-mono mb-4">Technology Stack</div>

              <div className="space-y-3">
                <div>
                  <div className="text-green-400 text-sm mb-2">Security & Networking</div>
                  <div className="flex flex-wrap gap-1">
                    {["Network Security", "Penetration Testing", "Firewall Config", "VPN Setup"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-green-400 text-sm mb-2">Programming</div>
                  <div className="flex flex-wrap gap-1">
                    {["C++", "Python", "JavaScript", "SQL"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-green-400 text-sm mb-2">Hardware & Systems</div>
                  <div className="flex flex-wrap gap-1">
                    {["Raspberry Pi", "Arduino", "Linux", "CAD Design"].map((tech) => (
                      <span key={tech} className="px-2 py-1 bg-green-400/10 text-green-400 text-xs rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TerminalWindow>
        </div>
      </div>
    </div>
  )
}
