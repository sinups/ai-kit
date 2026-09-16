export const dynamic = "force-static";

import { generateAgentElementsOg } from "@/lib/og";

export const alt = "Use cases - AI UI Kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return generateAgentElementsOg({
    title: "Use cases",
    description:
      "Realistic agent scenarios built with AI UI Kit - coding agents, support workflows, widget chats, and engineering plans.",
    section: "use-cases",
    eyebrow: "USE CASE",
  });
}
