"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "motion/react";
import { IconCornerDownLeft, IconSearch } from "@tabler/icons-react";
import { useSearch } from "@/app/components/search-context";
import { buildSearchIndex, type SearchRecord } from "@/app/lib/search";
import { cn } from "@/lib/utils";

/* ── Suggested pages ─────────────────────────────────────────── */

const SUGGESTED_PAGES: { title: string; href: string; description: string }[] =
  [
    {
      title: "Introduction",
      href: "/docs",
      description: "What AI UI Kit is and how to compose it",
    },
    {
      title: "Installation",
      href: "/docs/installation",
      description: "Prerequisites, styles, provider and your first component",
    },
    {
      title: "MCP",
      href: "/docs/mcp",
      description: "Read the docs from your AI assistant"
    },
    {
      title: "Skills",
      href: "/docs/skills",
      description: "Project-aware context for Claude Code and Cursor",
    },
    {
      title: "Use cases",
      href: "/docs/use-cases",
      description: "Realistic scenarios built with the components",
    },
    {
      title: "AgentChat",
      href: "/docs/agent-chat",
      description: "Full-featured chat component",
    },
    {
      title: "InputBar",
      href: "/docs/input-bar",
      description: "Composable input with attachments and suggestions",
    },
  ];

/* ── Full-text search ────────────────────────────────────────── */

interface SnippetMatch {
  snippet: string;
  pageTitle: string;
  href: string;
  section: string;
  score: number;
}

interface PageMatch {
  title: string;
  description: string;
  href: string;
  section: string;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\|/g, " ")
    .replace(/\n+/g, " ")
    .trim();
}

function extractAllSnippets(content: string, terms: string[]): string[] {
  const lower = content.toLowerCase();
  const snippets: string[] = [];
  const usedRanges: [number, number][] = [];

  for (const term of terms) {
    let searchFrom = 0;
    while (searchFrom < lower.length) {
      const idx = lower.indexOf(term, searchFrom);
      if (idx === -1) break;

      const snippetStart = Math.max(0, idx - 40);
      const snippetEnd = Math.min(content.length, idx + term.length + 80);
      const overlaps = usedRanges.some(
        ([s, e]) => snippetStart < e && snippetEnd > s,
      );

      if (!overlaps) {
        usedRanges.push([snippetStart, snippetEnd]);
        let snippet = content.slice(snippetStart, snippetEnd);
        snippet = cleanMarkdown(snippet);
        if (snippetStart > 0) snippet = "..." + snippet;
        if (snippetEnd < content.length) snippet = snippet + "...";
        snippets.push(snippet);
      }

      searchFrom = idx + term.length;
    }
  }

  return snippets.slice(0, 3);
}

function searchFullText(
  query: string,
  records: SearchRecord[],
): { pages: PageMatch[]; content: SnippetMatch[] } {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { pages: [], content: [] };

  const pageScored: { match: PageMatch; score: number }[] = [];
  const contentMatches: SnippetMatch[] = [];

  for (const record of records) {
    const titleLower = record.title.toLowerCase();
    const descLower = record.description.toLowerCase();
    const contentLower = record.content.toLowerCase();

    const titleHit = terms.every(
      (t) => titleLower.includes(t) || descLower.includes(t),
    );
    const contentHit =
      !titleHit && terms.every((t) => contentLower.includes(t));

    if (titleHit) {
      let score = 0;
      for (const term of terms) {
        if (titleLower === term) score += 50;
        if (titleLower.startsWith(term)) score += 20;
        if (titleLower.includes(term)) score += 10;
        if (descLower.includes(term)) score += 3;
      }
      pageScored.push({
        match: {
          title: record.title,
          description: record.description,
          href: record.href,
          section: record.section,
        },
        score,
      });
    } else if (contentHit) {
      const snippets = extractAllSnippets(record.content, terms);
      for (const snippet of snippets) {
        let score = 1;
        for (const term of terms) {
          if (snippet.toLowerCase().includes(term)) score += 2;
        }
        contentMatches.push({
          snippet,
          pageTitle: record.title,
          href: record.href,
          section: record.section,
          score,
        });
      }
    }
  }

  pageScored.sort((a, b) => b.score - a.score);
  contentMatches.sort((a, b) => b.score - a.score);
  return {
    pages: pageScored.map((p) => p.match),
    content: contentMatches,
  };
}

/* ── Highlight ──────────────────────────────────────────────── */

function HighlightedText({
  text,
  terms,
  className,
}: {
  text: string;
  terms: string[];
  className?: string;
}) {
  if (terms.length === 0) return <span className={className}>{text}</span>;

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = terms.some(
          (t) => part.toLowerCase() === t.toLowerCase(),
        );
        return isMatch ? (
          <mark
            key={i}
            className="bg-foreground/10 text-doc-text rounded-sm px-0.5 font-medium"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </span>
  );
}

/* ── Shared content ─────────────────────────────────────────── */

function SearchCommandContent({
  index,
  onSelect,
}: {
  index: SearchRecord[];
  onSelect: (href: string) => void;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const terms = useMemo(
    () =>
      hasQuery ? trimmed.toLowerCase().split(/\s+/).filter(Boolean) : [],
    [trimmed, hasQuery],
  );

  const { pages, content } = useMemo(() => {
    if (!hasQuery) return { pages: [], content: [] as SnippetMatch[] };
    return searchFullText(trimmed, index);
  }, [trimmed, hasQuery, index]);

  const contentGrouped = useMemo(() => {
    const map = new Map<string, SnippetMatch[]>();
    for (const r of content) {
      const key = r.pageTitle;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [content]);

  const hasResults = pages.length > 0 || content.length > 0;

  return (
    <Command
      className="bg-transparent"
      shouldFilter={false}
      loop
      label="Docs search"
    >
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-doc-border">
        <IconSearch className="h-4 w-4 text-doc-text-muted flex-shrink-0" />
        <Command.Input
          placeholder="Search documentation..."
          autoFocus
          value={query}
          onValueChange={setQuery}
          className="flex-1 bg-transparent outline-none placeholder:text-doc-text-muted/70 text-sm text-doc-text"
        />
      </div>

      <Command.List className="max-h-[400px] overflow-y-auto p-1">
        {hasQuery ? (
          !hasResults ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <p className="text-doc-text-muted text-[13px]">
                No results for &ldquo;{trimmed}&rdquo;.
              </p>
            </div>
          ) : (
            <>
              {pages.length > 0 && (
                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
                >
                  {pages.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={`page-${page.href}`}
                      onSelect={() => onSelect(page.href)}
                      className="cursor-pointer rounded-md px-2 py-2 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
                    >
                      <div className="flex flex-col min-w-0 gap-0.5">
                        <HighlightedText
                          text={page.title}
                          terms={terms}
                          className="font-medium text-doc-text text-[13px]"
                        />
                        {page.description && (
                          <HighlightedText
                            text={page.description}
                            terms={terms}
                            className="line-clamp-1 text-[12px]"
                          />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {contentGrouped.map(([pageTitle, matches]) => (
                <Command.Group
                  key={pageTitle}
                  heading={pageTitle}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
                >
                  {matches.map((match, i) => (
                    <Command.Item
                      key={`${match.href}-${i}`}
                      value={`${match.href}-${i}`}
                      onSelect={() => onSelect(match.href)}
                      className="cursor-pointer flex flex-col items-start gap-0.5 rounded-md px-2 py-2 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
                    >
                      <HighlightedText
                        text={match.snippet}
                        terms={terms}
                        className="line-clamp-2 text-[12px]"
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </>
          )
        ) : (
          <Command.Group
            heading="Suggested"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
          >
            {SUGGESTED_PAGES.map((page) => (
              <Command.Item
                key={page.href}
                value={page.title}
                onSelect={() => onSelect(page.href)}
                className="cursor-pointer rounded-md px-2 py-2 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
              >
                <div className="flex flex-col min-w-0 gap-0.5">
                  <span className="font-medium text-doc-text text-[13px]">
                    {page.title}
                  </span>
                  <span className="line-clamp-1 text-[12px]">
                    {page.description}
                  </span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>

      <div className="flex items-center gap-3 border-t border-doc-border px-4 py-2 text-[11px] text-doc-text-muted">
        <span className="flex items-center gap-1.5">
          <kbd className="pointer-events-none inline-flex h-[18px] select-none items-center rounded border border-doc-border bg-black/5 dark:bg-white/10 px-1 font-mono text-[10px]">
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
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
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
              <path d="M12 5v14" />
              <path d="M19 12l-7 7-7-7" />
            </svg>
          </kbd>
          navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="pointer-events-none inline-flex h-[18px] select-none items-center rounded border border-doc-border bg-black/5 dark:bg-white/10 px-1 font-mono text-[10px]">
            <IconCornerDownLeft className="h-2.5 w-2.5" />
          </kbd>
          open
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="pointer-events-none inline-flex h-[18px] select-none items-center rounded border border-doc-border bg-black/5 dark:bg-white/10 px-1 font-mono text-[10px]">
            esc
          </kbd>
          close
        </span>
      </div>
    </Command>
  );
}

/* ── Mobile fullscreen search ───────────────────────────────── */

function MobileSearchContent({
  index,
  onSelect,
  onClose,
}: {
  index: SearchRecord[];
  onSelect: (href: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;
  const terms = useMemo(
    () =>
      hasQuery ? trimmed.toLowerCase().split(/\s+/).filter(Boolean) : [],
    [trimmed, hasQuery],
  );

  const { pages, content } = useMemo(() => {
    if (!hasQuery) return { pages: [], content: [] as SnippetMatch[] };
    return searchFullText(trimmed, index);
  }, [trimmed, hasQuery, index]);

  const contentGrouped = useMemo(() => {
    const map = new Map<string, SnippetMatch[]>();
    for (const r of content) {
      const key = r.pageTitle;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [content]);

  const hasResults = pages.length > 0 || content.length > 0;

  return (
    <Command
      className="flex flex-col h-full bg-transparent"
      shouldFilter={false}
      loop
      label="Docs search"
    >
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-doc-border">
        <div className="flex-1 flex items-center gap-2 rounded-full bg-black/5 dark:bg-white/10 px-3 py-2">
          <IconSearch className="h-4 w-4 text-doc-text-muted flex-shrink-0" />
          <Command.Input
            placeholder="Search documentation..."
            autoFocus
            value={query}
            onValueChange={setQuery}
            className="flex-1 bg-transparent outline-none text-base placeholder:text-doc-text-muted/70 text-doc-text"
          />
        </div>
        <button
          type="button"
          className="text-sm font-medium text-doc-text shrink-0 px-1"
          onClick={onClose}
          aria-label="Close search"
        >
          Cancel
        </button>
      </div>

      <Command.List className="flex-1 !max-h-none overflow-y-auto overscroll-contain p-1">
        {hasQuery ? (
          !hasResults ? (
            <div className="flex flex-col items-center py-12 gap-2">
              <p className="text-doc-text-muted text-sm">
                No results for &ldquo;{trimmed}&rdquo;.
              </p>
            </div>
          ) : (
            <>
              {pages.length > 0 && (
                <Command.Group
                  heading="Pages"
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
                >
                  {pages.map((page) => (
                    <Command.Item
                      key={page.href}
                      value={`page-${page.href}`}
                      onSelect={() => onSelect(page.href)}
                      className="cursor-pointer rounded-md px-2 py-3 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
                    >
                      <div className="flex flex-col min-w-0 gap-1">
                        <HighlightedText
                          text={page.title}
                          terms={terms}
                          className="font-medium text-doc-text text-[14px]"
                        />
                        {page.description && (
                          <HighlightedText
                            text={page.description}
                            terms={terms}
                            className="line-clamp-1 text-[13px]"
                          />
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {contentGrouped.map(([pageTitle, matches]) => (
                <Command.Group
                  key={pageTitle}
                  heading={pageTitle}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
                >
                  {matches.map((match, i) => (
                    <Command.Item
                      key={`${match.href}-${i}`}
                      value={`${match.href}-${i}`}
                      onSelect={() => onSelect(match.href)}
                      className="cursor-pointer flex flex-col items-start gap-0.5 rounded-md px-2 py-3 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
                    >
                      <HighlightedText
                        text={match.snippet}
                        terms={terms}
                        className="line-clamp-3 text-[13px] leading-relaxed"
                      />
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </>
          )
        ) : (
          <Command.Group
            heading="Suggested"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-doc-text-muted"
          >
            {SUGGESTED_PAGES.map((page) => (
              <Command.Item
                key={page.href}
                value={page.title}
                onSelect={() => onSelect(page.href)}
                className="cursor-pointer rounded-md px-2 py-3 text-sm text-doc-text-muted data-[selected=true]:bg-black/5 dark:data-[selected=true]:bg-white/10 data-[selected=true]:text-doc-text"
              >
                <div className="flex flex-col min-w-0 gap-1">
                  <span className="font-medium text-doc-text text-[14px]">
                    {page.title}
                  </span>
                  <span className="line-clamp-1 text-[13px]">
                    {page.description}
                  </span>
                </div>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command>
  );
}

/* ── Modal shell ────────────────────────────────────────────── */

export function SearchModal() {
  const { open, setOpen } = useSearch();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const index = useMemo(() => buildSearchIndex(), []);

  // Detect mobile via matchMedia
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mql.matches);
    handler();
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  // ⌘K / Ctrl+K + Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, setOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router, setOpen],
  );

  return (
    <AnimatePresence>
      {open &&
        (isMobile ? (
          <motion.div
            key="mobile"
            className="fixed inset-0 z-[100] flex flex-col bg-doc-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <MobileSearchContent
              index={index}
              onSelect={handleSelect}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        ) : (
          <div
            key="desktop"
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            />
            <motion.div
              className={cn(
                "relative w-full max-w-[560px] mx-4 overflow-hidden rounded-xl border border-doc-border shadow-xl bg-doc-background origin-top",
              )}
              initial={{ opacity: 0, scale: 0.9, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{
                type: "spring",
                stiffness: 380,
                damping: 26,
                mass: 0.8,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <SearchCommandContent index={index} onSelect={handleSelect} />
            </motion.div>
          </div>
        ))}
    </AnimatePresence>
  );
}
