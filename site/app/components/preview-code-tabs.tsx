"use client";

import { useCallback, useState, type ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { CheckIcon, CopyIcon } from "@/app/components/docs-code-icons";
import { cn } from "@/lib/utils";

type PreviewCodeTabsProps = {
  preview: ReactNode;
  code: ReactNode;
  /** Raw code string used for the copy button. */
  codeText?: string;
  /** Height of the content area. Defaults to 450px. */
  height?: string;
  /** Vertical alignment inside the preview pane. */
  align?: "start" | "center" | "end";
  /** Extra classes for the outer wrapper. */
  className?: string;
  /** Extra classes for the preview pane (eg. remove padding for full-bleed chats). */
  previewClassName?: string;
};

export function PreviewCodeTabs({
  preview,
  code,
  codeText,
  height = "450px",
  align = "center",
  className,
  previewClassName,
}: PreviewCodeTabsProps) {
  const [value, setValue] = useState<"preview" | "code">("preview");

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 [&_[data-slot=preview]]:w-full",
        className,
      )}
    >
      <Tabs.Root
        value={value}
        onValueChange={(v) => setValue(v as "preview" | "code")}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center justify-between">
          <Tabs.List
            data-slot="tabs-list"
            className="relative z-0 flex w-fit items-center justify-center gap-x-0.5 rounded-lg bg-transparent p-0 text-muted-foreground/70"
          >
            <Tabs.Tab
              value="preview"
              data-slot="tabs-tab"
              className="relative flex h-8 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-2.5 text-sm font-medium text-muted-foreground/70 outline-none transition-[color] hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active]:text-foreground"
            >
              Preview
            </Tabs.Tab>
            <Tabs.Tab
              value="code"
              data-slot="tabs-tab"
              className="relative flex h-8 shrink-0 grow cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-transparent px-2.5 text-sm font-medium text-muted-foreground/70 outline-none transition-[color] hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active]:text-foreground"
            >
              Code
            </Tabs.Tab>
            <Tabs.Indicator
              data-slot="tab-indicator"
              className="absolute bottom-0 left-0 -z-10 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left) rounded-md bg-background shadow-xs shadow-black/5 ring-1 ring-doc-border/60 transition-[width,translate] duration-200 ease-in-out dark:bg-white/10 dark:ring-white/10"
            />
          </Tabs.List>
        </div>

        <div
          className="relative rounded-lg overflow-hidden bg-doc-surface shadow-xs shadow-black/[0.03] ring-1 ring-doc-border/70 dark:ring-white/8"
          data-tab={value}
        >
          <Tabs.Panel value="preview" data-slot="preview-panel">
            <div
              data-align={align}
              style={{ height }}
              className={cn(
                "flex w-full justify-center overflow-auto p-10 data-[align=start]:items-start data-[align=center]:items-center data-[align=end]:items-end max-sm:px-6",
                previewClassName,
              )}
            >
              <div data-slot="preview" className="w-full">
                {preview}
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="code" data-slot="code-panel">
            <div className="relative">
              {codeText && <CopyButton code={codeText} />}
              <div
                style={{ height }}
                className="overflow-y-auto [&_pre]:!bg-transparent [&_pre]:!m-0 [&_pre]:min-h-full"
              >
                {code}
              </div>
            </div>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </div>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => {});
  }, [code]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy code"}
      className="absolute top-1.5 right-1.5 z-10 inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground/80 opacity-70 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10 hover:opacity-100 focus-visible:opacity-100 transition-opacity"
    >
      <div className="relative size-4">
        <CopyIcon
          className={cn(
            "absolute inset-0 size-4 transition-[opacity,transform] duration-200 ease-out",
            copied ? "opacity-0 scale-50" : "opacity-100 scale-100",
          )}
        />
        <CheckIcon
          className={cn(
            "absolute inset-0 size-4 transition-[opacity,transform] duration-200 ease-out",
            copied ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </div>
    </button>
  );
}
