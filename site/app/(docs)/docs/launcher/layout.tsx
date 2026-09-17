import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Embedding the launcher",
  description:
    "Embed a floating chat launcher in a React app or on any page with mountChatLauncher and Shadow DOM isolation.",
  path: "/docs/launcher",
});

export default function LauncherLayout({ children }: { children: React.ReactNode }) {
  return children;
}
