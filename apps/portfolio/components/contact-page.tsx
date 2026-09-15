import GlitchHeading from "@repo/ui/glitch-heading";
import { SOCIAL_LINKS, SITE_CONFIG } from "@repo/config/site";
import ContactForm from "@/components/contact-form";

/**
 * Server component. Only the form itself needs interactivity, so only the form
 * ships JavaScript — the previous version marked the whole page "use client"
 * and pulled framer-motion into the bundle for a page with no animation.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <GlitchHeading
              as="h1"
              lines={["CONTACT", "FORM"]}
              className="text-5xl md:text-7xl leading-none"
              lineClassName={[undefined, "text-transparent text-stroke"]}
              wrapperClassName={"mb-8"}
          />

          <p className="font-mono text-muted-foreground max-w-md mb-8">
            Open to internships, collaboration and security research conversations.
            Response time: &lt; 24 hours.
          </p>

          <div className="font-mono text-lg">
            <p className="text-primary mb-2">{"// EMAIL"}</p>
            <a
              href={`mailto:${SITE_CONFIG.email}`}
              className="hover:text-primary transition-colors text-2xl break-all focus-visible:outline-2 focus-visible:outline-primary"
            >
              {SITE_CONFIG.email}
            </a>
          </div>

          <div className="font-mono text-lg mt-8">
            <p className="text-primary mb-2">{"// SOCIALS"}</p>
            <ul className="flex flex-col gap-2 list-none p-0">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className="hover:text-primary transition-colors text-xl w-fit inline-block focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ContactForm />
      </div>
    </main>
  );
}
