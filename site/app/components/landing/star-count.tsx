"use client";

import { IconStarFilled } from "@tabler/icons-react";
import { useGitHubStars } from "@/app/components/github-stars";

export function StarCount() {
  const stars = useGitHubStars();

  if (stars === null) return null;

  return (
    <span className="flex items-center gap-1 border-l border-border pl-2 tabular-nums text-muted-foreground">
      <IconStarFilled className="size-3" aria-hidden="true" />
      {stars}
    </span>
  );
}
