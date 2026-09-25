#!/usr/bin/env node
/**
 * On-page SEO audit against a running build.
 *
 * Audits every URL in the site's own sitemap — so new posts and projects are
 * covered automatically — and checks what a crawler actually receives in the
 * server HTML: title and description length and uniqueness, canonical and
 * og:url, the complete Open Graph / Twitter set, per-route social images,
 * exactly one <h1>, parseable JSON-LD with the site graph and breadcrumbs,
 * plus the crawlable assets (images, icons, manifest, sitemap, robots, feed).
 *
 * Usage:
 *   npm run check:seo                                   # http://localhost:3000
 *   npm run check:seo -- https://morganbarber.me
 *
 * Exits non-zero on any problem, so it can gate a deploy.
 */

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const SITE = process.env.SEO_CANONICAL_ORIGIN ?? "https://morganbarber.me";

// Every page the site tells search engines about, fetched from this server.
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
const PAGES = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
  const path = m[1].replace(SITE, "");
  return path === "" ? "/" : path;
});
if (PAGES.length === 0) {
  console.error(`No URLs found in ${BASE}/sitemap.xml`);
  process.exit(1);
}

const attr = (html, re) => html.match(re)?.[1] ?? null;
const meta = (html, key) =>
  attr(html, new RegExp(`<meta[^>]+(?:name|property)="${key}"[^>]+content="([^"]*)"`)) ??
  attr(html, new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${key}"`));
const decode = (s) =>
  s
    ?.replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

let failures = 0;
const titles = new Map();
const descriptions = new Map();

for (const path of PAGES) {
  const res = await fetch(BASE + path);
  const html = await res.text();
  const problems = [];

  const title = decode(attr(html, /<title>([^<]*)<\/title>/));
  const desc = decode(meta(html, "description"));
  const canonical = attr(html, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
  const og = {
    title: meta(html, "og:title"),
    desc: meta(html, "og:description"),
    url: meta(html, "og:url"),
    site: meta(html, "og:site_name"),
    type: meta(html, "og:type"),
    image: meta(html, "og:image"),
    w: meta(html, "og:image:width"),
    h: meta(html, "og:image:height"),
  };
  const tw = { card: meta(html, "twitter:card"), image: meta(html, "twitter:image") };
  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  const robots = meta(html, "robots");

  const ld = [
    ...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g),
  ].map((m) => m[1]);
  const types = [];
  for (const block of ld) {
    try {
      const data = JSON.parse(block);
      for (const node of data["@graph"] ?? [data]) types.push(node["@type"]);
    } catch {
      problems.push("JSON-LD does not parse");
    }
  }

  if (res.status !== 200) problems.push(`HTTP ${res.status}`);
  if (!title) problems.push("no <title>");
  else if (title.length > 65) problems.push(`title ${title.length} chars (>65)`);
  if (title && /Morgan Barber.*Morgan Barber/.test(title))
    problems.push("name duplicated in title");
  if (!desc) problems.push("no meta description");
  else if (desc.length > 160 || desc.length < 70) problems.push(`description ${desc.length} chars`);
  const expected = path === "/" ? SITE : `${SITE}${path}`;
  if (canonical !== expected) problems.push(`canonical ${canonical}`);
  if (og.url !== expected) problems.push(`og:url ${og.url}`);
  for (const k of ["title", "desc", "site", "type", "image"])
    if (!og[k]) problems.push(`missing og:${k}`);
  if (og.w !== "1200" || og.h !== "630") problems.push(`og:image size ${og.w}x${og.h}`);
  if (tw.card !== "summary_large_image") problems.push("twitter:card");
  if (/^\/(blog|projects)\/[^/]+$/.test(path) && !og.image?.includes(`${path}/opengraph-image`)) {
    problems.push(`detail page uses a generic image: ${og.image}`);
  }
  if (!tw.image) problems.push("missing twitter:image");
  if (h1s !== 1) problems.push(`${h1s} <h1>`);
  if (robots && /noindex/.test(robots)) problems.push("noindex!");
  if (!types.includes("Person") || !types.includes("WebSite")) problems.push("site graph missing");
  if (path.split("/").length > 2 && !types.includes("BreadcrumbList"))
    problems.push("no BreadcrumbList");

  if (titles.has(title)) problems.push(`duplicate title with ${titles.get(title)}`);
  if (descriptions.has(desc)) problems.push(`duplicate description with ${descriptions.get(desc)}`);
  titles.set(title, path);
  descriptions.set(desc, path);

  failures += problems.length;
  console.log(`\n${problems.length ? "FAIL" : "PASS"}  ${path}`);
  console.log(`      title (${title?.length}): ${title}`);
  console.log(`      desc  (${desc?.length}): ${desc?.slice(0, 90)}…`);
  console.log(
    `      og:image: ${og.image?.replace(SITE, "")}   ld: ${[...new Set(types)].join(", ")}`,
  );
  for (const p of problems) console.log(`      ✗ ${p}`);
}

// Assets a crawler fetches.
console.log("\n--- crawlable assets ---");
const check = async (path, type, extra) => {
  const r = await fetch(BASE + path);
  const ct = r.headers.get("content-type") ?? "";
  const ok = r.status === 200 && ct.includes(type);
  const body = Buffer.from(await r.arrayBuffer());
  let note = `${ct.split(";")[0]} ${body.length}B`;
  if (type === "image/png" && body.length > 24)
    note += ` ${body.readUInt32BE(16)}x${body.readUInt32BE(20)}`;
  const extraOk = extra ? extra(body.toString("utf8")) : true;
  if (!ok || extraOk !== true) failures++;
  console.log(
    `  ${ok && extraOk === true ? "PASS" : "FAIL"}  ${path.padEnd(42)} ${note}${extraOk === true ? "" : "  ✗ " + extraOk}`,
  );
};
await check("/opengraph-image", "image/png");
for (const detail of PAGES.filter((p) => /^\/(blog|projects)\/[^/]+$/.test(p)).slice(0, 2)) {
  await check(`${detail}/opengraph-image`, "image/png");
}
await check("/icon.svg", "image/svg+xml");
await check("/apple-icon", "image/png");
await check("/manifest.webmanifest", "manifest+json");
await check("/sitemap.xml", "xml", (x) => {
  const urls = (x.match(/<loc>/g) ?? []).length;
  if (urls < 6) return `only ${urls} urls`;
  // Only content-backed entries (posts, projects) carry a real modification
  // date; pages whose content lives in code deliberately omit it. A build with
  // no database (CI) has no such entries, so there is nothing to require.
  const content = [...x.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((m) => m[1])
    .filter((entry) => /<loc>[^<]*\/(blog|projects)\/[^/<]+<\/loc>/.test(entry));
  const undated = content.filter((entry) => !entry.includes("<lastmod>")).length;
  return undated === 0 ? true : `${undated} content urls without lastmod`;
});
await check("/robots.txt", "text/plain", (x) =>
  x.includes(`Sitemap: ${SITE}/sitemap.xml`) ? true : "no sitemap line",
);
await check("/blog/feed.xml", "rss+xml", (x) =>
  x.includes("<channel>") && x.includes('rel="self"') ? true : "invalid feed",
);
await check("/llms.txt", "text/markdown", (x) =>
  x.startsWith("# Morgan Barber") ? true : "bad header",
);
{
  const r = await fetch(BASE + "/favicon.ico", { redirect: "manual" });
  const ok = r.status === 308 && r.headers.get("location")?.endsWith("/icon.svg");
  if (!ok) failures++;
  console.log(
    `  ${ok ? "PASS" : "FAIL"}  /favicon.ico                               ${r.status} -> ${r.headers.get("location")}`,
  );
}

console.log(failures ? `\n${failures} problem(s)` : "\nall SEO checks passed");
process.exit(failures ? 1 : 0);
