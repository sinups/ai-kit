"use client";

import { useSearch } from "@/app/components/search-context";

export function SearchTrigger() {
  const { setOpen } = useSearch();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Search documentation"
      className="relative w-full rounded-lg h-7 pl-2.5 pr-10 text-left text-sm border border-border bg-foreground/[0.04] shadow-none cursor-pointer flex items-center hover:bg-foreground/[0.06] transition-colors"
    >
      <span className="text-muted-foreground/40">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-[18px] select-none items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1 font-mono text-[10px] text-muted-foreground/70">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
        </svg>
        K
      </kbd>
    </button>
  );
}
