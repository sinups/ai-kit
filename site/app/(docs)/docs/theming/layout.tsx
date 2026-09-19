import { buildPageMetadata } from "@/app/utils/page-metadata";

export const metadata = buildPageMetadata({
  title: "Theming",
  description:
    "Theme the kit with AiKitProvider: accent, radius, density and color scheme, a customizer panel, --ae-* tokens and a host MantineProvider.",
  path: "/docs/theming",
});

export default function ThemingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
