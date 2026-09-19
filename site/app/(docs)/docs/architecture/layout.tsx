import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Architecture",
  description:
    "How AI UI Kit is organized: layers, controlled components, async actions, data states, width-adaptive layout and the shared primitives.",
  path: "/docs/architecture",
  keywords: [
    "AI UI Kit architecture",
    "Mantine component contract",
    "controlled React components",
    "agent UI primitives",
  ],
});

export default function ArchitectureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
