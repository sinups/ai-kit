import type { Metadata } from "next";
import { SITE_NAME, SITE_URL, markdownPageUrl, ogImageUrl } from "@/app/lib/site";

const BASE_KEYWORDS = [
  "AI UI Kit",
  "@sinups/ai-kit",
  "Mantine",
  "agent UI kit",
  "React AI chat components",
  "Mantine chat UI",
  "Vercel AI SDK",
];

export function buildPageMetadata({
  title,
  description,
  path,
  type = "article",
  keywords,
  publishedTime,
  markdown = false,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
  /** The page has a Markdown copy at `<path>/index.md` */
  markdown?: boolean;
}): Metadata {
  const fullTitle = `${title} — ${SITE_NAME}`;
  const mergedKeywords = Array.from(
    new Set([...BASE_KEYWORDS, ...(keywords ?? [])]),
  );
  const image = {
    url: ogImageUrl(path === "/docs" ? "docs" : path.split("/").pop() || "home"),
    width: 1200,
    height: 630,
    alt: fullTitle,
    type: "image/png",
  };
  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: {
      canonical: path,
      types: {
        ...(markdown ? { "text/markdown": markdownPageUrl(path) } : {}),
        "text/plain": `${SITE_URL}/llms.txt`,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type,
      siteName: SITE_NAME,
      locale: "en_US",
      images: [image],
      ...(publishedTime && type === "article" ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image.url],
    },
  };
}
