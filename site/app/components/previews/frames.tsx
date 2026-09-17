"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const noop = () => {};

export const wait = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** A 360px column that stands in for a side widget */
export function NarrowFrame({
  children,
  height,
  className,
}: {
  children: ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-[360px] max-w-full overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
      style={height ? { height } : undefined}
    >
      {children}
    </div>
  );
}

/** A full-width card that stands in for a settings page */
export function WideFrame({
  children,
  height,
  className,
}: {
  children: ReactNode;
  height?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-lg border border-border bg-background",
        className,
      )}
      style={height ? { height } : undefined}
    >
      {children}
    </div>
  );
}

export function ResultBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) return null;
  return (
    <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
      {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

const subscribeNever = () => () => {};

/** Renders children only in the browser: previews show relative times and countdowns that differ between the static build and the visit */
export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  return mounted ? <>{children}</> : null;
}
