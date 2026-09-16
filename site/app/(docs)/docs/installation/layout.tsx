import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Installation",
  description:
    "Install AI UI Kit from npm. Prerequisites, stylesheet and provider setup, and your first usage snippet.",
  path: "/docs/installation",
  keywords: [
    "@sinups/ai-kit install",
    "Mantine AI components install",
    "React agent UI setup",
    "Next.js AI chat install",
  ],
});

export default function InstallationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
