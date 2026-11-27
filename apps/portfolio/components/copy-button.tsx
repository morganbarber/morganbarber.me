"use client";

import { copyText } from "@/lib/motion";

/** Copies `value` to the clipboard and confirms with a toast. */
export default function CopyButton({
  value,
  label = "Copied",
  className,
  children,
}: {
  value: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => void copyText(value, label)}
      data-cursor="copy"
      className={className}
    >
      {children ?? value}
    </button>
  );
}
