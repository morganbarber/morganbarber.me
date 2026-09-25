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
