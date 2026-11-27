"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { CustomEase } from "gsap/CustomEase";

/**
 * The one place GSAP plugins are registered. Every client module imports gsap
 * from here rather than from "gsap" directly, so a plugin can never be used
 * before it is registered — whichever module loads first does the work, and
 * registerPlugin is idempotent.
 *
 * Only what the site uses on every page is registered here. Flip is loaded on
 * demand by the projects filter (components/project-list.tsx), the one place
 * it is needed, so it stays out of the shared bundle.
 *
 * All of these ship in the public `gsap` package (free since 3.13); there is
 * no private registry or token involved.
 */
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  ScrollToPlugin,
  CustomEase,
);

/** The site's signature ease: a fast start that settles long and soft. */
CustomEase.create("mb.out", "0.16, 1, 0.3, 1");
/** For covers and wipes: symmetrical, decisive. */
CustomEase.create("mb.inOut", "0.76, 0, 0.24, 1");

gsap.defaults({ ease: "mb.out", duration: 0.9 });

// Lenis drives the scroll; this keeps ScrollTrigger from double-correcting on
// mobile address-bar resizes, which otherwise causes a visible jump.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin, ScrollToPlugin };
