import { headers } from "next/headers";

/**
 * Renders a JSON-LD document.
 *
 * Reads the per-request CSP nonce itself so pages can drop it in without
 * threading the nonce through props — under `strict-dynamic`, an inline script
 * block without it is blocked, JSON-LD included.
 *
 * `<` is escaped so that a string containing `</script>` (a blog title, say)
 * cannot close the block early. The data comes from the database, so this is
 * not hypothetical: it is the difference between structured data and stored XSS.
 */
export default async function StructuredData({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    // U+2028/U+2029 are valid in JSON but end a line in older JS parsers.
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // eslint-disable-next-line react/no-danger -- JSON-LD has no JSX form; escaped above
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
