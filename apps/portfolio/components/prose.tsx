/**
 * Renders stored long-form text as paragraphs.
 *
 * Intentionally NOT a Markdown or HTML renderer. Content arrives from the
 * database, and the moment it is passed through `dangerouslySetInnerHTML` or a
 * Markdown pipeline with raw-HTML enabled, a compromised or mistyped row
 * becomes stored XSS. Splitting on blank lines and letting React escape each
 * paragraph gives readable output with no injection surface at all.
 *
 * If rich formatting is wanted later, the safe upgrade is a Markdown parser
 * with raw HTML disabled plus a sanitiser — not a change to this component.
 */
export default function Prose({ content }: { content: string | null }) {
  const paragraphs = (content ?? "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground border-l-2 border-muted pl-4">
        {"// No content published yet."}
      </p>
    );
  }

  return (
    <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
      {paragraphs.map((paragraph, index) => (
        // Paragraph order is stable for a given document, so the index is a
        // legitimate key here — this list is never reordered or filtered.
        <p key={index} className="whitespace-pre-line">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
