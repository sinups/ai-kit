import type { Metadata } from "next";

const BASE_KEYWORDS = [
  "AI UI Kit",
  "@sinups/ai-kit",
  "Mantine",
  "agent UI",
  "React agent UI",
  "Agent CLI UI",
  "Vercel AI SDK",
  "AI SDK UI",
];

export function buildPageMetadata({
  title,
  description,
  path,
  type = "article",
  keywords,
  publishedTime,
}: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
}): Metadata {
  const fullTitle = `${title} · AI UI Kit`;
  const mergedKeywords = Array.from(
    new Set([...BASE_KEYWORDS, ...(keywords ?? [])]),
  );
  return {
    title,
    description,
    keywords: mergedKeywords,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      type,
      siteName: "AI UI Kit",
      locale: "en_US",
      ...(publishedTime && type === "article" ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}
