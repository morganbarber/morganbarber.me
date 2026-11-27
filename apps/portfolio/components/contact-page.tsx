import { SOCIAL_LINKS, SITE_CONFIG } from "@repo/config/site";
import ContactForm from "@/components/contact-form";
import CopyButton from "@/components/copy-button";
import PageIntro from "@/components/page-intro";
import LocalTime from "@/components/local-time";
import { socialLabel } from "@/lib/site-nav";

/**
 * Server component. Only the form and the copy button ship JavaScript.
 */
export default function ContactPage() {
  return (
    <main>
      <PageIntro
        path="/contact"
        title="Say hello"
        lede="Open to internships, collaboration and security research conversations. I reply within a day."
      />

      <section className="shell grid gap-16 pb-32 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-10">
          <div data-reveal>
            <p className="mb-3 label">email</p>
            <CopyButton
              value={SITE_CONFIG.email}
              label="Email copied"
              className="link-draw text-left text-2xl break-all text-primary md:text-3xl"
            />
            <p className="mt-2 text-sm text-muted-foreground">Click to copy, or use the form.</p>
          </div>
          <div data-reveal>
            <p className="mb-3 label">elsewhere</p>
            <ul className="space-y-2">
              {SOCIAL_LINKS.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer external"
                    className="link-draw text-xl"
                  >
                    {socialLabel(link.name)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal>
            <p className="mb-3 label">my local time</p>
            <p className="font-mono text-xl">
              <LocalTime />
            </p>
            <p className="text-sm text-muted-foreground">{SITE_CONFIG.location}</p>
          </div>
        </div>

        <div data-reveal>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
