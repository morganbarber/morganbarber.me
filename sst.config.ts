/// <reference path="./.sst/platform/config.d.ts" />

/**
 * SST deployment for morganbarber.me → Vercel.
 *
 * Deploys the PUBLIC SITE ONLY. `apps/admin` holds the Supabase service-role
 * key and must never reach a hosting platform; it is excluded here, in
 * `.vercelignore`, and by `assertAdminRuntime()` at runtime. Three layers,
 * because the consequence of getting it wrong is handing over full database
 * control.
 *
 * State lives locally (`home: "local"`), so this needs no AWS account — the
 * only cloud credential required is a Vercel API token.
 *
 * ---
 *
 * SETUP
 *
 *   npm install
 *   npx sst install                       # downloads the Vercel provider
 *
 *   export VERCEL_API_TOKEN=...           # vercel.com/account/tokens
 *   export VERCEL_TEAM=...                # optional, team slug or ID
 *
 *   cp .env.sst.example .env.sst          # fill in the values below
 *
 *   npx sst deploy --stage production
 *
 * Every value in `.env.sst` is read at deploy time and pushed to Vercel as a
 * project environment variable. Nothing is hardcoded here.
 */

// ---------------------------------------------------------------------------
// Configuration read from the deploy environment
// ---------------------------------------------------------------------------

/**
 * Reads a required variable, failing with an actionable message rather than
 * deploying a half-configured site. A missing Supabase URL would otherwise
 * become the literal string "undefined" in the production bundle.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set.\n\n` +
        `Copy .env.sst.example to .env.sst and fill it in, then re-run the deploy.\n` +
        `SST loads .env and .env.<stage> automatically; anything already exported wins.`,
    );
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export default $config({
  app(input) {
    return {
      name: "morganbarber-portfolio",

      /**
       * Local state. The alternative (`"aws"`) would require an AWS account
       * purely to hold a state file for a Vercel deployment.
       *
       * Consequence: `.sst/` holds the state, so it must be backed up, and
       * `sst.Secret` is unavailable (it stores secrets in S3). Secrets come
       * from the deploy environment instead — see `required()` above.
       */
      home: "local",

      /**
       * Production cannot be torn down by an accidental `sst remove`, and its
       * resources are retained rather than deleted.
       */
      protect: input?.stage === "production",
      removal: input?.stage === "production" ? "retain" : "remove",

      providers: {
        "@pulumiverse/vercel": {
          version: "5.4.1",
          // apiToken and team are read from VERCEL_API_TOKEN / VERCEL_TEAM.
          // Never put them here — this file is committed.
        },
      },
    };
  },

  async run() {
    const isProduction = $app.stage === "production";

    const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
    const siteUrl = required("NEXT_PUBLIC_SITE_URL");
    const analyticsSalt = optional("ANALYTICS_SALT");
    const revalidateSecret = optional("REVALIDATE_SECRET");
    const htbToken = optional("HTB_APP_TOKEN");

    /**
     * A secret key in the publishable slot would be compiled into the
     * JavaScript every visitor downloads. `@repo/config/env` rejects this at
     * runtime too, but catching it here stops the bad build ever being made.
     */
    if (supabaseKey.startsWith("sb_secret_") || supabaseKey.includes("service_role")) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY looks like a secret key.\n" +
          "NEXT_PUBLIC_* values are embedded in the client bundle. Use the publishable key.",
      );
    }

    if (isProduction && !analyticsSalt) {
      throw new Error(
        "ANALYTICS_SALT must be set for a production deploy.\n" +
          "Without it visitor hashing is disabled and per-visitor rate limiting is off.\n" +
          "Generate one with: openssl rand -base64 48",
      );
    }

    // -----------------------------------------------------------------------
    // Project
    // -----------------------------------------------------------------------

    const project = new vercel.Project("Portfolio", {
      name: isProduction ? "morganbarber-portfolio" : `morganbarber-portfolio-${$app.stage}`,
      framework: "nextjs",

      /**
       * Monorepo layout.
       *
       * `installCommand` is deliberately NOT set. Vercel detects the npm
       * workspace from the root lockfile and installs from there; overriding it
       * with a path-relative command is the documented way to break a monorepo
       * build, because the working directory differs between the install and
       * build phases.
       *
       * The build command is the form Vercel documents for Turborepo. The
       * filter is what keeps `apps/admin` out of the build graph entirely —
       * verified with `turbo run build --filter=portfolio-web --dry=json`.
       */
      rootDirectory: "apps/portfolio",
      buildCommand: "cd ../.. && npx turbo run build --filter=portfolio-web",

      // Pages render dynamically (nonce CSP), so put the functions near the
      // database rather than near the user — the round trip to Supabase
      // dominates. iad1 matches Supabase's default us-east-1.
      serverlessFunctionRegion: optional("VERCEL_FUNCTION_REGION") ?? "iad1",

      nodeVersion: "22.x",

      // --- security posture ---

      /**
       * A pull request from a fork must not be able to trigger a build that has
       * access to this project's environment variables.
       */
      gitForkProtection: true,

      /**
       * Source maps are generated for the build but not served publicly.
       * `productionBrowserSourceMaps` is already false in next.config.ts; this
       * closes the same hole at the platform level.
       */
      protectedSourcemaps: true,

      /**
       * Preview deployments sit behind Vercel SSO. A preview is a full copy of
       * the site — same database, same secrets — on a guessable URL, and left
       * open it is both an information leak and an unindexed duplicate of the
       * production site. Production itself stays public.
       */
      vercelAuthentication: { deploymentType: "standard_protection" },

      /*
        Serves a stale-client error instead of silently mismatching a new
        deployment's Server Actions against an old client bundle. That matters
        here because the contact form is a Server Action.

        Known trade-off, documented by Vercel: skew protection sets a
        per-deployment environment variable, which makes every Turborepo build
        a cache miss. Correctness over build speed for a site this size.
      */
      skewProtection: "12 hours",

      // Exposes VERCEL_ENV / VERCEL_URL to the build, which the proxy uses to
      // mark non-production deployments noindex.
      automaticallyExposeSystemEnvironmentVariables: true,
    });

    // -----------------------------------------------------------------------
    // Environment variables
    // -----------------------------------------------------------------------

    const targets = ["production", "preview"];

    /** Declares one Vercel project environment variable. */
    function env(
      name: string,
      key: string,
      value: string,
      { sensitive, comment }: { sensitive: boolean; comment: string },
    ) {
      return new vercel.ProjectEnvironmentVariable(name, {
        projectId: project.id,
        key,
        value,
        targets,
        // `sensitive` makes the value unreadable through the dashboard and API
        // once written. Only meaningful for real secrets — the publishable
        // values are public by design and stay readable so they can be checked.
        sensitive,
        comment,
      });
    }

    env("SupabaseUrl", "NEXT_PUBLIC_SUPABASE_URL", supabaseUrl, {
      sensitive: false,
      comment: "Supabase project URL. Public by design.",
    });

    env("SupabaseKey", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", supabaseKey, {
      sensitive: false,
      comment: "Supabase publishable key. Public by design; all authority lives in RLS policies.",
    });

    env("SiteUrl", "NEXT_PUBLIC_SITE_URL", siteUrl, {
      sensitive: false,
      comment: "Canonical origin, used for metadata, sitemap and the CSRF origin check.",
    });

    if (analyticsSalt) {
      env("AnalyticsSalt", "ANALYTICS_SALT", analyticsSalt, {
        sensitive: true,
        comment: "Salts the SHA-256 of visitor IPs. Rotating it resets unique-visitor attribution.",
      });
    }

    if (htbToken) {
      env("HtbAppToken", "HTB_APP_TOKEN", htbToken, {
        sensitive: true,
        comment: "HackTheBox App Token for live profile stats. Credential for the HTB account.",
      });
    }

    if (revalidateSecret) {
      env("RevalidateSecret", "REVALIDATE_SECRET", revalidateSecret, {
        sensitive: true,
        comment: "Shared secret for POST /api/revalidate. Must match the admin dashboard.",
      });
    }

    // -----------------------------------------------------------------------
    // Deployment
    // -----------------------------------------------------------------------

    /**
     * Uploads the repository and builds it on Vercel.
     *
     * `.vercelignore` is what keeps `apps/admin`, every `.env*` file and the
     * local SST state out of the upload — it is not optional, and the deploy
     * should be treated as broken if it goes missing.
     */
    const files = vercel.getProjectDirectoryOutput({ path: process.cwd() });

    const deployment = new vercel.Deployment("PortfolioDeployment", {
      projectId: project.id,
      files: files.files,
      pathPrefix: process.cwd(),
      production: isProduction,

      // Mirrors the project settings so a deployment cannot drift from them.
      // installCommand is omitted here for the same reason as above.
      projectSettings: {
        framework: "nextjs",
        rootDirectory: "apps/portfolio",
        buildCommand: "cd ../.. && npx turbo run build --filter=portfolio-web",
      },

      // Non-production deployments are cleaned up with the stage.
      deleteOnDestroy: !isProduction,
    });

    // -----------------------------------------------------------------------
    // Custom domain (production only)
    // -----------------------------------------------------------------------

    const customDomain = optional("VERCEL_DOMAIN");

    if (isProduction && customDomain) {
      new vercel.ProjectDomain("PortfolioDomain", {
        projectId: project.id,
        domain: customDomain,
      });

      // Redirect the apex/www counterpart so the site has one canonical host.
      const redirectFrom = customDomain.startsWith("www.")
        ? customDomain.slice(4)
        : `www.${customDomain}`;

      new vercel.ProjectDomain("PortfolioDomainRedirect", {
        projectId: project.id,
        domain: redirectFrom,
        redirect: customDomain,
        redirectStatusCode: 308,
      });
    }

    return {
      projectId: project.id,
      url: $interpolate`https://${deployment.url}`,
      site: customDomain ? `https://${customDomain}` : siteUrl,
      stage: $app.stage,
      note: "Public site only — apps/admin is excluded and must never be deployed.",
    };
  },
});
