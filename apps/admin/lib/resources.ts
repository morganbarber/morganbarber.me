import type { ZodType } from "zod";
import {
  blogPostSchema,
  certificationSchema,
  competitionSchema,
  educationSchema,
  experienceSchema,
  projectSchema,
  type EditableTable,
} from "@repo/data/schemas";

/**
 * Declarative description of every editable table.
 *
 * The five content tables need the same list-edit-create-delete UI with
 * different fields, so the UI is written once and driven from here. Adding a
 * column to the site means adding an entry to `fields` — not copying a whole
 * CRUD screen and editing it, which is how the five screens drift apart.
 *
 * Validation is NOT redefined here: each resource points at the shared schema
 * in `@repo/data/schemas`, which mirrors the SQL CHECK constraints. One source
 * of truth, used by the form, the server action and the database.
 */

export type FieldType =
  "text" | "textarea" | "markdown" | "number" | "checkbox" | "date" | "tags" | "url";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  /** Shown under the input. Use it for format rules and gotchas. */
  help?: string;
  placeholder?: string;
  required?: boolean;
  /** Rows for a textarea. */
  rows?: number;
  /** Editing this field after creation changes the public URL. */
  identifier?: boolean;
}

export interface ResourceDef {
  table: EditableTable;
  /** URL segment: /content/<slug> */
  slug: string;
  label: string;
  singular: string;
  description: string;
  /** Column used in the row URL. `projects` is keyed by a text id, not a serial. */
  idField: "id";
  /** Columns shown in the list view, in order. */
  listColumns: { field: string; label: string; primary?: boolean }[];
  fields: FieldDef[];
  schema: ZodType;
  /** Public URL for a row, for the "view live" link. */
  publicPath?: (row: Record<string, unknown>) => string | null;
}

export const RESOURCES: ResourceDef[] = [
  {
    table: "blog_posts",
    slug: "blog",
    label: "Blog posts",
    singular: "Blog post",
    description: "Articles on the public blog. Unpublished posts are invisible to visitors.",
    idField: "id",
    listColumns: [
      { field: "title", label: "Title", primary: true },
      { field: "slug", label: "Slug" },
      { field: "tag", label: "Tag" },
      { field: "date", label: "Date" },
    ],
    fields: [
      {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
        placeholder: "ZERO TRUST ARCHITECTURE",
        help: "Displayed uppercase on the site; type it however reads best.",
      },
      {
        name: "slug",
        label: "Slug",
        type: "text",
        required: true,
        identifier: true,
        placeholder: "zero-trust-architecture",
        help: "The URL: /blog/<slug>. Lowercase letters, numbers and single hyphens. Changing it breaks existing links.",
      },
      {
        name: "summary",
        label: "Summary",
        type: "textarea",
        rows: 3,
        help: "One or two sentences. Used on the blog index and as the social preview description.",
      },
      {
        name: "content",
        label: "Content",
        type: "markdown",
        rows: 20,
        help: "Plain text. Separate paragraphs with a blank line. HTML is NOT rendered — it is escaped, deliberately, so a stray tag cannot become a script.",
      },
      {
        name: "date",
        label: "Display date",
        type: "text",
        placeholder: "2026.01.16",
        help: "Free text, shown as-is. The site's house style is YYYY.MM.DD.",
      },
      { name: "tag", label: "Tag", type: "text", placeholder: "RESEARCH" },
      {
        name: "reading_minutes",
        label: "Reading time (minutes)",
        type: "number",
        help: "Optional. Shown next to the date on the post page.",
      },
      {
        name: "published",
        label: "Published",
        type: "checkbox",
        help: "Off by default. Nothing is visible on the site until this is on.",
      },
    ],
    schema: blogPostSchema,
    publicPath: (row) => (row.slug ? `/blog/${String(row.slug)}` : null),
  },

  {
    table: "projects",
    slug: "projects",
    label: "Projects",
    singular: "Project",
    description: "Portfolio projects, shown on the projects index and the home page.",
    idField: "id",
    listColumns: [
      { field: "title", label: "Title", primary: true },
      { field: "id", label: "ID" },
      { field: "category", label: "Category" },
      { field: "status", label: "Status" },
      { field: "sort_order", label: "Order" },
    ],
    fields: [
      {
        name: "id",
        label: "ID",
        type: "text",
        required: true,
        identifier: true,
        placeholder: "04",
        help: "The URL: /projects/<id>. Letters, numbers, hyphens and underscores. Changing it breaks existing links.",
      },
      { name: "title", label: "Title", type: "text", required: true, placeholder: "PROJECT ORION" },
      {
        name: "description",
        label: "Short description",
        type: "textarea",
        rows: 3,
        required: true,
        help: "One line. Shown in listings and used as the social preview description.",
      },
      {
        name: "category",
        label: "Category",
        type: "text",
        required: true,
        placeholder: "NETWORK SECURITY",
      },
      { name: "status", label: "Status", type: "text", required: true, placeholder: "COMPLETED" },
      {
        name: "content",
        label: "Full write-up",
        type: "markdown",
        rows: 16,
        help: "Plain text, blank line between paragraphs. Shown under 'Project Overview'.",
      },
      {
        name: "tags",
        label: "Tags",
        type: "tags",
        placeholder: "PYTHON, SCAPY, NIDS",
        help: "Comma-separated, up to 24.",
      },
      {
        name: "link",
        label: "Repository / live link",
        type: "url",
        placeholder: "https://github.com/morganbarber/project-orion",
        help: "Must start with http:// or https://. Anything else is rejected — that is what keeps a javascript: URL out of a link.",
      },
      {
        name: "sort_order",
        label: "Sort order",
        type: "number",
        help: "Lower numbers appear first. Leave gaps (10, 20, 30) so you can insert later.",
      },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    schema: projectSchema,
    publicPath: (row) => (row.id ? `/projects/${String(row.id)}` : null),
  },

  {
    table: "experience",
    slug: "experience",
    label: "Experience",
    singular: "Role",
    description: "Work history, shown on the experience page and the home page.",
    idField: "id",
    listColumns: [
      { field: "role", label: "Role", primary: true },
      { field: "company", label: "Company" },
      { field: "period", label: "Period" },
      { field: "sort_order", label: "Order" },
    ],
    fields: [
      { name: "role", label: "Role", type: "text", required: true, placeholder: "STUDENT WORKER" },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "period", label: "Period", type: "text", required: true, placeholder: "2024 - 2025" },
      { name: "description", label: "Description", type: "textarea", rows: 5, required: true },
      {
        name: "sort_order",
        label: "Sort order",
        type: "number",
        help: "Lower numbers appear first.",
      },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    schema: experienceSchema,
    publicPath: () => "/experience",
  },

  {
    table: "education",
    slug: "education",
    label: "Education",
    singular: "Education entry",
    description: "Academic records, shown on the experience page and the home page.",
    idField: "id",
    listColumns: [
      { field: "degree", label: "Programme", primary: true },
      { field: "school", label: "School" },
      { field: "period", label: "Period" },
      { field: "sort_order", label: "Order" },
    ],
    fields: [
      { name: "degree", label: "Programme / degree", type: "text", required: true },
      { name: "school", label: "School", type: "text", required: true },
      { name: "period", label: "Period", type: "text", required: true, placeholder: "2023 - 2026" },
      { name: "details", label: "Details", type: "textarea", rows: 5, required: true },
      {
        name: "sort_order",
        label: "Sort order",
        type: "number",
        help: "Lower numbers appear first.",
      },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    schema: educationSchema,
    publicPath: () => "/experience",
  },

  {
    table: "certifications",
    slug: "certifications",
    label: "Certifications",
    singular: "Certification",
    description: "Certifications listed on the about page, with downloadable certificates.",
    idField: "id",
    listColumns: [
      { field: "name", label: "Name", primary: true },
      { field: "issuer", label: "Issuer" },
      { field: "issued_on", label: "Issued" },
      { field: "sort_order", label: "Order" },
    ],
    fields: [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "CompTIA Security+",
      },
      { name: "issuer", label: "Issuer", type: "text", placeholder: "CompTIA" },
      {
        name: "file_url",
        label: "Certificate URL",
        type: "text",
        required: true,
        placeholder: "/certifications/security-plus.pdf",
        help: "An https:// URL, or a path starting with / for a file in the site's public folder.",
      },
      { name: "issued_on", label: "Issued on", type: "date", help: "Optional. YYYY-MM-DD." },
      {
        name: "sort_order",
        label: "Sort order",
        type: "number",
        help: "Lower numbers appear first.",
      },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    schema: certificationSchema,
    publicPath: () => "/about",
  },

  {
    table: "competitions",
    slug: "competitions",
    label: "Competitions",
    singular: "Competition",
    description:
      "CTFs and cyber competitions, shown on the home page and the experience page. Empty fields are hidden on the site.",
    idField: "id",
    listColumns: [
      { field: "name", label: "Name", primary: true },
      { field: "format", label: "Format" },
      { field: "period", label: "When" },
      { field: "result", label: "Result" },
      { field: "sort_order", label: "Order" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "picoCTF" },
      {
        name: "organizer",
        label: "Organizer",
        type: "text",
        placeholder: "Carnegie Mellon University",
      },
      {
        name: "format",
        label: "Format",
        type: "text",
        required: true,
        placeholder: "Jeopardy-style CTF",
        help: "Short label, e.g. Jeopardy-style CTF, Attack-defense CTF, Cyber defense.",
      },
      {
        name: "period",
        label: "When",
        type: "text",
        placeholder: "2025",
        help: "A year, season or range — shown as written.",
      },
      {
        name: "result",
        label: "Result",
        type: "text",
        placeholder: "Top 10% · 2,450 points",
        help: "Placement, score or award. Leave empty to show participation only.",
      },
      { name: "team", label: "Team", type: "text", placeholder: "Team name, or leave empty" },
      { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
      {
        name: "link",
        label: "Link",
        type: "url",
        placeholder: "https://picoctf.org",
        help: "Competition site or your scoreboard entry. Must start with http:// or https://.",
      },
      {
        name: "sort_order",
        label: "Sort order",
        type: "number",
        help: "Lower numbers appear first.",
      },
      { name: "published", label: "Published", type: "checkbox" },
    ],
    schema: competitionSchema,
    publicPath: () => "/experience",
  },
];

export function getResource(slug: string): ResourceDef | undefined {
  return RESOURCES.find((resource) => resource.slug === slug);
}

export const RESOURCE_SLUGS = RESOURCES.map((resource) => resource.slug);
