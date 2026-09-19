import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/app/components/theme-provider";
import { SearchProvider } from "@/app/components/search-context";
import { SearchModal } from "@/app/components/search-modal";
import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";
import "./globals.css";
import { MantineThemeProvider } from "@/app/components/mantine-provider";
import { REPO_URL, SITE_NAME, SITE_URL, ogImageUrl } from "@/app/lib/site";
import { SITE_DESCRIPTION } from "@/app/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_TITLE = "AI UI Kit — React agent UI kit for Mantine";

const KEYWORDS = [
  "AI UI Kit",
  "@sinups/ai-kit",
  "agent UI kit",
  "React AI chat components",
  "Mantine chat UI",
  "Mantine AI components",
  "MCP tool call UI",
  "tool approval UI",
  "streaming markdown chat",
  "AI SDK useChat UI",
  "Vercel AI SDK",
  "agent chat UI",
  "React agent UI",
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
    template: `%s — ${SITE_NAME}`,
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
    types: { "text/plain": `${SITE_URL}/llms.txt` },
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
        url: ogImageUrl("home"),
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
    images: [ogImageUrl("home")],
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
  classification: "Developer Tools, React UI Library",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": SITE_NAME,
    "mobile-web-app-capable": "yes",
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
