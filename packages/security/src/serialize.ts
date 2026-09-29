/**
 * JSON for embedding inside an inline <script> element.
 *
 * `JSON.stringify` alone is not safe there: a string containing `</script>`
 * closes the element early (the classic stored-XSS path through JSON-LD), and
 * U+2028 / U+2029 are valid JSON but line terminators to older JS parsers.
 * Escaping `<`, `>` and `&` as \u-sequences keeps the value identical once
 * parsed while making the markup inert.
 */
// Built from char codes: the literal characters are line terminators, so they
// cannot appear inside a regex literal in the source.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

export function jsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEPARATOR, "\\u2028")
    .replace(PARAGRAPH_SEPARATOR, "\\u2029");
}
