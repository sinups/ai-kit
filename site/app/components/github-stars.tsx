"use client";

import { useEffect, useState } from "react";

const REPO = "sinups/ai-kit";

/** Star count as a short label (`12`, `1.2k`), `null` while loading, on error or at zero stars */
export function useGitHubStars(): string | null {
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    // The repository API answers 403 once the anonymous rate limit is spent, which logs a console error on every page; the badge service caches the count.
    fetch(`https://img.shields.io/github/stars/${REPO}.json`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const message = typeof data?.message === "string" ? data.message : "";
        if (/^[\d.]+k?$/.test(message) && message !== "0") {
          setStars(message);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  return stars;
}

export function GitHubStars({ className }: { className?: string }) {
  const stars = useGitHubStars();
  if (stars === null) return null;
  return <span className={className}>{stars}</span>;
}
