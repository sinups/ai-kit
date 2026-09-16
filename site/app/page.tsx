"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { IconSearch } from "@tabler/icons-react";
import { AppLogo } from "@/app/components/app-logo";
import { ShowcaseGrid } from "@/app/components/showcase-grid";
import { ThemeIcon } from "@/app/components/theme-icon";
import { GitHubIcon } from "@/app/components/github-icon";
import { GitHubStars } from "@/app/components/github-stars";
import { useSearch } from "@/app/components/search-context";

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpen: setSearchOpen } = useSearch();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="relative h-12 px-4 sm:px-6 border-b border-border bg-doc-background overflow-hidden">
        <div className="relative z-10 h-full max-w-6xl mx-auto w-full flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium tracking-tight text-foreground hover:opacity-80 transition-opacity rounded-md whitespace-nowrap"
          >
            <AppLogo className="size-5 shrink-0" />
            <span>AI UI Kit</span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-4">
            {/* Mobile: icon-only search */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="sm:hidden inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="Search documentation"
            >
              <IconSearch className="h-4 w-4" />
            </button>
            {/* Desktop: search box with ⌘K hint */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="hidden sm:inline-flex group items-center gap-2 h-8 pl-2.5 pr-1.5 rounded-md border border-border bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-sm text-muted-foreground transition-colors"
              aria-label="Search documentation"
            >
              <IconSearch className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none inline-flex ml-6 h-[18px] select-none items-center gap-0.5 rounded border border-border bg-black/[0.04] dark:bg-white/[0.06] px-1 font-mono text-[10px]">
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
            <Link
              href="/docs"
              className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground"
            >
              Docs
            </Link>
            <a
              href="https://github.com/sinups/ai-kit"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-8 w-8 sm:w-auto justify-center sm:px-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="GitHub repository"
            >
              <GitHubIcon className="h-4 w-4" />
              <GitHubStars className="hidden sm:inline text-xs tabular-nums" />
            </a>
            <button
              type="button"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label="Toggle theme"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <ThemeIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto space-y-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-medium text-foreground">
            Agent UI for Mantine apps
          </h1>
          <p className="text-base text-muted-foreground text-pretty max-w-md">
            Production-ready React components for chat, tool calls and AI
            workflows, built on Mantine primitives and theme tokens. A port of
            Agent Elements by 21st.dev.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-[10px] h-10 px-6 text-[15px] font-medium bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_0_0.5px_hsl(var(--foreground)/0.5),inset_0_0_0_1px_hsl(var(--foreground)/0.14)] active:scale-[0.99] transition-all duration-150"
            >
              Get Started
            </Link>
            <Link
              href="/docs/agent-chat"
              className="inline-flex items-center justify-center rounded-[10px] h-10 px-6 text-[15px] font-medium bg-muted border border-border text-muted-foreground hover:bg-accent hover:text-foreground active:scale-[0.99] transition-all duration-150"
            >
              Explore
            </Link>
          </div>
        </div>
        <div className="mt-8 mb-16 max-w-6xl mx-auto relative">
          <ShowcaseGrid />
        </div>
      </main>
      <footer className="px-4 sm:px-8 py-3 border-t border-border">
        <div className="max-w-6xl mx-auto w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[13px] text-foreground/40">
            Built by Sinups. Forked from{" "}
            <a
              href="https://github.com/21st-dev/agent-elements"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground/60 transition-colors"
            >
              AI UI Kit
            </a>{" "}
            by 21st.dev (MIT).
          </span>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              href="/docs"
              className="text-[13px] text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Docs
            </Link>
            <a
              href="https://github.com/sinups/ai-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@sinups/ai-kit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              npm
            </a>
            <a
              href="https://mantine.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-foreground/40 hover:text-foreground/60 transition-colors"
            >
              Mantine
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
