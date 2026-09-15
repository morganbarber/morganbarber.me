import { KeyRound } from "lucide-react";

/**
 * Shown when the service-role key is missing.
 *
 * Without it the dashboard can read nothing and write nothing, and every query
 * would otherwise fail with the same message repeated in five error cards. One
 * clear setup screen with the actual steps is more useful than a page of
 * identical errors.
 */
export default function SetupRequired() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded border border-border bg-surface p-8">
        <div className="flex items-center gap-3 mb-5">
          <KeyRound className="h-5 w-5 text-primary" aria-hidden="true" />
          <h1 className="text-lg font-bold">One more setting</h1>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          The dashboard needs Supabase&apos;s <strong className="text-foreground">service-role</strong>{" "}
          key. The publishable key the public site uses is deliberately barred
          from writing content or reading analytics, so it cannot drive an admin
          tool.
        </p>

        <ol className="mt-5 space-y-3 text-muted-foreground list-none p-0">
          <Step n={1}>
            Supabase dashboard → <strong className="text-foreground">Project Settings → API Keys</strong> →
            copy the <code className="text-foreground">service_role</code> / secret key.
          </Step>
          <Step n={2}>
            Paste it into <code className="text-foreground">apps/admin/.env.local</code> as{" "}
            <code className="text-foreground">SUPABASE_SERVICE_ROLE_KEY</code>.
          </Step>
          <Step n={3}>Restart the dev server.</Step>
        </ol>

        <p className="mt-6 pt-5 border-t border-border text-xs text-muted-foreground leading-relaxed">
          That key bypasses every row-level security policy, which is why it has
          no <code>NEXT_PUBLIC_</code> prefix and never reaches the browser. This
          app refuses to start on a hosting platform and only accepts requests
          from localhost.
        </p>
      </div>
    </main>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-bold">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
