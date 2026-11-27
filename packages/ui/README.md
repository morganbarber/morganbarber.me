# @repo/ui

Small helpers shared by both apps. Each is a separate export so an app only
bundles what it imports.

| Export           | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| `@repo/ui/intro` | Intro-sequence storage key shared by the layout and loader |
| `@repo/ui/utils` | `cn()` — `clsx` + `tailwind-merge`                         |

The portfolio's animated components (GSAP) live in
`apps/portfolio/components/motion`, because nothing else uses them.

Styling uses tokens from [`@repo/tailwind-config`](../tailwind-config). Apps
must list this package in `transpilePackages`.
