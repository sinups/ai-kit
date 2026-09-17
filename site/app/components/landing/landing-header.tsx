"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { IconSearch } from "@tabler/icons-react";
import { AppLogo } from "@/app/components/app-logo";
import { GitHubIcon } from "@/app/components/github-icon";
import { useSearch } from "@/app/components/search-context";
import { ThemeIcon } from "@/app/components/theme-icon";
import { REPO_URL, SITE_NAME } from "@/app/lib/site";
import { StarCount } from "./star-count";

const iconButton =
  "inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export function LandingHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const { setOpen: setSearchOpen } = useSearch();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header
      data-scrolled={scrolled || undefined}
      className="sticky top-0 z-40 border-b border-transparent bg-background/75 backdrop-blur-xl transition-colors duration-300 data-[scrolled]:border-border"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md text-[15px] font-semibold tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <AppLogo className="size-5 shrink-0" />
          {SITE_NAME}
        </Link>
        <nav aria-label="Main" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link
            href="/docs"
            className="hidden rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring sm:inline"
          >
            Docs
          </Link>
          <Link
            href="/docs/agent-chat"
            className="hidden rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring md:inline"
          >
            Components
          </Link>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={iconButton}
            aria-label="Search documentation"
          >
            <IconSearch className="size-4" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <ThemeIcon className="size-4" />
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Star AI UI Kit on GitHub"
            className="ml-1 inline-flex h-8 items-center gap-2 rounded-full border border-border bg-muted/40 px-3 text-[13px] font-medium text-foreground/90 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <GitHubIcon className="size-3.5" />
            Star
            <StarCount />
          </a>
        </nav>
      </div>
    </header>
  );
}
