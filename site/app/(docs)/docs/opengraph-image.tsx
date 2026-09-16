export const dynamic = "force-static";

import { generateAgentElementsOg } from "@/lib/og";

export const alt = "Getting Started - AI UI Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return generateAgentElementsOg({
    title: "Getting Started",
    description:
      "Install AI UI Kit, import the styles, and drop AgentChat or InputBar into your app.",
    section: "docs",
    eyebrow: "GETTING STARTED",
  });
}
