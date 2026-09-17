import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Bundle size",
  description:
    "How much JavaScript and CSS each AI UI Kit component adds to your app, gzip, with per-component stylesheets and tree-shaking.",
  path: "/docs/bundle-size",
  keywords: ["AI UI Kit bundle size", "tree-shaking", "per-component CSS", "Mantine styles"],
});

export default function BundleSizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
