import { isUrlOnHost } from "@repo/security/url";
import { SITE_CONFIG, SKILL_GROUPS, SOCIAL_LINKS } from "@repo/config/site";
import type {
  BlogPost,
  BlogPostSummary,
  CertificationSummary,
  EducationSummary,
  Project,
  ProjectSummary,
} from "@repo/types";
import { absoluteUrl, readableTitle } from "./seo";

/**
 * schema.org structured data.
 *
 * Every node that refers to the site owner points at one Person via a stable
 * `@id` rather than restating a new anonymous Person each time. That is what
 * lets Google treat the blog posts, projects and profile pages as the work of
 * one entity — the signal behind a knowledge panel for a name search.
 *
 * Only facts that are visible on the page are asserted. Structured data that
 * describes content the user cannot see is a manual-action risk, not a boost.
 */

type Node = Record<string, unknown>;

export const PERSON_ID = `${absoluteUrl("/")}#person`;
export const WEBSITE_ID = `${absoluteUrl("/")}#website`;

const personRef = { "@id": PERSON_ID };
const websiteRef = { "@id": WEBSITE_ID };

/** Wraps nodes in a single @graph document. */
export function graph(...nodes: (Node | null | undefined)[]): Node {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

/** The site owner. Declared once, in the root layout. */
export function personNode(): Node {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE_CONFIG.name,
    givenName: "Morgan",
    familyName: "Barber",
    url: absoluteUrl("/"),
    image: absoluteUrl("/opengraph-image"),
    email: `mailto:${SITE_CONFIG.email}`,
    jobTitle: SITE_CONFIG.role,
    description: SITE_CONFIG.shortDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Longmont",
      addressRegion: "CO",
      addressCountry: "US",
    },
    // Derived from the About page's skills so the two cannot drift apart.
    knowsAbout: ["Ethical Hacking", "Red Teaming", ...SKILL_GROUPS.flatMap((g) => g.skills)],
    // sameAs is how search engines reconcile this site with the owner's other
    // profiles — GitHub, LinkedIn and HackTheBox all describe the same person.
    sameAs: SOCIAL_LINKS.map((link) => link.url),
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: absoluteUrl("/"),
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.shortDescription,
    inLanguage: "en-US",
    publisher: personRef,
    author: personRef,
  };
}

/** A visible breadcrumb trail, mirrored as BreadcrumbList. */
export function breadcrumbNode(items: { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Home page: Google's recommended type for a personal site. */
export function profilePageNode(): Node {
  return {
    "@type": "ProfilePage",
    "@id": `${absoluteUrl("/")}#profilepage`,
    url: absoluteUrl("/"),
    name: `${SITE_CONFIG.name} — ${SITE_CONFIG.role}`,
    isPartOf: websiteRef,
    mainEntity: personRef,
    inLanguage: "en-US",
  };
}

/** About page, including the certifications shown on it. */
export function aboutPageNode(certifications: CertificationSummary[]): Node {
  return {
    "@type": "AboutPage",
    url: absoluteUrl("/about"),
    name: `About ${SITE_CONFIG.name}`,
    isPartOf: websiteRef,
    mainEntity: {
      ...personRef,
      hasCredential: certifications.map((cert) => ({
        "@type": "EducationalOccupationalCredential",
        name: cert.name,
        credentialCategory: "certification",
        ...(cert.issuer ? { recognizedBy: { "@type": "Organization", name: cert.issuer } } : {}),
        ...(cert.issued_on ? { dateCreated: cert.issued_on } : {}),
      })),
    },
  };
}

export function experiencePageNode(education: EducationSummary[]): Node {
  return {
    "@type": "ProfilePage",
    url: absoluteUrl("/experience"),
    name: `Experience — ${SITE_CONFIG.name}`,
    isPartOf: websiteRef,
    mainEntity: {
      ...personRef,
      alumniOf: education.map((entry) => ({
        "@type": "EducationalOrganization",
        name: entry.school,
      })),
    },
  };
}

export function contactPageNode(): Node {
  return {
    "@type": "ContactPage",
    url: absoluteUrl("/contact"),
    name: `Contact ${SITE_CONFIG.name}`,
    isPartOf: websiteRef,
    about: personRef,
  };
}

export function blogIndexNode(posts: BlogPostSummary[]): Node {
  return {
    "@type": "Blog",
    "@id": `${absoluteUrl("/blog")}#blog`,
    url: absoluteUrl("/blog"),
    name: `${SITE_CONFIG.name} — Offensive Security Blog`,
    isPartOf: websiteRef,
    author: personRef,
    publisher: personRef,
    inLanguage: "en-US",
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${absoluteUrl(`/blog/${post.slug}`)}#article`,
      headline: readableTitle(post.title),
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.created_at,
      ...(post.updated_at ? { dateModified: post.updated_at } : {}),
    })),
  };
}

export function blogPostingNode(post: BlogPost): Node {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const words = (post.content ?? "").split(/\s+/).filter(Boolean).length;

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: url,
    headline: readableTitle(post.title).slice(0, 110),
    ...(post.summary ? { description: post.summary } : {}),
    image: `${url}/opengraph-image`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: personRef,
    publisher: personRef,
    isPartOf: { "@id": `${absoluteUrl("/blog")}#blog` },
    inLanguage: "en-US",
    ...(post.tag ? { keywords: post.tag, articleSection: post.tag } : {}),
    ...(words ? { wordCount: words } : {}),
    ...(post.reading_minutes ? { timeRequired: `PT${post.reading_minutes}M` } : {}),
  };
}

export function projectsIndexNode(projects: ProjectSummary[]): Node {
  return {
    "@type": "CollectionPage",
    url: absoluteUrl("/projects"),
    name: `Projects — ${SITE_CONFIG.name}`,
    isPartOf: websiteRef,
    author: personRef,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: projects.map((project, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/projects/${project.id}`),
        name: readableTitle(project.title),
      })),
    },
  };
}

/** Hosts whose links mark a project as source code in the structured data. */
const CODE_HOSTS = ["github.com", "gitlab.com"] as const;

/** A project. Typed as source code when it links to a repository. */
export function projectNode(project: Project): Node {
  const url = absoluteUrl(`/projects/${project.id}`);
  const isRepository = isUrlOnHost(project.link, CODE_HOSTS);

  return {
    "@type": isRepository ? "SoftwareSourceCode" : "CreativeWork",
    "@id": `${url}#project`,
    url,
    mainEntityOfPage: url,
    name: readableTitle(project.title),
    description: project.description,
    image: `${url}/opengraph-image`,
    author: personRef,
    creator: personRef,
    dateCreated: project.created_at,
    dateModified: project.updated_at,
    keywords: project.tags.join(", "),
    genre: project.category,
    creativeWorkStatus: project.status,
    ...(isRepository
      ? { codeRepository: project.link }
      : project.link
        ? { sameAs: project.link }
        : {}),
  };
}
