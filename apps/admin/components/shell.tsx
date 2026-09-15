import Link from "next/link";
import { LogOut, ExternalLink } from "lucide-react";
import { logout } from "@/actions/auth";
import { RESOURCES } from "@/lib/resources";

/**
 * Authenticated page chrome: sidebar navigation, header, content area.
 *
 * A server component — nothing here needs interactivity beyond the logout form,
 * which is a plain Server Action, so the whole shell ships zero JavaScript.
 */

export default function Shell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const portfolioUrl = process.env.PORTFOLIO_URL ?? "http://localhost:3000";

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-border bg-surface flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/" className="font-bold tracking-tight hover:text-primary transition-colors">
            morganbarber.me
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Content admin</p>
        </div>

        <nav aria-label="Sections" className="flex-1 p-3 space-y-6 overflow-y-auto">
          <NavGroup label="Overview">
            <NavLink href="/">Dashboard</NavLink>
          </NavGroup>

          <NavGroup label="Content">
            {RESOURCES.map((resource) => (
              <NavLink key={resource.slug} href={`/content/${resource.slug}`}>
                {resource.label}
              </NavLink>
            ))}
          </NavGroup>

          <NavGroup label="Inbound">
            <NavLink href="/messages">Messages</NavLink>
            <NavLink href="/analytics">Analytics</NavLink>
          </NavGroup>
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <a
            href={portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View site
          </a>

          <form action={logout}>
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-muted-foreground hover:text-danger hover:bg-muted transition-colors text-left"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-border px-8 py-6 flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {description ? (
              <p className="text-muted-foreground mt-1 max-w-2xl">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-3 shrink-0">{actions}</div> : null}
        </header>

        <main className="flex-1 p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-0.5 list-none m-0 p-0">{children}</ul>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="block px-3 py-2 rounded hover:bg-muted hover:text-primary transition-colors"
      >
        {children}
      </Link>
    </li>
  );
}
