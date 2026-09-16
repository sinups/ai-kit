"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/app/components/docs-code-icons";
import { cn } from "@/lib/utils";

type DocCodeCopyProps = {
  code: string;
  className?: string;
};

/**
 * Small absolute-positioned copy button for {@link DocCodeBlock}. Renders in
 * the top-right corner and flips icon + label for ~2s after copy.
 */
export function DocCodeCopy({ code, className }: DocCodeCopyProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
      className={cn(
        "absolute top-2 right-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-foreground",
        "opacity-70 hover:opacity-100 focus-visible:opacity-100",
        className,
      )}
    >
      <span className="relative inline-flex size-3.5">
        <CopyIcon
          className={cn(
            "absolute inset-0 size-3.5 transition-[opacity,transform] duration-200 ease-out",
            copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
          )}
        />
        <CheckIcon
          className={cn(
            "absolute inset-0 size-3.5 transition-[opacity,transform] duration-200 ease-out",
            copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </span>
    </button>
  );
}
