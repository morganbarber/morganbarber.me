/**
 * Database types for the morganbarber.me Supabase project.
 *
 * Kept in sync by hand with apps/portfolio/supabase/schema.sql. To regenerate
 * from a live project instead:
 *
 *   npx supabase gen types typescript --project-id <ref> > packages/types/src/database.ts
 *
 * The `Insert`/`Update` shapes intentionally mirror the real column nullability
 * and defaults, so a missing NOT NULL column is a compile error rather than a
 * runtime 400 from PostgREST.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      blog_posts: {
        Row: {
          id: number;
          slug: string;
          title: string;
          summary: string | null;
          content: string | null;
          date: string | null;
          tag: string | null;
          published: boolean;
          reading_minutes: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          slug: string;
          title: string;
          summary?: string | null;
          content?: string | null;
          date?: string | null;
          tag?: string | null;
          published?: boolean;
          reading_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          title?: string;
          summary?: string | null;
          content?: string | null;
          date?: string | null;
          tag?: string | null;
          published?: boolean;
          reading_minutes?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      projects: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          status: string;
          content: string | null;
          tags: string[];
          link: string | null;
          published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          category: string;
          status: string;
          content?: string | null;
          tags?: string[];
          link?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          status?: string;
          content?: string | null;
          tags?: string[];
          link?: string | null;
          published?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      experience: {
        Row: {
          id: number;
          period: string;
          role: string;
          company: string;
          description: string;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          period: string;
          role: string;
          company: string;
          description: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          period?: string;
          role?: string;
          company?: string;
          description?: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      education: {
        Row: {
          id: number;
          degree: string;
          period: string;
          school: string;
          details: string;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          degree: string;
          period: string;
          school: string;
          details: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          degree?: string;
          period?: string;
          school?: string;
          details?: string;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      certifications: {
        Row: {
          id: number;
          name: string;
          file_url: string;
          issuer: string | null;
          issued_on: string | null;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          file_url: string;
          issuer?: string | null;
          issued_on?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          file_url?: string;
          issuer?: string | null;
          issued_on?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      /** CTFs and cyber competitions (migrations/0003_competitions.sql). */
      competitions: {
        Row: {
          id: number;
          name: string;
          organizer: string | null;
          format: string;
          period: string | null;
          result: string | null;
          team: string | null;
          description: string;
          link: string | null;
          sort_order: number;
          published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          organizer?: string | null;
          format: string;
          period?: string | null;
          result?: string | null;
          team?: string | null;
          description: string;
          link?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          organizer?: string | null;
          format?: string;
          period?: string | null;
          result?: string | null;
          team?: string | null;
          description?: string;
          link?: string | null;
          sort_order?: number;
          published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      /**
       * Not readable or writable with the anon key: RLS has no policy for it and
       * no grants are issued. Writes go through the `track_event` function.
       * Typed here for the service-role tooling that reports on it.
       */
      analytics: {
        Row: {
          id: number;
          path: string;
          event_name: string;
          session_id: string | null;
          referrer_host: string | null;
          language: string | null;
          screen_resolution: string | null;
          device_type: string | null;
          os: string | null;
          browser: string | null;
          geo_country: string | null;
          geo_region: string | null;
          geo_city: string | null;
          visitor_hash: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          path: string;
          event_name?: string;
          session_id?: string | null;
          referrer_host?: string | null;
          language?: string | null;
          screen_resolution?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
          geo_country?: string | null;
          geo_region?: string | null;
          geo_city?: string | null;
          visitor_hash?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };

      /** Same access model as `analytics`; written via `submit_contact_message`. */
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          message: string;
          referrer_host: string | null;
          visitor_hash: string | null;
          status: "new" | "read" | "archived" | "spam";
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          message: string;
          referrer_host?: string | null;
          visitor_hash?: string | null;
          status?: "new" | "read" | "archived" | "spam";
          created_at?: string;
        };
        Update: {
          status?: "new" | "read" | "archived" | "spam";
        };
        Relationships: [];
      };

      rate_limit_buckets: {
        Row: {
          bucket_key: string;
          tokens: number;
          window_start: string;
          updated_at: string;
        };
        Insert: {
          bucket_key: string;
          tokens: number;
          window_start?: string;
          updated_at?: string;
        };
        Update: {
          tokens?: number;
          window_start?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };

    Views: Record<never, never>;

    Functions: {
      /** Records one analytics event. Validates and clamps every argument. */
      track_event: {
        Args: {
          p_path: string;
          p_event_name?: string;
          p_session_id?: string | null;
          p_referrer_host?: string | null;
          p_language?: string | null;
          p_screen_resolution?: string | null;
          p_device_type?: string | null;
          p_os?: string | null;
          p_browser?: string | null;
          p_geo_country?: string | null;
          p_geo_region?: string | null;
          p_geo_city?: string | null;
          p_visitor_hash?: string | null;
          p_metadata?: Json;
        };
        Returns: undefined;
      };

      /** Returns 'ok' | 'invalid' | 'rate_limited'. Never throws on bad input. */
      submit_contact_message: {
        Args: {
          p_name: string;
          p_message: string;
          p_email?: string | null;
          p_referrer_host?: string | null;
          p_visitor_hash?: string | null;
        };
        Returns: string;
      };

      health_check: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };

    Enums: Record<never, never>;

    CompositeTypes: Record<never, never>;
  };
}
