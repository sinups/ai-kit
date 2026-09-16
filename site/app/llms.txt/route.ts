import {
  COMPONENT_DOCS,
  componentIdFromName,
} from "@/app/data/component-docs";
import { SITE_URL } from "@/app/lib/site";

export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [];

  lines.push("# AI UI Kit");
  lines.push("");
  lines.push(
    "> An open-source collection of chat and agent UI components built on Mantine: messages, tool cards, streaming states, and input controls. Install with `npm install @sinups/ai-kit @mantine/core @mantine/hooks`. A fork of Agent Elements by 21st.dev (MIT).",
  );
  lines.push("");
  lines.push("## Get started");
  lines.push("");
  lines.push(`- [Introduction](${SITE_URL}/docs): what AI UI Kit is, component inventory, composition recipes.`);
  lines.push(`- [Installation](${SITE_URL}/docs/installation): prerequisites, stylesheet and provider setup, usage.`);
  lines.push(`- [MCP](${SITE_URL}/docs/mcp): read the docs from your AI assistant.`);
  lines.push(`- [Skills](${SITE_URL}/docs/skills): project-aware context so Claude Code and Cursor compose the components correctly.`);
  lines.push(`- [Use cases](${SITE_URL}/docs/use-cases): realistic agent scenarios (coding agents, support chat, etc.).`);
  lines.push("");
  lines.push("## Components");
  lines.push("");
  for (const doc of COMPONENT_DOCS) {
    const id = componentIdFromName(doc.name);
    lines.push(`- [${doc.name}](${SITE_URL}/docs/${id})`);
  }
  lines.push("");
  lines.push("## Package");
  lines.push("");
  lines.push("- npm: https://www.npmjs.com/package/@sinups/ai-kit");
  lines.push("- Source: https://github.com/sinups/ai-kit");
  lines.push("");
  lines.push("## Full docs");
  lines.push("");
  lines.push(`- [llms-full.txt](${SITE_URL}/llms-full.txt): every docs page in a single file.`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
