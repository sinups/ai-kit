import { getComponentProps } from "@/app/components/[id]/api-reference";
import { COMPONENT_DOCS, componentIdFromName, type ComponentBlock } from "@/app/data/component-docs";
import { RECIPES } from "@/app/data/recipes";
import { SIDEBAR_SECTIONS } from "@/app/data/sidebar";
import { DOC_PAGE_DESCRIPTIONS, INTRODUCTION_DESCRIPTION } from "@/app/lib/doc-pages";
import {
  CONTEXT7_NOTE,
  EXAMPLE_PROMPTS,
  FETCH_SERVER_CONFIG,
  LLMS_FULL_URL,
  LLMS_URL,
  PROJECT_INSTRUCTIONS,
} from "@/app/lib/mcp-setup";
import { INSTALL_COMMAND, PACKAGE_VERSION, PEER_DEPENDENCIES } from "@/app/lib/package-info";
import { PACKAGE_NAME, SITE_URL, UPSTREAM_NAME } from "@/app/lib/site";
import { getUtilityGroups } from "@/app/lib/utility-exports";

export const dynamic = "force-static";

function codeFence(code: string, lang = "tsx") {
  return ["```" + lang, code.trim(), "```"].join("\n");
}

function page(href: string, title: string, body: string[]): string {
  const description = DOC_PAGE_DESCRIPTIONS[href];
  return [`# ${title}`, "", `URL: ${SITE_URL}${href}`, "", ...(description ? [description, ""] : []), ...body].join(
    "\n",
  );
}

function blockToMarkdown(block: ComponentBlock): string {
  if (block.type === "example") {
    return [`### Example: ${block.title}`, "", codeFence(block.code)].join("\n");
  }
  if (block.type === "code") {
    return [`### ${block.title}`, "", codeFence(block.content)].join("\n");
  }
  return [`### ${block.title}`, "", block.content.trim()].join("\n");
}

const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ");

function renderIntroduction(): string {
  return page("/docs", "Introduction", [
    `Messages are structurally compatible with \`UIMessage\` from the AI SDK (\`ChatMessage\` in this package) and status is \`ChatStatus\`, so \`useChat\` output plugs in without importing \`ai\`. The project is a fork of ${UPSTREAM_NAME} by 21st.dev (MIT), rebuilt on Mantine as one npm package.`,
    "",
    "## Component groups",
    "",
    ...SIDEBAR_SECTIONS.filter((section) => section.components).map(
      (section) => `- **${section.title}**: ${section.items.map((item) => item.label).join(", ")}`,
    ),
  ]);
}

function renderInstallation(): string {
  return page("/docs/installation", "Installation", [
    `## Package`,
    "",
    `- \`${PACKAGE_NAME}\` ${PACKAGE_VERSION}`,
    ...PEER_DEPENDENCIES.map((peer) => `- Peer dependency: \`${peer.name}\` ${peer.range}`),
    "",
    "## Install",
    "",
    codeFence(INSTALL_COMMAND, "bash"),
    "",
    "## Styles and provider",
    "",
    codeFence(`import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";`),
    "",
    "Or import styles per component, like `@mantine/core/styles/Button.css`: `styles/base.css` (the `--ae-*` tokens) once, then one file per component you use. Each file includes the styles of the components it renders.",
    "",
    codeFence(`import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles/base.css";
import "@sinups/ai-kit/styles/Wizard.css";`),
    "",
    "Render the app inside `MantineProvider`; light and dark schemes follow its color scheme. Wrap kit screens in `AiKitProvider` to give stock Mantine components inside them the kit look and to expose accent, radius and density settings.",
    "",
    "## Usage",
    "",
    codeFence(`"use client";

import { AgentChat } from "@sinups/ai-kit";
import { useChat } from "@ai-sdk/react";
import { IconBook2, IconBug, IconSparkles } from "@tabler/icons-react";

export function Chat() {
  const { messages, status, sendMessage, stop } = useChat();
  return (
    <AgentChat
      messages={messages}
      status={status}
      onSend={({ content }) => sendMessage({ text: content })}
      onStop={stop}
      contentWidth={760}
      emptyState={{
        avatar: <IconSparkles size={22} />,
        title: "How can I help you today?",
        actions: [
          { id: "explain", label: "Explain this repository", icon: <IconBook2 /> },
          { id: "bug", label: "Find the cause of a bug", icon: <IconBug /> },
        ],
      }}
    />
  );
}`),
  ]);
}

function renderEssentials(): string {
  return [
    "# Essentials",
    "",
    "Rules that apply across the kit. Component pages below give the details.",
    "",
    "- Components are controlled: data comes in through props, intent goes out through callbacks. Async callbacks may return a promise; the component shows a pending state and the rejection message.",
    "- Everything is exported from the package root. Pure helpers are listed under Hooks and utilities.",
    "- Built-in tool cards render automatically for tool parts: `tool-Bash`, `tool-Edit`, `tool-Write`, `tool-Grep`, `tool-Glob`, `tool-WebSearch`, `tool-TodoWrite`, `tool-PlanWrite`, `tool-Question`, `tool-Task`, `tool-Agent`, `tool-Thinking`, `tool-mcp__<server>__<tool>`.",
    "- `toolRenderers` on `AgentChat`, `MessageList` and `ToolRenderer` adds or replaces cards. Keys are full part types, `tool-<Name>`, such as `tool-Deploy` or `tool-mcp__git__search`; a bare name only matches `mcp__user-tools__<name>`. Renderers receive `CustomToolRendererProps`: `name`, `input`, `output`, `status`, `toolCallId`, `part`, `onAction`. `onAction` reports to `onToolAction`.",
    "- Empty chat: `emptyState` with the default `welcome` layout shows `avatar`, `title`, `description` and starter `actions` (`id`, `label`, `icon`, `badge`) above the composer at the bottom. `layout: \"center\"` centers the greeting and the composer, with suggestion pills above the composer.",
    "- `AgentChat` `emptySuggestionsPosition` is deprecated: suggestions always render above the composer and `\"bottom\"` behaves as `\"top\"`. Remove the prop.",
    "- `contentWidth` sets the message column and composer width: `420px` by default, a number such as `760` on full pages, `\"100%\"` in panels and widgets. Pass `wrapLines` in narrow containers.",
    "- Layout adapts to the component's own width, from a 360px widget to a 900px page. Data views handle loading, error and empty states.",
    "- Visible text has English defaults overridable through `labels` (`DEFAULT_<NAME>_LABELS` holds them); labels of nested parts sit under a key, for example `labels.wizard`.",
  ].join("\n");
}

function renderRecipes(): string {
  return page(
    "/docs/what-you-can-build",
    "What you can build",
    RECIPES.flatMap((recipe) => [
      `## ${recipe.title}`,
      "",
      recipe.summary,
      "",
      `Uses: ${recipe.components.join(", ")}`,
      "",
      codeFence(recipe.code),
      "",
    ]),
  );
}

function renderTheming(): string {
  return page("/docs/theming", "Theming", [
    codeFence(`<MantineProvider theme={appTheme}>
  <AiKitProvider accent="violet" radius="default" density="compact" persistKey="workspace-kit-theme">
    <McpSettingsPanel servers={servers} />
    <AiKitThemeCustomizer sections={{ mode: false }} />
  </AiKitProvider>
</MantineProvider>`),
    "",
    "- Without a provider the kit follows the host primary color, fonts and color scheme through Mantine CSS variables and `--ae-*` tokens.",
    "- `AiKitProvider` goes inside the host `MantineProvider` and themes only its subtree and its portals.",
    "- `accent`: `gray`, `blue`, `indigo`, `violet`, `grape`, `pink`. `radius`: `sharp`, `default`, `round`. `density`: `default`, `compact`. `colorScheme`: `light`, `dark`, `auto` (changes the whole app).",
    "- `theme`: a `MantineThemeOverride` merged last. `tokens`: `--ae-*` values without the prefix (`AeTokenOverrides`, names in `AE_TOKENS`). `persistKey`: stores changes in localStorage.",
    "- `useAiKitTheme()` returns `settings`, `defaults`, `setSettings`, `reset`, `hostTheme`, `aiKit`; `useOptionalAiKitTheme()` returns `null` outside a provider. `AiKitHostScope` renders host UI with the host theme inside a kit subtree.",
    "- Global setup: `<MantineProvider theme={mergeAiKitTheme(appTheme)}>` with the `ae-kit` class (`AI_KIT_SCOPE_CLASS`) on the app root.",
    "- Opt a stock component out of kit styles with `unstyled`, `variant=\"unstyled\"` or `data-ai-kit-unstyled`.",
  ]);
}

function renderLayouts(): string {
  return page("/docs/layouts", "Layouts", [
    "- Give the chat a bounded height: a flex column with `minHeight: 0` on every level down to `AgentChat`.",
    "- Measure the container, not the viewport. Below about 720px pass `wrapLines` and move side panes into a `Drawer`.",
    "- Full-page chat: a header aligned with the column, `AgentChat` with `contentWidth={760}`, `alignComposer`, `topFade`, `collapseToolRuns`, `withSearch`, `stickyPrompt`.",
    "- Chat with a sidebar: a 272px `SessionList` column on `--ae-bg-tertiary`; a drawer when narrow.",
    "- Chat with an inspector: Mantine `Splitter` with a collapsible pane for `DiffReview` or `BackgroundTasksPanel`; a bottom drawer on phones.",
    "- Settings page: `SettingsLayout` with `SettingsSection` and `SettingRow`; `fill: true` sections for panels that scroll themselves such as `McpSettingsPanel`.",
    "- Widget: `ChatLauncher` around `AgentChat` with `contentWidth=\"100%\"`.",
  ]);
}

function renderLauncher(): string {
  return page("/docs/launcher", "Embedding the launcher", [
    codeFence(`<ChatLauncher title="Assistant" unreadCount={unread}>
  <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={welcome} />
</ChatLauncher>`),
    "",
    "- `ChatLauncher` is a floating button that opens a non-modal chat panel. Escape and the close button return focus to the button; `keepMounted` (default `true`) keeps the chat state while closed; the panel opens full screen below `fullScreenBreakpoint` (520px). `withinPortal={false}` positions it inside a transformed container.",
    "- `mountChatLauncher(target, element, options)` renders into an open shadow root with its own `MantineProvider` and returns `{ container, unmount }`. Options: `shadow` (default `true`), `styles` (CSS text; `:root`, `html`, `body` are scoped to the widget), `styleUrls`, `adoptDocumentStyles` (development), `theme`, `colorScheme` (default `light`), `wrap`.",
    "",
    codeFence(`import mantineCss from "@mantine/core/styles.css?inline";
import baseCss from "@sinups/ai-kit/styles/base.css?inline";
import launcherCss from "@sinups/ai-kit/styles/ChatLauncher.css?inline";
import chatCss from "@sinups/ai-kit/styles/AgentChat.css?inline";
import providerCss from "@sinups/ai-kit/styles/AiKitProvider.css?inline";

const widget = mountChatLauncher(host, <SupportLauncher />, {
  styles: [mantineCss, baseCss, launcherCss, chatCss, providerCss],
  wrap: (element) => <AiKitProvider>{element}</AiKitProvider>,
});
widget.unmount();`),
  ]);
}

function renderWhatsNew(): string {
  return page("/docs/whats-new", "What's new", [
    "- New modules: primitives, MCP, agents, skills, permissions, hooks configuration, memory, sessions, message actions, background tasks, diff review, model settings, help, elicitation.",
    "- New chat components: AgentStatus, ContextUsage, ContextBreakdown, CompactBoundary, TurnSummary, ContextEventRow, HookActivity, IdleReturnPrompt, SpendThresholdNotice, TranscriptSearch, PromptHistorySearch, PastedTextAttachment, CodeBlock, ShellOutput.",
    "- AgentChat gained `emptyState`, `statusBar`, `messageActions`, `withSearch`, `stickyPrompt`, `collapseToolRuns`, `alignComposer`, `topFade`, `wrapLines`, `inputBarProps` and more; InputBar gained completions, a message queue, collapsed pastes and prompt history.",
    "- Theming: AiKitProvider, AiKitThemeCustomizer, createAiKitTheme, mergeAiKitTheme. Launcher: ChatLauncher, mountChatLauncher.",
    "- Deprecated: `emptySuggestionsPosition` (suggestions always render above the composer).",
  ]);
}

function renderUtilities(): string {
  const parts: string[] = [];
  for (const group of getUtilityGroups()) {
    parts.push(`## ${group.title}`, "");
    for (const item of group.items) {
      parts.push(`- \`${item.signature}\`${item.description ? `: ${item.description}` : ""}`);
    }
    parts.push("");
  }
  return page("/docs/utilities", "Hooks and utilities", parts);
}

function renderMcp(): string {
  return page("/docs/mcp", "MCP", [
    `- Index: ${LLMS_URL}`,
    `- Full docs: ${LLMS_FULL_URL}`,
    "",
    "## With a fetch server",
    "",
    codeFence(FETCH_SERVER_CONFIG, "json"),
    "",
    "## Without MCP",
    "",
    codeFence(PROJECT_INSTRUCTIONS, "markdown"),
    "",
    "## Context7",
    "",
    CONTEXT7_NOTE,
    "",
    "## Example prompts",
    "",
    ...EXAMPLE_PROMPTS.map((prompt) => `- ${prompt}`),
  ]);
}

function renderSkills(): string {
  return page("/docs/skills", "Skills", [codeFence("npx skills add sinups/ai-kit", "bash")]);
}

function renderComponent(name: string): string {
  const doc = COMPONENT_DOCS.find((item) => item.name === name);
  const parts: string[] = [`## ${name}`, "", `URL: ${SITE_URL}/docs/${componentIdFromName(name)}`, ""];
  for (const block of doc?.blocks ?? []) {
    parts.push(blockToMarkdown(block), "");
  }
  const apiProps = getComponentProps(name);
  if (apiProps?.length) {
    parts.push("### API reference", "", "| Prop | Type | Required | Description |", "| --- | --- | --- | --- |");
    for (const prop of apiProps) {
      parts.push(
        `| ${prop.name} | \`${escapeCell(prop.type)}\` | ${prop.required ? "Yes" : "No"} | ${escapeCell(prop.description ?? "")} |`,
      );
    }
    parts.push("");
  }
  return parts.join("\n");
}

const GUIDE_RENDERERS: Record<string, () => string> = {
  "/docs": renderIntroduction,
  "/docs/installation": renderInstallation,
  "/docs/mcp": renderMcp,
  "/docs/skills": renderSkills,
  "/docs/what-you-can-build": renderRecipes,
  "/docs/theming": renderTheming,
  "/docs/layouts": renderLayouts,
  "/docs/launcher": renderLauncher,
  "/docs/whats-new": renderWhatsNew,
  "/docs/utilities": renderUtilities,
};

export function GET() {
  const sections: string[] = [
    [
      "# AI UI Kit: full docs",
      "",
      `> ${INTRODUCTION_DESCRIPTION}`,
      "",
      `Package \`${PACKAGE_NAME}\` ${PACKAGE_VERSION}. Install: \`${INSTALL_COMMAND}\`. Index: ${LLMS_URL}`,
    ].join("\n"),
    renderEssentials(),
  ];

  for (const section of SIDEBAR_SECTIONS) {
    if (section.components) {
      sections.push(
        [`# ${section.title}`, "", ...section.items.map((item) => renderComponent(item.label))].join("\n"),
      );
      continue;
    }
    for (const item of section.items) {
      const render = GUIDE_RENDERERS[item.href];
      sections.push(
        render
          ? render()
          : page(item.href, item.label, []),
      );
    }
  }

  return new Response(sections.join("\n\n---\n\n") + "\n", {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
