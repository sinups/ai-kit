import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "What you can build",
  description:
    "Live recipes built from AI UI Kit components: full-page chat, chat with a history sidebar, chat with an inspector, a settings screen, an embedded widget and an onboarding wizard.",
  path: "/docs/what-you-can-build",
});

export default function WhatYouCanBuildLayout({ children }: { children: React.ReactNode }) {
  return children;
}
