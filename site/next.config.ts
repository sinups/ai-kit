import type { NextConfig } from "next";

/**
 * The docs site is exported as static HTML so it can be served from GitHub Pages.
 * NEXT_PUBLIC_BASE_PATH is the repository sub-path on Pages (for example "/ai-kit"),
 * NEXT_PUBLIC_SITE_URL is the public origin used for canonical links, sitemap and llms.txt.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
