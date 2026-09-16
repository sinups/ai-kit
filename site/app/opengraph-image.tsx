export const dynamic = "force-static";

import { generateAgentElementsOg } from "@/lib/og";

export const alt = "AI UI Kit - Agent chat UI for Mantine apps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return generateAgentElementsOg({
    title: "Build agent UIs faster",
    description:
      "Open-source React components for Claude Code-style agent UIs. Chat, tool calls, plans, approvals, and live terminal output.",
    eyebrow: "DOCUMENTATION",
  });
}
