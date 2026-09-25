# @repo/ui

React components shared by both apps. Each is a separate export so an app only
bundles what it imports.

| Export                     | Notes                                                |
| -------------------------- | ---------------------------------------------------- |
| `@repo/ui/glitch-text`     | Server component; pure-CSS effect via `data-text`    |
| `@repo/ui/glitch-heading`  | Animated heading variant                             |
| `@repo/ui/magnetic-button` | Pointer-following button; inert under reduced motion |
| `@repo/ui/loader`          | Intro loader, shown once per session                 |
| `@repo/ui/smooth-scroll`   | Lenis wrapper; disabled under reduced motion         |
| `@repo/ui/scroll-progress` | Top progress bar                                     |
| `@repo/ui/intro`           | Intro-sequence state shared by loader and page       |
| `@repo/ui/utils`           | `cn()` — `clsx` + `tailwind-merge`                   |

Styling uses tokens from [`@repo/tailwind-config`](../tailwind-config). Apps
must list this package in `transpilePackages`.
