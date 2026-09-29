# @repo/tailwind-config

Design tokens and base styles for Tailwind v4 (CSS-first config).

```css
@import "tailwindcss";
@import "@repo/tailwind-config/tokens.css"; /* palette + @theme mappings */
@import "@repo/tailwind-config/base.css"; /* focus, selection, reduced motion */
@source "../../packages/ui/src";
```

Override a token after the import, e.g. the admin app sets
`:root { --background: #0a0a0a; }`.

## Named utilities

`components.css` defines the utilities both apps share — `shell` (page-width
container) and `kicker` (small mono caption) — as Tailwind v4 `@utility`s, so
they take variants and can be overridden by a more specific class. Each app
adds its own in `globals.css` (the portfolio's square `btn`, the admin's
rounded `btn`, `card`, `alert`, `field`). Reach for one when the same set of
classes appears in more than one place; keep one-off styling inline.
