export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/app/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI UI Kit - Agent chat UI for Mantine apps",
    short_name: "AI UI Kit",
    description:
      "Open-source React components for coding-agent-style agent UIs, built on Mantine. Chat, tool calls, plans, approvals, and clarifying questions - built for the Vercel AI SDK and MCP.",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0a0a0a",
    orientation: "portrait",
    categories: ["developer", "productivity", "utilities"],
    lang: "en-US",
    icons: [
      {
        src: `${BASE_PATH}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
