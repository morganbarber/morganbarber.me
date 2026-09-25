# Fonts for generated images

`Oswald-Bold.woff` — Oswald 700, by Vernon Adams and contributors, licensed
under the SIL Open Font License 1.1 (redistribution permitted). Source: Google
Fonts.

Used only by `lib/og.tsx` to render social preview images in the site's
heading typeface. The image renderer (satori) reads TTF/OTF/WOFF but not WOFF2,
and cannot use the `next/font` build output, so the file is vendored here.
