import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "What you can build",
  description:
    "Live recipes from AI UI Kit: full-page chat, chat with history or an inspector, a settings screen, an embedded widget and an onboarding wizard.",
  path: "/docs/what-you-can-build",
});

export default function WhatYouCanBuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
