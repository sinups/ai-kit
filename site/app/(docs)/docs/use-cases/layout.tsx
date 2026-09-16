import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Use cases",
  description:
    "Realistic agent scenarios built with AI UI Kit: Claude Code-style coding agents with plans and diffs, internal support workflows that issue refunds, lightweight support chat widgets, and engineering rollout plans with tool calls.",
  path: "/docs/use-cases",
  keywords: [
    "coding agent UI",
    "Claude Code example",
    "customer support agent UI",
    "support chat widget",
    "engineering plan UI",
    "AI agent workflow examples",
    "LLM coding agent example",
    "MCP agent example",
  ],
});

export default function UseCasesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
