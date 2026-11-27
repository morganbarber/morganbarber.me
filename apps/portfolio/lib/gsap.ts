"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { Flip } from "gsap/Flip";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { CustomEase } from "gsap/CustomEase";

/**
 * The one place GSAP plugins are registered. Every client module imports gsap
 * from here rather than from "gsap" directly, so a plugin can never be used
 * before it is registered — whichever module loads first does the work, and
 * registerPlugin is idempotent.
 *
 * All of these ship in the public `gsap` package (free since 3.13); there is
 * no private registry or token involved.
 */
gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  Flip,
  Draggable,
  InertiaPlugin,
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

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  SplitText,
  ScrambleTextPlugin,
  DrawSVGPlugin,
  Flip,
  Draggable,
  InertiaPlugin,
  ScrollToPlugin,
};
