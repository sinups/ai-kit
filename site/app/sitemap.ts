export const dynamic = "force-static";

import { execFileSync } from "node:child_process";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getPrimarySourcePath } from "@/app/lib/component-source";
import { seoPages } from "@/app/lib/seo";
import { SITE_URL } from "@/app/lib/site";

const REPO_ROOT = path.resolve(process.cwd(), "..");

/** Date of the last commit per repository file; empty outside a git checkout */
function commitDates(): Map<string, Date> {
  const dates = new Map<string, Date>();
  try {
    const log = execFileSync("git", ["log", "--format=@%cI", "--name-only", "--", "package/src", "site/app"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    let current: Date | undefined;
    for (const line of log.split("\n")) {
      if (line.startsWith("@")) current = new Date(line.slice(1));
      else if (line && current && !dates.has(line)) dates.set(line, current);
    }
  } catch {}
  return dates;
}

function sourceFile(id: string, pagePath: string): string {
  if (!pagePath) return "site/app/page.tsx";
  const primary = getPrimarySourcePath(id);
  if (primary) return `package/src/${primary}`;
  return pagePath === "/docs" ? "site/app/(docs)/docs/page.tsx" : `site/app/(docs)${pagePath}/page.tsx`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const dates = commitDates();
  const pages: MetadataRoute.Sitemap = seoPages().map((page) => ({
    url: `${SITE_URL}${page.path}/`,
    lastModified: dates.get(sourceFile(page.id, page.path)) ?? now,
    changeFrequency: "weekly",
    priority: page.path === "" ? 1 : page.component ? 0.7 : 0.9,
  }));
  const files: MetadataRoute.Sitemap = ["llms.txt", "llms-full.txt", "skills/ai-kit/SKILL.md"].map((file) => ({
    url: `${SITE_URL}/${file}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
  return [...pages, ...files];
}
