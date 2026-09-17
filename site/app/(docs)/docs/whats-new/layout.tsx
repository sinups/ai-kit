import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "What's new",
  description:
    "Components, props, theming and testing infrastructure added in this release, and the deprecated AgentChat emptySuggestionsPosition prop.",
  path: "/docs/whats-new",
});

export default function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
