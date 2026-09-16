"use client";

import { useEffect, useState } from "react";
import {
  IconArrowDown,
  IconArrowUp,
} from "@tabler/icons-react";
import { CheckIcon, CopyIcon } from "@/app/components/docs-code-icons";
import {
  buildComponentPageMarkdown,
  type ComponentPageApiProp,
} from "@/app/utils/component-page-markdown";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type DocNavButtonProps = {
  title: string;
  description?: string;
  code?: string;
  usage?: string;
  examples?: Array<{ title: string; code: string }>;
  apiProps?: ComponentPageApiProp[] | null;
  installCommand?: string;
  previousHref?: string;
  nextHref?: string;
};

export function DocNavButton({
  title,
  description,
  code,
  usage,
  examples,
  apiProps,
  installCommand,
  previousHref,
  nextHref,
}: DocNavButtonProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const markdown = buildComponentPageMarkdown({
        title,
        description,
        url: window.location.href,
        code,
        usage,
        examples,
        apiProps,
        installCommand,
      });
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy page", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-[6px] border border-border bg-background h-7">
      <button
        type="button"
        onClick={handleCopy}
        disabled={busy}
        className="inline-flex items-center gap-2 px-2.5 text-sm font-medium transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-60"
      >
        <span className="relative inline-flex size-4 items-center justify-center">
          <CopyIcon
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,transform] duration-200 ease-out",
              copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
            )}
          />
          <CheckIcon
            className={cn(
              "absolute inset-0 size-4 transition-[opacity,transform] duration-200 ease-out",
              copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
            )}
          />
        </span>
        <span>Copy page</span>
      </button>
      <span aria-hidden className="self-stretch w-px bg-border" />
      <button
        type="button"
        aria-label="Previous doc"
        onClick={() => previousHref && router.push(previousHref)}
        disabled={!previousHref}
        className="inline-flex items-center justify-center px-2 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
      >
        <IconArrowUp className="size-4" />
      </button>
      <span aria-hidden className="self-stretch w-px bg-border" />
      <button
        type="button"
        aria-label="Next doc"
        onClick={() => nextHref && router.push(nextHref)}
        disabled={!nextHref}
        className="inline-flex items-center justify-center px-2 transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
      >
        <IconArrowDown className="size-4" />
      </button>
    </div>
  );
}
