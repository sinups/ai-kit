"use client";

import { WorkspacePreview } from "./workspace-preview";
import { useNearViewport } from "./use-near-viewport";
import classes from "./landing.module.css";

export function ProductPreview() {
  const [ref, near] = useNearViewport<HTMLElement>();

  return (
    <figure
      ref={ref}
      aria-label="Live preview of an agent workspace built from AI UI Kit components"
      className={`${classes.frame} relative h-[600px] overflow-hidden rounded-2xl border border-border bg-background sm:h-[680px] lg:h-[720px]`}
    >
      {near ? <WorkspacePreview /> : <div className="size-full animate-pulse bg-muted/40" />}
    </figure>
  );
}
