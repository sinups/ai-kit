"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "motion/react";
import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";
import { cn } from "@/lib/utils";
import { AppLogo } from "@/app/components/app-logo";
import { ThemeIcon } from "@/app/components/theme-icon";
import { GitHubIcon } from "@/app/components/github-icon";
import { GitHubStars } from "@/app/components/github-stars";
import { SearchTrigger } from "@/app/components/search-trigger";
import { IconDoubleChevronLeft } from "@/app/components/sidebar-icons";

type NavItemProps = {
  href: string;
  label: string;
  isActive: boolean;
  onNavigate?: () => void;
};

type SidebarProps = {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

function formatComponentLabel(label: string) {
  return label
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

function NavItem({ href, label, isActive, onNavigate }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 w-full pl-2 pr-2 py-1.5 rounded-md text-sm",
        "hover:bg-black/5 hover:text-doc-text dark:hover:bg-white/10",
        isActive
          ? "bg-black/5 text-doc-text dark:bg-white/10"
          : "text-doc-text-muted",
      )}
    >
      <span className="flex-1 text-left">{label}</span>
    </Link>
  );
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const sidebarWidth = 240;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showTopMask, setShowTopMask] = useState(false);
  const [showBottomMask, setShowBottomMask] = useState(false);

  useEffect(() => {
    onMobileOpenChange(false);
  }, [pathname, onMobileOpenChange]);

  const renderSections = (onNavigate?: () => void) => {
    const homeSection = SIDEBAR_SECTIONS.find(
      (section) => section.title === "Home",
    );
    const installSection = SIDEBAR_SECTIONS.find(
      (section) => section.title === "Getting Started",
    );
    const componentSections = SIDEBAR_SECTIONS.filter((section) => section.components);

    const homeItems = homeSection?.items ?? [];
    const installItems = installSection?.items ?? [];

    const topLinks = [...installItems, ...homeItems];

    return (
      <>
        <div className="px-3 pt-3">
          <SearchTrigger />
        </div>
        <div className="px-3">
          <div className="flex flex-col gap-0.5 pt-3">
            {topLinks.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={pathname === item.href}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        <hr className="my-3 border-t border-doc-border" />

        {componentSections.map((section) => (
          <div key={section.title} className="px-3 pb-3">
            <div className="px-2 pb-1 pt-1 text-xs font-medium text-doc-text-muted/80">
              {section.title}
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={formatComponentLabel(item.label)}
                  isActive={pathname === item.href}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </>
    );
  };

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const updateMasks = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setShowTopMask(scrollTop > 2);
      setShowBottomMask(scrollTop + clientHeight < scrollHeight - 2);
    };
    updateMasks();
  }, [isCollapsed]);

  return (
    <>
      <AnimatePresence initial={false}>
        {isMobileOpen && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-30 bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onMobileOpenChange(false)}
            />
            <motion.div
              className="lg:hidden fixed top-12 left-2 right-2 z-40 mt-2 rounded-[20px] outline outline-foreground/8 bg-doc-background shadow-sm"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.14 }}
            >
              <div className="max-h-[56vh] overflow-y-auto py-2">
                {renderSections(() => onMobileOpenChange(false))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          "hidden lg:block shrink-0 border-r overflow-hidden bg-doc-background text-doc-text border-doc-border",
          isCollapsed && "border-transparent",
        )}
        animate={{ width: isCollapsed ? 0 : sidebarWidth }}
        initial={{ width: sidebarWidth }}
        transition={{ duration: 0.18, ease: [0.22, 0.61, 0.36, 1] }}
        aria-hidden={isCollapsed}
      >
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              className="flex flex-col h-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
            >
              <div className="shrink-0 h-12 flex items-center pl-5 border-b border-doc-border pr-3">
                <div className="flex items-center justify-between gap-2 w-full">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-sm font-medium tracking-tight text-doc-text hover:opacity-80 transition-opacity rounded-md"
                  >
                    <AppLogo className="size-5" />
                    <span className="whitespace-nowrap">AI UI Kit</span>
                  </Link>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Close sidebar"
                    onClick={onToggle}
                  >
                    <IconDoubleChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <div className="relative h-full">
                  <div
                    ref={scrollRef}
                    onScroll={() => {
                      const el = scrollRef.current;
                      if (!el) return;
                      const { scrollTop, scrollHeight, clientHeight } = el;
                      setShowTopMask(scrollTop > 2);
                      setShowBottomMask(
                        scrollTop + clientHeight < scrollHeight - 2,
                      );
                    }}
                    className="h-full overflow-y-auto pb-4"
                  >
                    {renderSections()}
                  </div>
                  <div
                    className={cn(
                      "pointer-events-none absolute top-0 left-0 right-0 h-8 bg-linear-to-b from-doc-background via-doc-background/60 to-transparent transition-opacity",
                      showTopMask ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-linear-to-t from-doc-background via-doc-background/60 to-transparent transition-opacity",
                      showBottomMask ? "opacity-100" : "opacity-0",
                    )}
                  />
                </div>
              </div>

              <div className="shrink-0 px-3 pt-3 pb-2">
                <a
                  href="https://www.npmjs.com/package/@sinups/ai-kit"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-[10px] h-9 px-4 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_0_0.5px_hsl(var(--foreground)/0.5),inset_0_0_0_1px_hsl(var(--foreground)/0.14)] active:scale-[0.99] transition-all duration-150"
                >
                  Install from npm
                </a>
              </div>

              <hr className="border-t border-doc-border" />

              <div className="shrink-0 px-3 h-12 flex items-center">
                <div className="flex items-center gap-2 justify-between w-full">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-7 w-7 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="Toggle theme"
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                  >
                    <ThemeIcon className="h-4 w-4" />
                  </button>
                  <a
                    href="https://github.com/sinups/ai-kit"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 h-7 px-1.5 rounded-md text-doc-text-muted hover:text-doc-text hover:bg-black/5 dark:hover:bg-white/10"
                    aria-label="GitHub repository"
                  >
                    <GitHubIcon className="h-4 w-4" />
                    <GitHubStars className="text-xs tabular-nums" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
