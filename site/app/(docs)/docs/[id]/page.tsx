import type { Metadata } from "next";
import { getComponentProps } from "@/app/components/[id]/api-reference";
import {
  COMPONENT_DOCS,
  buildComponentBlocks,
  type ComponentTextBlock,
  componentIdFromName,
} from "@/app/data/component-docs";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { ComponentPreview } from "@/app/components/component-preview";

/**
 * Per-component overrides for the detail preview pane height.
 * Small widgets (pickers, buttons) don't need the default 450px canvas.
 * Keys are normalized component ids (kebab-case).
 */
const PREVIEW_HEIGHTS: Record<string, string> = {
  "model-picker": "140px",
  "mode-selector": "140px",
  "send-button": "140px",
  "attachment-button": "140px",
  "spiral-loader": "140px",
  "text-shimmer": "140px",
};

/**
 * Component ids whose preview should be horizontally centered rather than
 * stretched to fill the pane. Use for small widgets that read as a single
 * control (buttons, pickers, loaders). Tool components stay left-aligned
 * because that matches how they render in the transcript.
 */
const COMPACT_PREVIEW_IDS = new Set<string>([
  "send-button",
  "attachment-button",
  "model-picker",
  "mode-selector",
  "spiral-loader",
  "text-shimmer",
  "file-attachment",
]);

/**
 * Component ids whose preview should render edge-to-edge (no pane padding).
 * Use for chat-style components whose internal scroll should span the full
 * preview card.
 */
const FULLBLEED_PREVIEW_IDS = new Set<string>([
  "message-list",
  "agent-chat",
]);

/**
 * Per-example height overrides keyed by previewId. Use when a specific
 * example needs more room than its parent component's compact height
 * (e.g. a picker docs page is compact, but its "Inside InputBar" example
 * embeds a full composer).
 */
const EXAMPLE_HEIGHTS: Record<string, string> = {
  "ModelPicker/in-input-bar": "220px",
  "ModeSelector/in-input-bar": "220px",
  "FileAttachment/basic": "220px",
  "FileAttachment/image": "220px",
  "FileAttachment/removable": "220px",
};

/**
 * Example previewIds that should render full-width (not compact-centered)
 * even when the parent doc page is compact. Use for examples that embed a
 * full composer or a wide layout inside a compact page.
 */
const FULLWIDTH_EXAMPLE_IDS = new Set<string>([
  "ModelPicker/in-input-bar",
  "ModeSelector/in-input-bar",
]);

/**
 * Component ids whose preview should be constrained to the chat column
 * width (matches InputBar's max-w-an). Use for tool renderers and message
 * bubbles so they read as they would inline in a transcript.
 */
const CHAT_WIDTH_PREVIEW_IDS = new Set<string>([
  "bash-tool",
  "edit-tool",
  "search-tool",
  "todo-tool",
  "plan-tool",
  "question-tool",
  "tool-group",
  "subagent-tool",
  "mcp-tool",
  "thinking-tool",
  "generic-tool",
  "error-message",
  "user-message",
]);
import { ComponentExamplePreview } from "@/app/components/component-example-preview";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { PreviewCodeTabs } from "@/app/components/preview-code-tabs";
import { buildExampleSource } from "@/app/lib/wrap-example-code";
import { ComponentSource } from "@/app/components/component-source";
import { CliCommands } from "@/app/components/cli-commands";
import { getPrimarySourcePath } from "@/app/lib/component-source";
import { Markdown } from "@sinups/ai-kit";
import { buildPageMetadata } from "@/app/utils/page-metadata";
import { getComponentSeo } from "@/app/utils/component-seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENT_DOCS.map((item) => ({ id: componentIdFromName(item.name) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const rawId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;
  const normalizedId = (rawId ?? "").toLowerCase();
  const component = COMPONENT_DOCS.find(
    (item) => componentIdFromName(item.name) === normalizedId,
  );
  if (!component) {
    return {
      title: "Component not found",
      robots: { index: false, follow: false },
    };
  }
  const seo = getComponentSeo(component.name);
  return buildPageMetadata({
    title: component.name,
    description: seo.description,
    keywords: seo.keywords,
    path: `/docs/${componentIdFromName(component.name)}`,
  });
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ id: string | string[] }>;
}) {
  const resolvedParams = await params;
  const rawId = Array.isArray(resolvedParams.id)
    ? resolvedParams.id[0]
    : resolvedParams.id;
  const normalizedId = (rawId ?? "").toLowerCase();
  const component = COMPONENT_DOCS.find((item) => {
    const base = componentIdFromName(item.name);
    return base === normalizedId;
  });
  const blocks = component
    ? (component.blocks ?? buildComponentBlocks(component.name))
    : [];
  const codeBlock = blocks.find(
    (block): block is ComponentTextBlock => block.type === "code",
  );
  const usageBlock = blocks.find(
    (block): block is ComponentTextBlock => block.type === "usage",
  );
  const exampleBlocks = blocks.filter((block) => block.type === "example");
  const exampleSections = exampleBlocks.map((block) => ({
    id: `example-${componentIdFromName(block.title)}`,
    label: block.title,
  }));

  if (!component) {
    return (
      <div className="flex flex-col gap-3 max-w-3xl">
        <h1 className="text-2xl font-medium text-an-foreground">
          Component not found
        </h1>
        <p className="text-base text-muted-foreground">
          No component matches the requested id.
        </p>
      </div>
    );
  }

  const apiProps = getComponentProps(component.name);
  const docItems = COMPONENT_DOCS.map((item) => ({
    label: item.name,
    href: `/docs/${componentIdFromName(item.name)}`,
  }));
  const currentHref = `/docs/${componentIdFromName(component.name)}`;
  const currentIndex = docItems.findIndex((item) => item.href === currentHref);
  const previousHref =
    currentIndex > 0 ? docItems[currentIndex - 1]?.href : undefined;
  const nextHref =
    currentIndex >= 0 ? docItems[currentIndex + 1]?.href : undefined;
  const resolvedPreviousHref = previousHref;
  const description = getComponentDescription(
    component.name,
    usageBlock?.content,
  );
  const hasSource = Boolean(getPrimarySourcePath(normalizedId));
  const sections = [
    { id: "overview", label: component.name },
    { id: "installation", label: "Getting Started" },
    ...(exampleBlocks.length > 0
      ? [{ id: "examples", label: "Examples", children: exampleSections }]
      : []),
    ...(hasSource ? [{ id: "source", label: "Source" }] : []),
    ...(apiProps && apiProps.length > 0
      ? [{ id: "api", label: "API reference" }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl px-0 sm:px-4 lg:px-8 py-8 sm:py-10 lg:py-12 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-y-8 xl:gap-y-10 gap-x-14">
      <div className="order-2 xl:order-1 flex flex-col gap-10 min-w-0">
        <div id="overview" className="space-y-2 scroll-mt-8">
          <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="text-2xl font-medium text-an-foreground">
              {component.name}
            </h1>
            <DocNavButton
              title={component.name}
              description={description}
              code={codeBlock?.content}
              usage={usageBlock?.content}
              examples={exampleBlocks.map((block) => ({
                title: block.title,
                code: block.code,
              }))}
              apiProps={apiProps}
              installCommand="npm install @sinups/ai-kit @mantine/core @mantine/hooks"
              previousHref={resolvedPreviousHref}
              nextHref={nextHref}
            />
          </div>
          <Markdown
            content={description}
            className="text-base text-muted-foreground [&_.an-md-p]:text-base [&_a]:text-an-primary-color [&_a]:underline-offset-2 [&_a:hover]:underline text-pretty"
          />
        </div>
        <PreviewCodeTabs
          preview={<ComponentPreview name={component.name} />}
          code={
            codeBlock ? (
              <DocCodeBlock
                code={codeBlock.content}
                language="tsx"
                variant="plain"
              />
            ) : null
          }
          codeText={codeBlock?.content}
          height={PREVIEW_HEIGHTS[normalizedId] ?? "450px"}
          previewClassName={
            COMPACT_PREVIEW_IDS.has(normalizedId)
              ? "[&_[data-slot=preview]]:!w-auto"
              : FULLBLEED_PREVIEW_IDS.has(normalizedId)
                ? "!p-0 !items-stretch [&_[data-slot=preview]]:h-full"
                : CHAT_WIDTH_PREVIEW_IDS.has(normalizedId)
                  ? "[align-items:safe_center] [&_[data-slot=preview]]:!max-w-an [&_[data-slot=preview]]:!mx-auto"
                  : undefined
          }
        />
        <div id="installation" className="space-y-3 scroll-mt-8">
          <div className="text-base font-medium text-an-foreground">
            Getting Started
          </div>
          <CliCommands />
        </div>
        {exampleBlocks.length > 0 && (
          <div id="examples" className="space-y-4 scroll-mt-8">
            <div className="text-base font-medium text-an-foreground">
              Examples
            </div>
            {exampleBlocks.map((block) => (
              <div
                key={block.title}
                id={`example-${componentIdFromName(block.title)}`}
                className="space-y-2 scroll-mt-8"
              >
                <div className="text-sm font-medium text-an-foreground">
                  {block.title}
                </div>
                {(() => {
                  const fullCode = buildExampleSource(
                    component.name,
                    block.code,
                  );
                  return (
                    <PreviewCodeTabs
                      preview={
                        <ComponentExamplePreview previewId={block.previewId} />
                      }
                      code={
                        <DocCodeBlock
                          code={fullCode}
                          language="tsx"
                          variant="plain"
                        />
                      }
                      codeText={fullCode}
                      height={
                        EXAMPLE_HEIGHTS[block.previewId] ??
                        (FULLBLEED_PREVIEW_IDS.has(normalizedId)
                          ? "450px"
                          : (PREVIEW_HEIGHTS[normalizedId] ?? "450px"))
                      }
                      previewClassName={
                        FULLWIDTH_EXAMPLE_IDS.has(block.previewId)
                          ? undefined
                          : COMPACT_PREVIEW_IDS.has(normalizedId)
                            ? "[&_[data-slot=preview]]:!w-auto"
                            : FULLBLEED_PREVIEW_IDS.has(normalizedId)
                              ? "!p-0 !items-stretch [&_[data-slot=preview]]:h-full"
                              : CHAT_WIDTH_PREVIEW_IDS.has(normalizedId)
                                ? "[align-items:safe_center] [&_[data-slot=preview]]:!max-w-an [&_[data-slot=preview]]:!mx-auto"
                                : undefined
                      }
                    />
                  );
                })()}
              </div>
            ))}
          </div>
        )}
        {hasSource && (
          <div id="source" className="space-y-3 scroll-mt-8">
            <div className="text-base font-medium text-an-foreground">
              Source
            </div>
            <p className="text-sm text-muted-foreground">
              The component source as it ships in the package. Useful as a
              reference, or as a starting point if you want to fork a piece.
            </p>
            <ComponentSource name={normalizedId} />
          </div>
        )}
        {apiProps && apiProps.length > 0 && (
          <div id="api" className="space-y-4 scroll-mt-8">
            <div className="text-base font-medium text-an-foreground">
              API reference
            </div>
            <div className="rounded-[8px] border border-border overflow-hidden text-sm">
              <div className="grid grid-cols-[160px_1fr_90px] gap-3 px-3 py-2 font-medium text-muted-foreground border-b border-border">
                <div>Prop</div>
                <div>Type</div>
                <div>Required</div>
              </div>
              <div className="divide-y divide-border">
                {apiProps.map((prop) => (
                  <div
                    key={prop.name}
                    className="grid grid-cols-[160px_1fr_90px] gap-3 px-3 py-2 text-sm"
                  >
                    <div
                      className="text-an-foreground font-medium min-w-0 truncate"
                      title={prop.name}
                    >
                      {prop.name}
                    </div>
                    <div
                      className="text-muted-foreground font-mono text-sm min-w-0 truncate"
                      title={prop.type}
                    >
                      {prop.type}
                    </div>
                    <div className="text-muted-foreground">
                      {prop.required ? "Yes" : "No"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <aside className="hidden xl:block order-1 xl:order-2">
        <div className="sticky top-0 pt-4 space-y-3">
          <div className="text-sm font-medium text-muted-foreground">
            On this page
          </div>
          <nav className="flex flex-col gap-2 text-sm">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-col gap-1">
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {section.label}
                </a>
                {section.children && (
                  <div className="flex flex-col gap-1 pl-4">
                    {section.children.map((child) => (
                      <a
                        key={child.id}
                        href={`#${child.id}`}
                        className="text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        {child.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </div>
  );
}

function getComponentDescription(
  componentName: string,
  usageContent?: string,
): string {
  if (componentName === "AgentChat") {
    return "Create a full chat surface with messages, status, and send/stop handlers. Messages are compatible with `useChat` from the Vercel AI SDK, see [Installation](/docs/installation).";
  }
  if (!usageContent) return `${componentName} component documentation.`;

  const normalized = usageContent.replace(/\s+/g, " ").trim();
  return normalized || `${componentName} component documentation.`;
}
