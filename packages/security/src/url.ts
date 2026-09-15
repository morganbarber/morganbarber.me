/**
 * URL safety helpers.
 *
 * Any value that becomes an `href` is checked here first. The attack this
 * closes is `javascript:alert(1)` (and the `data:`/`vbscript:` variants) stored
 * in a content row and rendered as a link — React escapes text but does not
 * validate URL schemes, so `<a href={row.link}>` will happily execute it.
 *
 * Shared by server and client components, so no runtime-specific APIs.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** True when `value` is an absolute URL with a scheme that cannot execute. */
export function isSafeExternalUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    return SAFE_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * True when `value` is a site-relative path.
 *
 * `//evil.example` is rejected: browsers treat a protocol-relative URL as
 * absolute, so it would navigate off-site while looking like a local path.
 */
export function isSafeInternalPath(value: string | null | undefined): value is string {
  return Boolean(value) && value!.startsWith("/") && !value!.startsWith("//");
}

/**
 * Narrows an arbitrary stored value to something safe to put in an `href`,
 * allowing both absolute URLs and site-relative paths. Returns null when
 * neither applies, so the caller can omit the link entirely.
 */
export function safeHref(value: string | null | undefined): string | null {
  if (isSafeInternalPath(value)) return value;
  if (isSafeExternalUrl(value)) return value;
  return null;
}
