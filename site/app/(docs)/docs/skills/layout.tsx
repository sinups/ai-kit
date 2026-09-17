import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Skills",
  description:
    "Give AI coding assistants project-aware context about AI UI Kit so they install, compose, and customise components using the right APIs and patterns.",
  path: "/docs/skills",
  keywords: [
    "AI UI Kit skill",
    "Agent CLI skill",
    "coding assistant skill",
    "AI coding agent",
    "project context",
  ],
});

export default function SkillsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
