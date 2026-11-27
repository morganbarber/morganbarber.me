"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap } from "@/lib/gsap";
import { isStatic } from "@/lib/motion";

/**
 * A link whose label decodes itself on hover or focus. The visible text is
 * aria-hidden and the link carries a stable aria-label, so assistive tech
 * never hears the scramble in progress.
 */
export default function ScrambleLink({
  href,
  children,
  className,
  external = false,
  ...rest
}: {
  href: string;
  children: string;
  className?: string;
  external?: boolean;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children">) {
  const text = useRef<HTMLSpanElement>(null);

  const scramble = () => {
    if (!text.current || isStatic()) return;
    gsap.to(text.current, {
      duration: 0.6,
      overwrite: true,
      scrambleText: { text: children, chars: "lowerCase", speed: 0.8 },
    });
  };

  const label = (
    <span ref={text} aria-hidden="true">
      {children}
    </span>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer external"
        aria-label={`${children} (opens in a new tab)`}
        className={className}
        onPointerEnter={scramble}
        onFocus={scramble}
        {...rest}
      >
        {label}
      </a>
    );
  }

  return (
    <Link
      href={href}
      aria-label={children}
      className={className}
      onPointerEnter={scramble}
      onFocus={scramble}
      {...rest}
    >
      {label}
    </Link>
  );
}
