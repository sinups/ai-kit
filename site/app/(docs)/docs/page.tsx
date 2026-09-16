import Link from "next/link";
import { DocCodeBlock } from "@/app/components/doc-code-block";
import { DocNavButton } from "@/app/components/doc-nav-button";
import { DocPageShell } from "@/app/components/doc-page-shell";
import { getDocNav } from "@/app/utils/doc-nav";
import { buildPageMetadata } from "@/app/utils/page-metadata";
import { UPSTREAM_URL } from "@/app/lib/site";

export const metadata = buildPageMetadata({
  title: "Introduction",
  description:
    "AI UI Kit is an open-source collection of chat and agent UI components built on Mantine. Messages, tool cards, streaming states, and input controls, installed as one npm package.",
  path: "/docs",
  keywords: [
    "AI UI Kit introduction",
    "Mantine agent UI",
    "AI chat components",
    "React agent UI",
    "tool call UI",
    "streaming chat UI",
    "ai-elements alternative",
    "prompt-kit alternative",
  ],
});

const RECIPE_CHAT_WITH_TOOLS = `"use client";

import { AgentChat, BashTool, EditTool } from "@sinups/ai-kit";
import type { ChatMessage } from "@sinups/ai-kit";

const messages: ChatMessage[] = [/* streamed from your backend */];

export default function Chat() {
  return (
    <AgentChat
      messages={messages}
      status="ready"
      onSend={() => {}}
      onStop={() => {}}
      toolRenderers={{
        Bash: BashTool,
        Edit: EditTool,
      }}
    />
  );
}`;

const RECIPE_COMPOSER = `"use client";

import { InputBar, ModeSelector, ModelPicker } from "@sinups/ai-kit";
import { IconBulb, IconCursor } from "@tabler/icons-react";

const modes = [
  { id: "agent", label: "Agent", icon: IconCursor },
  { id: "plan", label: "Plan", icon: IconBulb },
];

const models = [
  { id: "sonnet", name: "Sonnet", version: "4.6" },
  { id: "opus", name: "Opus", version: "4.7" },
];

export default function Composer() {
  return (
    <InputBar
      status="ready"
      onSend={({ content }) => console.log(content)}
      onStop={() => {}}
      leftActions={
        <>
          <ModeSelector modes={modes} defaultValue="agent" />
          <ModelPicker models={models} defaultValue="sonnet" />
        </>
      }
    />
  );
}`;

const COMPONENT_GROUPS: Array<{
  title: string;
  items: Array<{ label: string; href: string }>;
}> = [
  {
    title: "Chat surface",
    items: [
      { label: "AgentChat", href: "/docs/agent-chat" },
      { label: "MessageList", href: "/docs/message-list" },
      { label: "UserMessage", href: "/docs/user-message" },
      { label: "ErrorMessage", href: "/docs/error-message" },
      { label: "Markdown", href: "/docs/markdown" },
    ],
  },
  {
    title: "Input",
    items: [
      { label: "InputBar", href: "/docs/input-bar" },
      { label: "Suggestions", href: "/docs/suggestions" },
      { label: "ModelPicker", href: "/docs/model-picker" },
      { label: "ModeSelector", href: "/docs/mode-selector" },
      { label: "SendButton", href: "/docs/send-button" },
      { label: "AttachmentButton", href: "/docs/attachment-button" },
      { label: "FileAttachment", href: "/docs/file-attachment" },
    ],
  },
  {
    title: "Tool cards",
    items: [
      { label: "BashTool", href: "/docs/bash-tool" },
      { label: "EditTool", href: "/docs/edit-tool" },
      { label: "SearchTool", href: "/docs/search-tool" },
      { label: "TodoTool", href: "/docs/todo-tool" },
      { label: "PlanTool", href: "/docs/plan-tool" },
      { label: "ToolGroup", href: "/docs/tool-group" },
      { label: "SubagentTool", href: "/docs/subagent-tool" },
      { label: "McpTool", href: "/docs/mcp-tool" },
      { label: "QuestionTool", href: "/docs/question-tool" },
      { label: "GenericTool", href: "/docs/generic-tool" },
    ],
  },
  {
    title: "Streaming states",
    items: [
      { label: "ThinkingTool", href: "/docs/thinking-tool" },
      { label: "TextShimmer", href: "/docs/text-shimmer" },
      { label: "SpiralLoader", href: "/docs/spiral-loader" },
    ],
  },
];

export default function IntroductionPage() {
  const { previousHref, nextHref } = getDocNav("/docs");

  return (
    <DocPageShell
      sections={[
        { id: "overview", label: "Overview" },
        { id: "at-a-glance", label: "At a glance" },
        { id: "quick-start", label: "Quick start" },
        { id: "recipes", label: "Composition recipes" },
        { id: "works-with", label: "Works with" },
        { id: "credits", label: "Credits" },
      ]}
    >
      <header id="overview" className="space-y-2 scroll-mt-8">
        <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-medium text-an-foreground">
            Introduction
          </h1>
          <DocNavButton
            title="Introduction"
            description="An open-source chat and agent UI kit built on Mantine."
            previousHref={previousHref}
            nextHref={nextHref}
          />
        </div>
        <p className="text-base text-muted-foreground">
          AI UI Kit is an open-source collection of chat and
          agent UI components (messages, tool cards, streaming states, and
          input controls), built on top of{" "}
          <a
            href="https://mantine.dev"
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Mantine
          </a>
          . Install one package and use the components like any other
          Mantine extension: they follow your theme, color scheme and fonts.
        </p>
        <p className="text-base text-muted-foreground">
          The goal is not to be a framework. It gives you the pieces a
          production agent UI needs (streaming markdown, diffed edits, plan
          approvals, tool invocations, clarifying questions) so you can focus
          on the model side. The API is typed around{" "}
          <code className="code-doc">ChatMessage</code> and{" "}
          <code className="code-doc">ChatStatus</code> from the{" "}
          <a
            href="https://sdk.vercel.ai/"
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Vercel AI SDK
          </a>
          , so{" "}
          <code className="code-doc">useChat</code> plugs in directly.
        </p>
      </header>

      <div id="at-a-glance" className="space-y-4 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          At a glance
        </div>
        <p className="text-base text-muted-foreground">
          25 components grouped by role. Use them individually, or drop in{" "}
          <code className="code-doc">AgentChat</code> to get the full set
          wired together.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COMPONENT_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-lg border border-border bg-background p-4 space-y-2"
            >
              <div className="text-sm font-medium text-an-foreground">
                {group.title}
              </div>
              <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div id="quick-start" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Quick start
        </div>
        <p className="text-base text-muted-foreground">
          Head to{" "}
          <Link
            href="/docs/installation"
            className="text-an-primary-color hover:underline underline-offset-2"
          >
            Installation
          </Link>{" "}
          for prerequisites, styles and your first component. In short:
        </p>
        <DocCodeBlock
          code="npm install @sinups/ai-kit @mantine/core @mantine/hooks"
          language="bash"
        />
      </div>

      <div id="recipes" className="space-y-4 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Composition recipes
        </div>

        <div className="space-y-3">
          <div className="text-base font-medium text-an-foreground">
            Chat with tool renderers
          </div>
          <p className="text-base text-muted-foreground">
            Plug Bash and Edit tool cards into{" "}
            <code className="code-doc">AgentChat</code> to render real tool
            invocations from your backend.
          </p>
          <DocCodeBlock code={RECIPE_CHAT_WITH_TOOLS} language="tsx" />
        </div>

        <div className="space-y-3">
          <div className="text-base font-medium text-an-foreground">
            Composer with mode + model pickers
          </div>
          <p className="text-base text-muted-foreground">
            <code className="code-doc">InputBar</code> accepts any React node
            in <code className="code-doc">leftActions</code> /{" "}
            <code className="code-doc">rightActions</code>. Drop in{" "}
            <code className="code-doc">ModeSelector</code> and{" "}
            <code className="code-doc">ModelPicker</code> for a ChatGPT-style
            composer.
          </p>
          <DocCodeBlock code={RECIPE_COMPOSER} language="tsx" />
        </div>
      </div>

      <div id="works-with" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">
          Works with
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://sdk.vercel.ai/"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border bg-background p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="text-sm font-medium text-an-foreground">
              Vercel AI SDK
            </div>
            <p className="text-sm text-muted-foreground">
              Designed around <code className="code-doc">ChatMessage</code>.
              Drop-in with <code className="code-doc">useChat</code>.
            </p>
          </a>
          <Link
            href="/docs/mcp"
            className="rounded-lg border border-border bg-background p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="text-sm font-medium text-an-foreground">MCP</div>
            <p className="text-sm text-muted-foreground">
              Give your AI assistant the full docs through an MCP server.
            </p>
          </Link>
          <Link
            href="/docs/skills"
            className="rounded-lg border border-border bg-background p-4 hover:bg-muted/40 transition-colors"
          >
            <div className="text-sm font-medium text-an-foreground">
              Skills
            </div>
            <p className="text-sm text-muted-foreground">
              Project-aware context so Claude Code and Cursor compose the
              components correctly.
            </p>
          </Link>
        </div>
      </div>

      <div id="credits" className="space-y-3 scroll-mt-8">
        <div className="text-base font-medium text-an-foreground">Credits</div>
        <p className="text-base text-muted-foreground">
          AI UI Kit is a fork of{" "}
          <a
            href={UPSTREAM_URL}
            className="text-an-primary-color hover:underline underline-offset-2"
            target="_blank"
            rel="noreferrer"
          >
            Agent Elements
          </a>{" "}
          by 21st.dev, released under the MIT license. The component design,
          behavior, examples and this documentation site come from that
          project. What changed: the Tailwind and shadcn implementation was
          replaced with Mantine primitives and theme tokens, the registry-based
          install became a single npm package, and the parts tied to the
          21st.dev Agent SDK (relay, sandbox and deploy flows) were removed.
        </p>
        <p className="text-base text-muted-foreground">
          If you are on Tailwind and shadcn, use the original. If you are on
          Mantine, you get the same components without a second styling
          system.
        </p>
      </div>
    </DocPageShell>
  );
}
