import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";
import { DOC_PAGE_DESCRIPTIONS, INTRODUCTION_DESCRIPTION, summarizeUsage } from "@/app/lib/doc-pages";
import { INSTALL_COMMAND, PACKAGE_VERSION, PEER_DEPENDENCIES } from "@/app/lib/package-info";
import { PACKAGE_NAME, REPO_URL, SITE_URL, UPSTREAM_NAME } from "@/app/lib/site";

export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [];

  lines.push("# AI UI Kit");
  lines.push("");
  lines.push(`> ${INTRODUCTION_DESCRIPTION}`);
  lines.push("");
  lines.push(`- Package: \`${PACKAGE_NAME}\` ${PACKAGE_VERSION}`);
  lines.push(`- Install: \`${INSTALL_COMMAND}\``);
  lines.push(`- Peer dependencies: ${PEER_DEPENDENCIES.map((peer) => `\`${peer.name}\` ${peer.range}`).join(", ")}`);
  lines.push("- Styles: import `@mantine/core/styles.css` and `@sinups/ai-kit/styles.css` once at the app root.");
  lines.push(`- Full docs in one file: ${SITE_URL}/llms-full.txt`);
  lines.push("");
  lines.push("## Transcript options");
  lines.push("");
  lines.push("- `presentation`: `'cards'` (default), `rowsPresentation` or `quietPresentation`, imported from the package root.");
  lines.push("- `approvals` on `AgentChat`, or `ToolApprovalsProvider` around a standalone `MessageList`: Allow/Deny under any tool call by `toolCallId`.");
  lines.push("- `labels` by component section on `AgentChat`, or `ChatLabelsProvider` around a standalone `MessageList`.");
  lines.push("- `toolCatalog`, `toolArgs`, `toolOutputs`, `locale`: readable titles, arguments and results of MCP calls.");
  lines.push("- `workingRow`, `toolActivity`, `animateAppearance`, `frameBatched`: on by default in `AgentChat`, off in `MessageList`; `evenSpacing` off in both.");
  lines.push("- `InputBar` `contextItems`, `onRemoveContext`, `onRestoreContext`; `ModeSelector` `labels.title`, mode `badge`, `shortcuts`.");
  lines.push("");

  for (const section of SIDEBAR_SECTIONS) {
    lines.push(`## ${section.title}`);
    lines.push("");
    for (const item of section.items) {
      const description = section.components
        ? summarizeUsage(item.label)
        : (DOC_PAGE_DESCRIPTIONS[item.href] ?? "");
      lines.push(`- [${item.label}](${SITE_URL}${item.href})${description ? `: ${description}` : ""}`);
    }
    lines.push("");
  }

  lines.push("## Source");
  lines.push("");
  lines.push(`- npm: https://www.npmjs.com/package/${PACKAGE_NAME}`);
  lines.push(`- Repository: ${REPO_URL}`);
  lines.push(`- A fork of ${UPSTREAM_NAME} by 21st.dev (MIT).`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
