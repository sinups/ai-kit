import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/components/theme-provider";
import { SearchProvider } from "@/app/components/search-context";
import { SearchModal } from "@/app/components/search-modal";
import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";
import "./globals.css";
import { MantineThemeProvider } from "@/app/components/mantine-provider";
import { REPO_URL, UPSTREAM_URL } from "@/app/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { SITE_URL } from "@/app/lib/site";
const SITE_NAME = "AI UI Kit";
const SITE_TITLE = "AI UI Kit - Agent chat UI for Mantine apps";
const SITE_DESCRIPTION =
  "Open-source React components for coding-agent-style agent UIs, built on Mantine. Chat, tool calls, diffs, plans, approvals, clarifying questions and streaming states - drop-in for the Vercel AI SDK, MCP and any LLM app.";

const KEYWORDS = [
  "agent UI",
  "agent UI components",
  "agent chat UI",
  "AI agent components",
  "AI UI Kit",
  "@sinups/ai-kit",
  "Mantine",
  "Mantine extension",
  "Mantine AI components",
  "Mantine chat components",
  "React agent UI",
  "React AI components",
  "Next.js agent UI",
  "Vercel AI SDK",
  "AI SDK UIMessage",
  "Agent CLI UI",
  "agent tool call UI",
  "tool approval UI",
  "clarifying question UI",
  "agent plan UI",
  "MCP tool UI",
  "diff viewer React",
  "streaming markdown React",
  "Agent Elements port",
];

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: KEYWORDS,
  authors: [{ name: "Sinups", url: REPO_URL }],
  creator: "Sinups",
  publisher: "Sinups",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  alternates: {
    canonical: "/",
    languages: { "en-US": "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  classification: "Developer Tools, React UI Library, AI Components",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": SITE_NAME,
    "mobile-web-app-capable": "yes",
  },
};

const SOFTWARE_APPLICATION_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE_NAME,
  alternateName: ["@sinups/ai-kit"],
  applicationCategory: "DeveloperApplication",
  applicationSubCategory: "React UI Component Library",
  operatingSystem: "Any (Node.js, Browser)",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  license: "MIT",
  isBasedOn: UPSTREAM_URL,
  programmingLanguage: ["TypeScript", "JavaScript", "React", "TSX"],
  runtimePlatform: ["Node.js", "Next.js", "React 19", "Mantine"],
  keywords: KEYWORDS.join(", "),
  image: `${SITE_URL}/opengraph-image`,
  author: { "@type": "Person", name: "Sinups", url: REPO_URL },
  potentialAction: {
    "@type": "ViewAction",
    target: `${SITE_URL}/docs`,
    name: "Read documentation",
  },
};

const WEBSITE_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-US",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/docs?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(SOFTWARE_APPLICATION_LD),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_LD) }}
        />
      </head>
      <body className="antialiased bg-doc-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <MantineThemeProvider>
            <SearchProvider>
              {children}
              <SearchModal />
            </SearchProvider>
          </MantineThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
