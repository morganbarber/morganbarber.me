import Link from "next/link";

/**
 * Visible breadcrumb trail.
 *
 * Pairs with the BreadcrumbList structured data on the same page. Google
 * expects the two to match: markup describing navigation the user cannot see
 * is treated as spam rather than earning the breadcrumb display in results.
 * It also gives every detail page links back up its hierarchy, which is how
 * link equity flows from deep pages to the sections above them.
 */
export interface Crumb {
  name: string;
  /** Omit for the current page, which is not a link. */
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-8 font-mono text-xs uppercase tracking-widest">
      <ol className="flex flex-wrap items-center gap-2 list-none m-0 p-0 text-muted-foreground">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.name} className="flex items-center gap-2 min-w-0">
              {item.href && !last ? (
                <Link href={item.href} className="hover:text-primary transition-colors">
                  {item.name}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className="text-foreground truncate max-w-[60vw]"
                >
                  {item.name}
                </span>
              )}
              {!last ? (
                <span aria-hidden="true" className="text-primary">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
