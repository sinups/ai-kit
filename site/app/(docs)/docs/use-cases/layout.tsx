import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Use cases",
  description:
    "Agent scenarios built with AI UI Kit: a coding agent with plans and diffs, a support workflow that issues refunds, a chat widget and a rollout plan.",
  path: "/docs/use-cases",
  keywords: [
    "coding agent UI",
    "Agent CLI example",
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
