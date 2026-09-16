import { cn } from "@/lib/utils";
import { createHighlighter } from "shiki";
import { DocCodeCopy } from "@/app/components/doc-code-copy";

const LANGS = ["tsx", "ts", "js", "jsx", "json", "bash", "css", "text"];
const THEMES = ["github-light", "github-dark"];

let highlighterPromise: ReturnType<typeof createHighlighter> | null = null;
async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: THEMES,
      langs: LANGS,
    });
  }
  return highlighterPromise;
}

export async function DocCodeBlock({
  code,
  language = "tsx",
  className,
  variant = "default",
}: {
  code: string;
  language?: string;
  className?: string;
  variant?: "default" | "plain";
}) {
  const trimmed = code.trimEnd();
  const highlighter = await getHighlighter();
  // Guarantee lang is loaded for this render even if the singleton was
  // created before we knew we needed it (Turbopack/RSC can hoist
  // module state in surprising ways). `loadLanguage` is a no-op if it's
  // already registered.
  const loaded = highlighter.getLoadedLanguages();
  if (!loaded.includes(language)) {
    await highlighter.loadLanguage(language as never);
  }
  const lightHtml = highlighter.codeToHtml(trimmed || " ", {
    lang: language,
    theme: "github-light",
  });
  const darkHtml = highlighter
    .codeToHtml(trimmed || " ", {
      lang: language,
      theme: "github-dark",
    })
    .replace(/background-color:[^;]+;?/g, "");

  return (
    <div
      className={cn(
        "relative p-3 overflow-auto",
        variant === "plain"
          ? "bg-transparent"
          : "rounded-[8px] outline outline-foreground/8 shadow-2xs bg-background overflow-hidden",
        className,
      )}
    >
      {variant !== "plain" && <DocCodeCopy code={trimmed} />}
      <div
        className="an-markdown text-[13px] dark:hidden"
        dangerouslySetInnerHTML={{ __html: lightHtml }}
      />
      <div
        className="an-markdown text-[13px] hidden dark:block"
        dangerouslySetInnerHTML={{ __html: darkHtml }}
      />
    </div>
  );
}
