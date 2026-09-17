"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IconMenu3, IconSearch } from "@tabler/icons-react";
import { Sidebar } from "./sidebar";
import { useSearch } from "@/app/components/search-context";
import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";
import { componentIdFromName } from "@/app/data/component-docs";

function formatComponentLabel(label: string) {
  return label
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

function getPageTitle(pathname: string): string {
  for (const section of SIDEBAR_SECTIONS) {
    for (const item of section.items) {
      if (item.href === pathname) {
        return section.components
          ? formatComponentLabel(item.label)
          : item.label;
      }
    }
  }
  const componentMatch = pathname.match(/^\/docs\/([^/]+)/);
  if (componentMatch) {
    const slug = componentMatch[1];
    for (const section of SIDEBAR_SECTIONS) {
      if (!section.components) continue;
      for (const item of section.items) {
        if (componentIdFromName(item.label) === slug) {
          return formatComponentLabel(item.label);
        }
      }
    }
  }
  return "Docs";
}

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { setOpen: setSearchOpen } = useSearch();
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  useEffect(() => {
    // Reset the inner scroll container to the top on route change.
    // Next.js scroll restoration only acts on window, so the overflow-y-auto
    // <main> keeps its previous scroll position without this.
    const el = mainRef.current;
    if (!el) return;
    el.scrollTop = 0;
  }, [pathname]);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="h-dvh overflow-hidden ">
      <div className="flex flex-col lg:flex-row h-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onMobileOpenChange={setIsMobileSidebarOpen}
        />
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Mobile header: hamburger | title | search */}
          <header className="lg:hidden sticky top-0 z-20 flex items-center h-12 px-3 gap-1 border-b border-doc-border bg-doc-background/95 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setIsMobileSidebarOpen((prev) => !prev)}
              className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
            >
              <IconMenu3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={scrollToTop}
              className="flex-1 min-w-0 text-center"
            >
              <span className="text-sm font-medium text-doc-text truncate block">
                {title}
              </span>
            </button>
            <button
              type="button"
              aria-label="Search documentation"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
            >
              <IconSearch className="h-4 w-4" />
            </button>
          </header>

          {/* Desktop collapsed-sidebar header: just a menu button to re-open */}
          {isSidebarCollapsed && (
            <div className="hidden lg:flex h-12 items-center px-6 border-b border-doc-border bg-doc-background">
              <button
                type="button"
                aria-label="Open sidebar"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
              >
                <IconMenu3 className="h-4 w-4" />
              </button>
            </div>
          )}

          <main
            ref={mainRef}
            className="flex-1 min-h-0 overflow-y-auto px-6 py-6 bg-doc-background"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
