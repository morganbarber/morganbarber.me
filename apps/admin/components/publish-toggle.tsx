import { Eye, EyeOff } from "lucide-react";
import { togglePublished } from "@/actions/content";

/**
 * Inline publish/unpublish control.
 *
 * A form posting to a Server Action rather than a click handler, so it needs no
 * client JavaScript and still works if hydration has not finished — the state
 * change is the whole point of the control, and it should not depend on a
 * bundle having loaded.
 */
export default function PublishToggle({
  slug,
  id,
  published,
}: {
  slug: string;
  id: string;
  published: boolean;
}) {
  const action = togglePublished.bind(null, slug, id, !published);

  return (
    <form action={action}>
      <button
        type="submit"
        title={published ? "Published — click to unpublish" : "Draft — click to publish"}
        className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition-colors ${
          published
            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
            : "border-border bg-muted text-muted-foreground hover:text-foreground"
        }`}
      >
        {published ? (
          <Eye className="h-3 w-3" aria-hidden="true" />
        ) : (
          <EyeOff className="h-3 w-3" aria-hidden="true" />
        )}
        {published ? "Live" : "Draft"}
      </button>
    </form>
  );
}
