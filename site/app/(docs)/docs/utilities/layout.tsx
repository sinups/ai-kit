import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Hooks and utilities",
  description:
    "Every hook and pure function exported by @sinups/ai-kit, grouped by module, with signatures.",
  path: "/docs/utilities",
});

export default function UtilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
