import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "MCP",
  description:
    "Use AI UI Kit docs from your AI assistant via the Model Context Protocol. Configure Cursor, Claude Code, or any MCP client to read the component catalog and examples.",
  path: "/docs/mcp",
  keywords: [
    "AI UI Kit MCP",
    "llms.txt",
    "Cursor MCP",
    "Claude Code MCP",
    "Model Context Protocol",
    "AI assistant components",
  ],
});

export default function McpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
