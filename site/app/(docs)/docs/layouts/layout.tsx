import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Layouts",
  description:
    "Compose full-page chat, chat with a history sidebar, chat with an inspector, settings pages and an embedded widget from kit components.",
  path: "/docs/layouts",
});

export default function LayoutsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
