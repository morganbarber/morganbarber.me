import type { Database, Json } from "./database";

export type { Database, Json };

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Functions<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T];

/**
 * Domain types are derived from the database rather than declared separately.
 *
 * The previous hand-written `Project`/`Experience`/`Education` interfaces had
 * already drifted from the real tables (no `created_at`, `link` non-nullable
 * when the column is nullable), which is the failure mode this avoids: a schema
 * change now surfaces as a type error instead of a runtime surprise.
 */
export type BlogPost = Tables<"blog_posts">;
export type Project = Tables<"projects">;
export type Experience = Tables<"experience">;
export type Education = Tables<"education">;
export type Certification = Tables<"certifications">;
export type Analytics = Tables<"analytics">;
export type ContactMessage = Tables<"contact_messages">;

/**
 * List-view projections.
 *
 * Index pages never render `content`, and a blog post's body can be 200 KB.
 * Selecting only these columns keeps the RSC payload small — which is the
 * single biggest lever on time-to-interactive for a content site.
 */
export type BlogPostSummary = Pick<
  BlogPost,
  "id" | "slug" | "title" | "summary" | "date" | "tag" | "reading_minutes" | "created_at"
>;

export type ProjectSummary = Pick<
  Project,
  | "id"
  | "title"
  | "description"
  | "category"
  | "status"
  | "tags"
  | "link"
  | "sort_order"
  | "created_at"
>;

export type ExperienceSummary = Pick<
  Experience,
  "id" | "period" | "role" | "company" | "description" | "sort_order"
>;

export type EducationSummary = Pick<
  Education,
  "id" | "degree" | "period" | "school" | "details" | "sort_order"
>;

export type CertificationSummary = Pick<
  Certification,
  "id" | "name" | "file_url" | "issuer" | "issued_on" | "sort_order" | "created_at"
>;

export interface SocialLink {
  name: string;
  url: string;
}
