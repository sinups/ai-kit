"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/app/components/docs-code-icons";
import { cn } from "@/lib/utils";

const PACKAGES = "@sinups/ai-kit @mantine/core @mantine/hooks";
const STORAGE_KEY = "ai-kit:package-manager";

type PackageManager = "pnpm" | "npm" | "yarn" | "bun";

const MANAGERS: { id: PackageManager; label: string }[] = [
  { id: "pnpm", label: "pnpm" },
  { id: "npm", label: "npm" },
  { id: "yarn", label: "yarn" },
  { id: "bun", label: "bun" },
];

export function buildInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case "pnpm":
      return `pnpm add ${PACKAGES}`;
    case "npm":
      return `npm install ${PACKAGES}`;
    case "yarn":
      return `yarn add ${PACKAGES}`;
    case "bun":
      return `bun add ${PACKAGES}`;
  }
}

/**
 * Package manager tabs with a copyable install command. The whole library
 * ships as one npm package, so the command is the same on every page.
 */
export function CliCommands() {
  const [active, setActive] = useState<PackageManager>("pnpm");
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as
        | PackageManager
        | null;
      if (saved && MANAGERS.some((m) => m.id === saved)) setActive(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const command = buildInstallCommand(active);

  const handleTab = useCallback((id: PackageManager) => {
    setActive(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-1.5 py-1.5">
        <div className="flex items-center gap-0.5 overflow-x-auto text-[13px]">
          {MANAGERS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleTab(m.id)}
              className={cn(
                "h-7 px-2.5 rounded-md cursor-pointer font-medium transition-colors",
                active === m.id
                  ? "bg-muted text-foreground shadow-2xs ring-1 ring-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Copy button */}
        <div className="ml-auto pr-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Copy install command"
          >
            <div className="relative size-3.5">
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
            </div>
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className="overflow-x-auto px-5 py-4">
        <pre className="text-[13px] leading-[1.7] font-mono">
          <code className="text-foreground whitespace-nowrap">
            <span className="select-none text-muted-foreground mr-2">$</span>
            {command}
          </code>
        </pre>
      </div>
    </div>
  );
}
