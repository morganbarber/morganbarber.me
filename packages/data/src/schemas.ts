import { z } from "zod";

/**
 * Content validation schemas.
 *
 * Deliberately mirror the CHECK constraints in supabase/schema.sql. The database
 * is the real boundary — it is reachable without going through this code — but
 * validating here too means the admin dashboard reports "slug must be
 * lowercase-with-hyphens" in the form instead of surfacing a raw PostgREST 400.
 *
 * When a constraint changes in SQL, change it here as well. The pairs are noted
 * against each field.
 */

/** Matches `blog_posts_slug_format`. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase letters, numbers and single hyphens (e.g. my-first-post)",
  );

/** Matches `projects_id_format`. */
export const projectIdSchema = z
  .string()
  .trim()
  .min(1, "ID is required")
  .max(64)
  .regex(
    /^[a-zA-Z0-9]+(?:[-_][a-zA-Z0-9]+)*$/,
    "ID may contain letters, numbers, hyphens and underscores",
  );

/**
 * Rendered as an `href`, so only absolute http(s) URLs are accepted — the same
 * rule as the `projects_link_scheme` constraint. This is what keeps
 * `javascript:` out of a link, which React does not prevent on its own.
 */
export const externalUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Link must start with http:// or https://",
  );

/** Matches `certifications_url_scheme`: absolute http(s), or a site-relative path. */
export const fileUrlSchema = z
  .string()
  .trim()
  .min(1, "File URL is required")
  .max(2048)
  .refine(
    (value) => /^(https?:\/\/|\/)/i.test(value),
    "Must be an http(s) URL or a path starting with /",
  );

/**
 * HTML form fields arrive as strings, always. These helpers do the coercion in
 * one place so every schema treats an empty input the same way.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.literal("false"), z.boolean(), z.undefined()])
  .transform((value) => value === "on" || value === "true" || value === true);

const sortOrder = z.coerce.number().int().min(0).max(100000).default(0);

// -----------------------------------------------------------------------------

export const blogPostSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  summary: optionalText(1000),
  content: optionalText(200000),
  // Free-form on purpose: the site displays stylised dates like "2026.01.16".
  date: optionalText(64),
  tag: optionalText(64),
  published: checkbox,
  reading_minutes: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(600)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
});

export const projectSchema = z.object({
  id: projectIdSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  category: z.string().trim().min(1, "Category is required").max(100),
  status: z.string().trim().min(1, "Status is required").max(100),
  content: optionalText(200000),
  /**
   * Tags arrive as one comma-separated field. Splitting here keeps the form
   * simple and enforces the 24-tag ceiling from `projects_tags_len`.
   */
  tags: z
    .string()
    .optional()
    .transform((value) =>
      (value ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 24),
    ),
  link: externalUrlSchema.optional().transform((value) => (value ? value : null)),
  published: checkbox,
  sort_order: sortOrder,
});

export const experienceSchema = z.object({
  period: z.string().trim().min(1, "Period is required").max(100),
  role: z.string().trim().min(1, "Role is required").max(200),
  company: z.string().trim().min(1, "Company is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  published: checkbox,
  sort_order: sortOrder,
});

export const educationSchema = z.object({
  degree: z.string().trim().min(1, "Degree is required").max(200),
  period: z.string().trim().min(1, "Period is required").max(100),
  school: z.string().trim().min(1, "School is required").max(200),
  details: z.string().trim().min(1, "Details are required").max(5000),
  published: checkbox,
  sort_order: sortOrder,
});

export const certificationSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  file_url: fileUrlSchema,
  issuer: optionalText(200),
  issued_on: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
    .refine(
      (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
      "Date must be YYYY-MM-DD",
    ),
  published: checkbox,
  sort_order: sortOrder,
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type EducationInput = z.infer<typeof educationSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;

/** Every table the admin dashboard can edit. */
export const EDITABLE_TABLES = [
  "blog_posts",
  "projects",
  "experience",
  "education",
  "certifications",
] as const;

export type EditableTable = (typeof EDITABLE_TABLES)[number];

export const TABLE_SCHEMAS = {
  blog_posts: blogPostSchema,
  projects: projectSchema,
  experience: experienceSchema,
  education: educationSchema,
  certifications: certificationSchema,
} as const;

/**
 * Turns a FormData into a plain object.
 *
 * Unchecked checkboxes are absent from FormData entirely rather than present
 * as "false", which is why `checkbox` above treats `undefined` as false — a
 * subtlety that otherwise makes "unpublish" silently impossible.
 */
export function formDataToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

/** Flattens Zod issues into the `{ field: message }` shape the forms render. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !out[field]) {
      out[field] = issue.message;
    }
  }
  return out;
}
