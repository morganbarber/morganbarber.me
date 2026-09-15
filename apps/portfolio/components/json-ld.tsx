import { SITE_CONFIG } from "@repo/config/site";
import { SOCIAL_LINKS } from "@repo/config/site";
import { getSiteUrl } from "@repo/config/env";

/**
 * Schema.org structured data.
 *
 * The payload is built from local constants and serialised with JSON.stringify,
 * so nothing user- or database-controlled reaches the script tag. `</script>`
 * is still escaped defensively: if this ever starts embedding stored content, a
 * closing tag inside a string would otherwise break out of the block, and that
 * is a footgun worth disarming before it is armed.
 *
 * The nonce is required — under `strict-dynamic` an inline block without one is
 * blocked, JSON-LD included.
 */
export default function JsonLd({ nonce }: { nonce?: string }) {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE_CONFIG.name,
    url: siteUrl,
    email: `mailto:${SITE_CONFIG.email}`,
    jobTitle: SITE_CONFIG.role,
    description: SITE_CONFIG.shortDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Longmont",
      addressRegion: "CO",
      addressCountry: "US",
    },
    knowsAbout: [
      "Network Security",
      "Threat Analysis",
      "System Hardening",
      "Penetration Testing",
      "Incident Response",
    ],
    sameAs: SOCIAL_LINKS.map((link) => link.url),
  };

  const serialised = JSON.stringify(jsonLd).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // JSON-LD has no JSX equivalent. Safe here because the payload is built
      // entirely from local constants — no database or user input — serialised
      // with JSON.stringify, and has `<` escaped above, so no injected markup
      // can reach this string.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: serialised }}
    />
  );
}
