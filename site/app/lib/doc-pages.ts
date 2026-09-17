import type { Metadata } from "next";
import { COMPONENT_DOCS } from "@/app/data/component-docs";
import { metadata as architecture } from "@/app/(docs)/docs/architecture/layout";
import { metadata as installation } from "@/app/(docs)/docs/installation/layout";
import { metadata as launcher } from "@/app/(docs)/docs/launcher/layout";
import { metadata as layouts } from "@/app/(docs)/docs/layouts/layout";
import { metadata as mcp } from "@/app/(docs)/docs/mcp/layout";
import { metadata as skills } from "@/app/(docs)/docs/skills/layout";
import { metadata as theming } from "@/app/(docs)/docs/theming/layout";
import { metadata as useCases } from "@/app/(docs)/docs/use-cases/layout";
import { metadata as utilities } from "@/app/(docs)/docs/utilities/layout";
import { metadata as whatYouCanBuild } from "@/app/(docs)/docs/what-you-can-build/layout";
import { metadata as whatsNew } from "@/app/(docs)/docs/whats-new/layout";

export const INTRODUCTION_DESCRIPTION =
  "AI UI Kit is an open-source UI kit for agent products built on Mantine: the chat, tool cards and composer, and the screens around them (settings, MCP servers, agents, skills, permissions, hooks, memory, sessions, background tasks, diff review), plus a theme provider and an embeddable launcher.";

const describe = (metadata: Metadata) => String(metadata.description ?? "");

/** Descriptions of the non-component pages, taken from the metadata each page publishes */
export const DOC_PAGE_DESCRIPTIONS: Record<string, string> = {
  "/docs": INTRODUCTION_DESCRIPTION,
  "/docs/installation": describe(installation),
  "/docs/architecture": describe(architecture),
  "/docs/use-cases": describe(useCases),
  "/docs/mcp": describe(mcp),
  "/docs/skills": describe(skills),
  "/docs/what-you-can-build": describe(whatYouCanBuild),
  "/docs/theming": describe(theming),
  "/docs/layouts": describe(layouts),
  "/docs/launcher": describe(launcher),
  "/docs/whats-new": describe(whatsNew),
  "/docs/utilities": describe(utilities),
};

/** First sentence of a component's usage text, without Markdown links */
export function summarizeUsage(name: string): string {
  const usage = COMPONENT_DOCS.find((doc) => doc.name === name)?.blocks?.find(
    (block) => block.type === "usage",
  );
  if (!usage || usage.type !== "usage") return "";
  const text = usage.content.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  const match = /^(.+?[.!?])(\s|$)/.exec(text);
  return match?.[1] ?? text;
}
