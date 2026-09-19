export const dynamic = "force-static";

import type { MetadataRoute } from "next";
import { BASE_PATH } from "@/app/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AI UI Kit — React agent UI kit for Mantine",
    short_name: "AI UI Kit",
    description:
      "Open-source React UI kit for agent products, built on Mantine 9: agent chat, tool calls and approvals, MCP, settings, sessions and diff review.",
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
