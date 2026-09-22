import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Widget builder",
  description:
    "Build the embed script for the chat widget: position, color, size, opening timer, actions and notifications, with the config ready to paste.",
  path: "/docs/widget",
});

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
