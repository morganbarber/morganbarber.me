"use client"

import type React from "react"

import { useState } from "react"
import TerminalWindow from "@/components/terminal-window"
import TypingText from "@/components/typing-text"
import { Mail, Linkedin, Github, MapPin, Send, CheckCircle } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setIsSubmitted(true)

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: "", email: "", subject: "", message: "" })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <TerminalWindow title="morgan@barber:~/contact$ cat info.txt">
          <div className="space-y-6">
            <div className="border-b border-green-400/20 pb-4">
              <h1 className="text-2xl font-bold text-green-300 mb-2">Get In Touch</h1>
              <div className="text-green-400 font-mono">
                <TypingText text="Let's discuss cybersecurity, technology, or potential collaborations" />
              </div>
            </div>

            <div className="text-green-400/90">
              <p className="mb-4">
                I'm always interested in connecting with fellow security professionals, discussing innovative projects,
                or exploring new opportunities in cybersecurity and technology.
              </p>
              <p>
                Whether you have a question about security implementations, want to collaborate on a project, or just
                want to chat about the latest in tech, feel free to reach out!
              </p>
            </div>
          </div>
        </TerminalWindow>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Contact Form */}
          <TerminalWindow title="send_message.sh">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto" />
                  <div className="text-green-300 font-semibold">Message Sent Successfully!</div>
                  <div className="text-green-400/80 text-sm">I'll get back to you soon.</div>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-green-400 text-sm font-mono mb-2">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-green-400 text-sm font-mono mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-green-400 text-sm font-mono mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors"
                      placeholder="What's this about?"
                    />
                  </div>

                  <div>
                    <label className="block text-green-400 text-sm font-mono mb-2">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full bg-black/40 border border-green-400/30 rounded px-3 py-2 text-green-400 focus:border-green-400 focus:outline-none transition-colors resize-none"
                      placeholder="Your message here..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full glass rounded py-3 px-4 text-green-400 font-mono hover:bg-green-400/10 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          </TerminalWindow>

          {/* Contact Info */}
          <div className="space-y-6">
            <TerminalWindow title="contact_info.json">
              <div className="space-y-4">
                <div className="text-green-300 font-mono mb-4">Direct Contact</div>

                <div className="space-y-3">
                  <a
                    href="mailto:morgan.barber@example.com"
                    className="flex items-center space-x-3 text-green-400 hover:text-green-300 transition-colors group"
                  >
                    <Mail className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>morgan.barber@example.com</span>
                  </a>

                  <a
                    href="https://linkedin.com/in/morganbarber"
                    className="flex items-center space-x-3 text-green-400 hover:text-green-300 transition-colors group"
                  >
                    <Linkedin className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>linkedin.com/in/morganbarber</span>
                  </a>

                  <a
                    href="https://github.com/morganbarber"
                    className="flex items-center space-x-3 text-green-400 hover:text-green-300 transition-colors group"
                  >
                    <Github className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span>github.com/morganbarber</span>
                  </a>

                  <div className="flex items-center space-x-3 text-green-400/80">
                    <MapPin className="h-5 w-5" />
                    <span>Colorado, USA</span>
                  </div>
                </div>
              </div>
            </TerminalWindow>

            <TerminalWindow title="availability.log">
              <div className="space-y-4">
                <div className="text-green-300 font-mono mb-4">Current Status</div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Available for consulting</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Open to collaboration</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-green-400 text-sm">Response time: 24-48 hours</span>
                  </div>
                </div>
              </div>
            </TerminalWindow>
          </div>
        </div>
      </div>
    </div>
  )
}
