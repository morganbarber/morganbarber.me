import { headers } from "next/headers";
import { jsonForScript } from "@repo/security/serialize";

/**
 * Renders a JSON-LD document.
 *
 * Reads the per-request CSP nonce itself so pages can drop it in without
 * threading the nonce through props — under `strict-dynamic`, an inline script
 * block without it is blocked, JSON-LD included.
 *
 * Serialised with `jsonForScript`, so a string containing `</script>` (a blog
 * title, say) cannot close the block early. The data comes from the database,
 * so this is not hypothetical: it is the difference between structured data
 * and stored XSS.
 */
export default async function StructuredData({ data }: { data: Record<string, unknown> }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const json = jsonForScript(data);

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      // eslint-disable-next-line react/no-danger -- JSON-LD has no JSX form; jsonForScript escapes it
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
