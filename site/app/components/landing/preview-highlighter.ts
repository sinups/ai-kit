import { createShikiHighlighter, type SyntaxHighlighter } from "@sinups/ai-kit";

let loading: Promise<SyntaxHighlighter> | null = null;

function loadHighlighter() {
  loading ??= import("shiki").then(async ({ createHighlighter }) => {
    const shiki = await createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["ts", "tsx", "bash", "json"],
    });
    return createShikiHighlighter(shiki, { light: "github-light", dark: "github-dark" });
  });
  return loading;
}

export const previewHighlighter: SyntaxHighlighter = async (code, language) => {
  const highlight = await loadHighlighter();
  return highlight(code, language);
};
