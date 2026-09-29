"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";
import { cn } from "../utils";

const VARIANTS = {
  /** Subtle border that fills with the foreground on hover. */
  ghost: "border-foreground/20 hover:bg-foreground hover:text-background",
  /** Primary call to action. */
  solid: "border-primary bg-primary text-background hover:bg-transparent hover:text-primary",
  /** Secondary action beside a solid one. */
  outline: "border-foreground text-foreground hover:bg-foreground hover:text-background",
};

const SIZES = {
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-lg",
  xl: "px-12 py-6 text-xl",
};

interface MagneticButtonProps {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  onClick?: () => void;
}

export default function MagneticButton({
  children,
  variant = "ghost",
  size = "md",
  className,
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15, mass: 0.1 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15, mass: 0.1 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    // The ref can be null if the element unmounts between the event firing
    // and this handler running; `ref.current!` would throw there.
    if (!ref.current) return;

    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    x.set(middleX);
    y.set(middleY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{ x: mouseX, y: mouseY }}
      className={cn(
        "relative border font-mono uppercase transition-colors duration-300",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
