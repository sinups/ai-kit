"use client";

import type { ReactNode } from "react";
import {
  type CardAlign,
  COMPONENT_SHOWCASES,
  type ComponentShowcase,
} from "@/app/data/component-showcase";
import { cn } from "@/lib/utils";

type ShowcaseCardProps = {
  showcase: ComponentShowcase | undefined;
  align?: CardAlign;
  pad?: string;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
};

const alignClassByType: Record<CardAlign, string> = {
  stretch: "",
  bottom: "flex flex-col items-end justify-center",
  center: "flex flex-col items-center justify-center",
};

function ShowcaseCard({
  showcase,
  align,
  pad,
  className,
  contentClassName,
  children,
}: ShowcaseCardProps) {
  if (!showcase) {
    return null;
  }

  return (
    <div
      className={cn(
        "overflow-hidden bg-background relative flex h-full border border-border",
        className,
      )}
    >
      <div
        className={cn(
          // No --an-max-width override here — let the default (420px) from
          // package styles apply so tools (Bash/Edit/Search/Plan/etc.) render at
          // chat proportions on the landing, matching the docs pages.
          "w-full flex-1 min-h-0",
          pad ?? showcase.pad ?? "p-4",
          alignClassByType[align ?? showcase.align ?? "center"],
          cn(showcase.contentClassName, contentClassName),
        )}
      >
        {children ?? showcase.node}
      </div>
    </div>
  );
}

export function ShowcaseGrid() {
  const showcases = COMPONENT_SHOWCASES;
  const get = (name: string) =>
    showcases.find((component) => component.name === name);

  const rowSplit2 =
    "grid grid-cols-1 items-stretch *:border-dashed *:border-border/60 [&>*:not(:first-child)]:border-t lg:grid-cols-2 lg:[&>*:not(:first-child)]:border-t-0 lg:[&>*:nth-child(2n)]:border-l";
  const rowSplit3 =
    "grid grid-cols-1 items-stretch *:border-dashed *:border-border/60 [&>*:not(:first-child)]:border-t lg:grid-cols-3 lg:[&>*:not(:first-child)]:border-t-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n+3)]:border-l";
  const stackSplit =
    "flex h-full flex-col *:border-dashed *:border-border/60 [&>*:not(:first-child)]:border-t";

  return (
    <div className="w-full border border-dashed flex flex-col *:border-dashed *:border-border/60 [&>*:not(:first-child)]:border-t">
      <div className={rowSplit2}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard showcase={get("MessageList")} className="h-[400px]" />
        </div>
        <div className="h-full w-full">
          <div className={stackSplit}>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard
                showcase={get("SpiralLoader")}
                className="flex-1"
                contentClassName="items-start"
                align="center"
              />
            </div>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard
                showcase={get("ThinkingTool")}
                className="flex-1"
                align="center"
              />
            </div>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard
                showcase={get("GenericTool")}
                className="flex-1"
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={rowSplit2}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard showcase={get("Markdown")} className="h-[400px]" />
        </div>
        <div className="h-full w-full">
          <div className={stackSplit}>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard showcase={get("InputBar")} className="flex-1" />
            </div>
          </div>
        </div>
      </div>
      <div className={rowSplit2}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard
            showcase={get("EditTool")}
            className="h-[400px]"
            align="center"
          />
        </div>
        <div className="h-full w-full p-1.5">
          <div className={stackSplit}>
            <div className="h-full w-full">
              <ShowcaseCard
                showcase={get("BashTool")}
                className="flex-1"
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={rowSplit3}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard
            showcase={get("ToolGroup")}
            className="h-[400px]"
            align="center"
          />
        </div>
        <div className="h-full w-full p-1.5">
          <div className={stackSplit}>
            <div className="h-full w-full">
              <ShowcaseCard
                showcase={get("TodoTool")}
                className="flex-1"
                align="center"
              />
            </div>
          </div>
        </div>
        <div className="h-full w-full p-1.5">
          <div className={stackSplit}>
            <div className="h-full w-full">
              <ShowcaseCard
                showcase={get("PlanTool")}
                className="flex-1"
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={rowSplit2}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard
            showcase={get("SearchTool")}
            className="h-[400px]"
            align="center"
          />
        </div>
        <div className="h-full w-full p-1.5">
          <div className={stackSplit}>
            <div className="h-full w-full">
              <ShowcaseCard
                showcase={get("ToolGroup")}
                className="flex-1"
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={rowSplit2}>
        <div className="h-full w-full p-1.5">
          <ShowcaseCard
            showcase={get("McpTool")}
            className="h-[400px]"
            contentClassName="[&>div]:w-full [&>div]:max-w-an [&>div]:mx-auto"
            align="center"
          />
        </div>
        <div className="h-full w-full">
          <div className={stackSplit}>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard
                showcase={get("QuestionTool")}
                className="flex-1"
                contentClassName="[&>div]:w-full [&>div]:max-w-an [&>div]:mx-auto"
                align="center"
              />
            </div>
            <div className="h-full w-full p-1.5">
              <ShowcaseCard
                showcase={get("FileAttachment")}
                className="flex-1"
                contentClassName="[&>div]:w-full [&>div]:max-w-an [&>div]:mx-auto"
                align="center"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
