import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Architecture",
  description:
    "How AI UI Kit is organized: layers, the controlled component contract, async actions, data states, width-adaptive layout, and the primitives every domain module is built from.",
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
