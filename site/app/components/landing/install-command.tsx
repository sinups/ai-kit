"use client";

import { useEffect, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { PACKAGE_NAME } from "@/app/lib/site";

const COMMAND = `npm install ${PACKAGE_NAME}`;

export function InstallCommand() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    navigator.clipboard
      ?.writeText(COMMAND)
      .then(() => setCopied(true))
      .catch(() => {});
  };

  return (
    <div className="inline-flex h-10 max-w-full items-center gap-3 rounded-full border border-border bg-background/70 pl-4 pr-1 font-mono text-[13px] backdrop-blur-sm">
      <code className="truncate text-foreground/80">
        <span className="select-none text-muted-foreground" aria-hidden="true">
          ${" "}
        </span>
        {COMMAND}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy install command"}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {copied ? <IconCheck className="size-4" /> : <IconCopy className="size-4" />}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Install command copied" : ""}
      </span>
    </div>
  );
}
