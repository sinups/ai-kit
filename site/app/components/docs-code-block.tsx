"use client";

import { useCallback, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import * as shiki from "shiki";
import { CheckIcon, CopyIcon, FileExtIcon } from "@/app/components/docs-code-icons";
import { cn } from "@/lib/utils";

let highlighterPromise: Promise<shiki.Highlighter> | null = null;
const getHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = shiki.createHighlighter({
      themes: ["vesper", "github-light"],
      langs: [
        "json",
        "typescript",
        "tsx",
        "jsx",
        "javascript",
        "bash",
        "css",
        "plaintext",
      ],
    });
  }
  return highlighterPromise;
};

const vesperLightOverrides = `
.an-docs-code .shiki span[style*="color:#24292e"] { color: #000000 !important; }
.an-docs-code .shiki span[style*="color:#d73a49"] { color: #495057 !important; font-weight: 500; }
.an-docs-code .shiki span[style*="color:#032f62"] { color: #146C43 !important; }
.an-docs-code .shiki span[style*="color:#6f42c1"] { color: #C2410C !important; }
.an-docs-code .shiki span[style*="color:#005cc5"] { color: #C2410C !important; }
.an-docs-code .shiki span[style*="color:#e36209"] { color: #C2410C !important; }
.an-docs-code .shiki span[style*="color:#6a737d"] { color: #6C757D !important; }
`;

const AUTO_COLLAPSE_LINE_THRESHOLD = 20;

const FILENAME_LANGUAGE_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  json: "json",
  jsonc: "json",
  sh: "bash",
  bash: "bash",
  css: "css",
};

function getLanguageFromFilename(filename?: string) {
  if (!filename) return null;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (!ext) return null;
  return FILENAME_LANGUAGE_MAP[ext] ?? null;
}

export function DocsCodeBlock({
  code,
  language,
  filename,
  showPrompt,
  collapsible,
  defaultExpanded,
  className: outerClassName,
}: {
  code: string;
  language: string;
  filename?: string;
  showPrompt?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}) {
  const lineCount = code.split("\n").length;
  const isCollapsible = collapsible ?? lineCount > AUTO_COLLAPSE_LINE_THRESHOLD;

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const [html, setHtml] = useState("");
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";
  const isCollapsed = isCollapsible && !expanded;
  const resolvedLanguage = getLanguageFromFilename(filename) ?? language;

  const highlight = useCallback(async () => {
    try {
      const highlighter = await getHighlighter();
      const langs = await highlighter.getLoadedLanguages();
      const lang = langs.includes(resolvedLanguage as shiki.BundledLanguage)
        ? resolvedLanguage
        : "plaintext";
      const result = highlighter.codeToHtml(code, {
        lang: lang as shiki.BundledLanguage,
        theme: isDark ? "vesper" : "github-light",
      });
      setHtml(result.replace(/\stabindex="[^"]*"/g, ""));
    } catch {
      setHtml(`<pre><code>${code}</code></pre>`);
    }
  }, [code, resolvedLanguage, isDark]);

  useEffect(() => {
    highlight();
  }, [highlight]);

  return (
    <>
      {!isDark && <style>{vesperLightOverrides}</style>}
      <div className="relative">
        {/* Gradient border overlay for collapsible blocks - fades via opacity */}
        {isCollapsible && (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 z-10 rounded-lg transition-opacity duration-300",
              isCollapsed ? "opacity-100" : "opacity-0",
            )}
            style={{
              padding: "1px",
              background:
                "linear-gradient(to bottom, hsl(var(--border)) 0%, hsl(var(--border)) 30%, transparent 100%)",
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
        )}
        <div
          className={cn(
            "group/code an-docs-code relative w-full min-w-0 overflow-hidden rounded-lg border bg-background transition-[max-height,border-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isCollapsed ? "border-transparent" : "border-border",
            isCollapsed && "max-h-64",
            outerClassName,
          )}
          data-raw-code={code}
        >
          {/* Floating action buttons: Expand | Copy */}
          <div className="absolute top-1.5 right-1.5 z-20 flex items-center">
            {isCollapsible && (
              <>
                <button
                  type="button"
                  onClick={() => setExpanded((e) => !e)}
                  className="expand-btn cursor-pointer rounded-md px-2.5 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.97]"
                >
                  {expanded ? "Collapse" : "Expand"}
                </button>
                <div className="mx-1.5 h-5 w-px shrink-0 bg-border" />
              </>
            )}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md opacity-70 transition-[opacity,background-color] hover:bg-accent hover:opacity-100 active:scale-[0.97]"
              aria-label="Copy code"
            >
              <div className="relative size-4">
                <CopyIcon
                  className={cn(
                    "absolute inset-0 size-4 text-muted-foreground transition-[opacity,transform] duration-200 ease-out",
                    copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
                  )}
                />
                <CheckIcon
                  className={cn(
                    "absolute inset-0 size-4 text-muted-foreground transition-[opacity,transform] duration-200 ease-out",
                    copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
                  )}
                />
              </div>
            </button>
          </div>

          {/* Filename caption */}
          {filename && (
            <div className="flex items-center gap-2 px-4 py-2.5 text-[.8125rem] text-foreground/70">
              <FileExtIcon filename={filename} className="size-4 shrink-0" />
              <span className="truncate font-mono">{filename}</span>
            </div>
          )}

          {/* Code content */}
          <div
            tabIndex={-1}
            className={cn(
              "relative px-4 py-3.5 text-[.8125rem] leading-relaxed overflow-x-auto outline-none focus:outline-none focus-visible:outline-none",
            )}
          >
            {showPrompt && (
              <span className="select-none text-[#FFC799] mr-1.5 font-mono">
                $
              </span>
            )}
            {html ? (
              <div
                className={cn(
                  "[&_.shiki]:!bg-transparent [&_.shiki_pre]:!bg-transparent [&_.shiki_pre]:!m-0 [&_.shiki_pre]:!p-0 [&_.shiki]:!m-0 [&_.shiki]:!p-0 [&_.shiki_code]:font-mono [&_pre]:!outline-none [&_pre]:!ring-0 [&_pre]:!shadow-none",
                  showPrompt && "inline [&_pre]:!inline",
                )}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            ) : (
              <pre className="font-mono inline">
                <code>{code}</code>
              </pre>
            )}
          </div>

          {/* Bottom gradient fade + hover zone */}
          {isCollapsed && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 rounded-b-lg bg-linear-to-b from-transparent to-background"
              />
              <div
                className="expand-btn absolute inset-x-0 bottom-0 h-20 cursor-pointer"
                onClick={() => setExpanded(true)}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
