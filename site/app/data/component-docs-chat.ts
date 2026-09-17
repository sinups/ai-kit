import type { ComponentDoc } from "@/app/data/component-docs";

export const CHAT_EXTRA_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "ContextBreakdown",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import {
  ContextBreakdown,
  type ContextBreakdownGroup,
  type ContextSuggestion,
} from "@sinups/ai-kit";

const groups: ContextBreakdownGroup[] = [
  { id: "system", label: "System prompt", tokens: 6_200 },
  {
    id: "mcpTools",
    label: "MCP tools",
    items: [
      { id: "postgres", label: "postgres", tokens: 11_800, description: "14 tools" },
      { id: "git", label: "git", tokens: 4_300, description: "9 tools" },
    ],
  },
  { id: "messages", label: "Messages", tokens: 71_500 },
];

export function Example({ disableServers }: { disableServers: () => void }) {
  const suggestions: ContextSuggestion[] = [
    {
      severity: "warning",
      title: "Disable unused MCP servers",
      savings: 11_800,
      action: { label: "Review", onClick: disableServers },
    },
  ];

  return (
    <ContextBreakdown
      groups={groups}
      total={200_000}
      suggestions={suggestions}
      defaultExpanded={["mcpTools"]}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show what fills the context window, group by group: a stacked usage bar, one row per group with tokens and percent, and optional suggestions to free space. A group with `items` expands to its items, sorted by tokens. `used` defaults to the sum of the groups. Suggestions are sorted critical first, then by `savings`; each can carry an action button. Use `variant=\"full\"` (default) on a settings or usage page and `variant=\"compact\"` in a popover: compact hides item and suggestion descriptions and bar tooltips. You rarely render it directly inside a chat: pass `breakdown` and `suggestions` to ContextUsage and the ring shows this component in its details. The layout is a single column and fits a 360px widget. Related pure helpers: `getGroupTokens`, `getBreakdownTotal`, `sortBreakdownItems`, `sortSuggestions`, `getTotalSavings`, `getGroupColor`, `getGroupShade`.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "ContextBreakdown/wide",
        code: `<ContextBreakdown
  groups={groups}
  total={200_000}
  suggestions={suggestions}
  defaultExpanded={["mcpTools"]}
/>`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "ContextBreakdown/narrow",
        code: `<div style={{ width: 360 }}>
  <ContextBreakdown groups={groups} total={200_000} suggestions={suggestions} />
</div>`,
      },
      {
        type: "example",
        title: "Inside ContextUsage",
        previewId: "ContextBreakdown/in-context-usage",
        code: `<ContextUsage
  used={120_500}
  total={200_000}
  breakdown={groups}
  suggestions={suggestions}
  withLabel
/>`,
      },
    ],
  },
  {
    name: "ContextEventRow",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ContextEventRow } from "@sinups/ai-kit";

export function Example() {
  return (
    <>
      <ContextEventRow kind="file" label="src/upload/client.ts" detail="214 lines" />
      <ContextEventRow
        kind="directory"
        label="src/upload"
        items={["client.ts", "retry.ts", "types.ts"]}
      />
      <ContextEventRow kind="skill" label="release-notes" labels={{ skill: "Activated skill" }} />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Record something the agent pulled into its context: a file it read, a directory it listed, a memory file, an MCP resource, a skill, or diagnostics. The row shows an icon per `kind`, a verb (`Read`, `Listed`, `Loaded memory`, `Attached`, `Loaded skill`, `Found diagnostics in`) and the label with an optional detail. With `items` the row expands to show them, closed unless `defaultExpanded`. Override verbs per kind with `labels`. MessageList renders it automatically for a `{ type: \"context-event\", kind, label, detail?, items? }` part, so in a chat you only emit the part. The row is one line and truncates its detail, so it works at any width.",
      },
      {
        type: "example",
        title: "All kinds",
        previewId: "ContextEventRow/kinds",
        code: `<ContextEventRow kind="file" label="src/upload/client.ts" detail="214 lines" />
<ContextEventRow kind="directory" label="src/upload" detail="5 entries" items={files} defaultExpanded />
<ContextEventRow kind="memory" label="AGENTS.md" />
<ContextEventRow kind="mcp-resource" label="postgres://schema/public" />
<ContextEventRow kind="skill" label="release-notes" />
<ContextEventRow kind="diagnostics" label="src/upload/retry.ts" detail="2 errors" />`,
      },
    ],
  },
  {
    name: "TurnSummary",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { TurnSummary } from "@sinups/ai-kit";

export function Example() {
  return (
    <TurnSummary
      durationMs={123_000}
      tokens={40_200}
      tokenBudget={100_000}
      backgroundTasks={2}
      labels={{ worked: (duration) => \`Done in \${duration}\` }}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Close a turn with one muted line: how long the agent worked, tokens used (against a budget when `tokenBudget` is set) and how many background tasks are still running. While background tasks run, the clock icon becomes a small loader. Labels are functions, so you can change wording and pluralization. MessageList renders it automatically for a `{ type: \"turn-summary\", durationMs, tokens?, tokenBudget?, backgroundTasks? }` part. The line does not wrap, so keep labels short in narrow widgets. Related helper: `getTurnSummarySegments`, which returns the text segments if you build your own layout.",
      },
      {
        type: "example",
        title: "Variants",
        previewId: "TurnSummary/basic",
        code: `<TurnSummary durationMs={123_000} />
<TurnSummary durationMs={47_000} tokens={40_200} tokenBudget={100_000} />
<TurnSummary durationMs={3_900_000} tokens={182_000} backgroundTasks={2} />`,
      },
    ],
  },
  {
    name: "HookActivity",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { HookActivity } from "@sinups/ai-kit";

export function Example() {
  return (
    <HookActivity
      event="PreToolUse"
      status="blocked"
      reason="Writes outside the workspace are not allowed: /etc/hosts"
      hooks={[{ name: "./hooks/guard-paths.sh", durationMs: 35 }]}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show the hooks that ran for an event, such as `PreToolUse`, `PostToolUse` or `Stop`. `status` is `running` (spinner and shimmer title), `done`, `blocked` (orange, with the reason) or `error` (red, with per-hook errors). The row expands to the reason and the list of hooks with their durations; blocked and failed rows start expanded, running rows cannot be expanded. Titles come from function labels (`running`, `done`, `blocked`, `error`), and `getHookActivityTitle` returns the same text for use elsewhere. MessageList renders it automatically for a `{ type: \"hook-activity\", event, status, hooks?, reason? }` part. To configure hooks rather than display their runs, use HooksPanel.",
      },
      {
        type: "example",
        title: "Statuses",
        previewId: "HookActivity/statuses",
        code: `<HookActivity event="PreToolUse" status="running" />
<HookActivity event="PostToolUse" status="done" hooks={[{ name: "npm run lint -- --fix", durationMs: 1_840 }]} />
<HookActivity event="PreToolUse" status="blocked" reason="Writes outside the workspace are not allowed" />
<HookActivity event="Stop" status="error" hooks={[{ name: "./hooks/notify.sh", error: "Command timed out after 5s" }]} />`,
      },
    ],
  },
  {
    name: "TranscriptSearch",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { TranscriptSearch, stepMatchIndex } from "@sinups/ai-kit";

export function Example({ total, onClose }: { total: number; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <TranscriptSearch
      value={query}
      onChange={(value) => {
        setQuery(value);
        setActiveIndex(0);
      }}
      activeIndex={total === 0 ? -1 : activeIndex}
      total={total}
      onNext={() => setActiveIndex((index) => stepMatchIndex(index, total, 1))}
      onPrevious={() => setActiveIndex((index) => stepMatchIndex(index, total, -1))}
      onClose={onClose}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A find bar for a conversation: query input, a `3/12` counter, previous and next buttons and close. Enter goes to the next match, Shift+Enter to the previous one, Escape closes. The counter appears once the query is not empty and shows `0/0` when nothing matches; the arrows are disabled without matches. The component is controlled and does not search by itself. In most apps you do not render it: set `withSearch` on AgentChat or MessageList and Mod+F opens this bar, highlights matches in the transcript and scrolls to the active one. Render it yourself for a custom transcript, using the exported helpers: `findTextMatches` (case-insensitive matches in a string), `findDomMatches` (DOM ranges inside an element, skipping `[data-search-ignore]`) and `stepMatchIndex` (wrap-around navigation). The bar is a compact Paper that fits a 360px widget.",
      },
      {
        type: "example",
        title: "Custom transcript",
        previewId: "TranscriptSearch/basic",
        code: `const perMessage = messages.map((text) => findTextMatches(text, query));
const total = perMessage.reduce((sum, ranges) => sum + ranges.length, 0);

<TranscriptSearch
  value={query}
  onChange={setQuery}
  activeIndex={activeIndex}
  total={total}
  onNext={() => setActiveIndex(stepMatchIndex(activeIndex, total, 1))}
  onPrevious={() => setActiveIndex(stepMatchIndex(activeIndex, total, -1))}
  onClose={close}
/>`,
      },
    ],
  },
  {
    name: "PromptHistorySearch",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { PromptHistorySearch } from "@sinups/ai-kit";

export function Example({ history, setDraft }: { history: string[]; setDraft: (value: string) => void }) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onClick={() => setOpened(true)}>Search prompts</Button>
      <PromptHistorySearch
        opened={opened}
        onClose={() => setOpened(false)}
        history={history}
        onSelect={setDraft}
      />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A fuzzy search dialog over prompts the user already sent. Pass `history` oldest first; the dialog lists unique prompts newest first, shows the first line of each and marks multi-line prompts with a line count. Picking a prompt calls `onSelect` and closes the dialog; an empty query shows all prompts, no match shows the `empty` label. It is built on CommandPalette, so it goes full screen on phones. InputBar already includes it: pass `history` to InputBar and Mod+R opens this dialog, while ArrowUp and ArrowDown browse history inline. Use `historySearchHotkey` to change or disable the hotkey, or `onHistorySearch` to open your own dialog. Related helpers for custom composers: `navigatePromptHistory`, `canBrowseOlder`, `canBrowseNewer`, `getSearchablePrompts`.",
      },
      {
        type: "example",
        title: "Dialog",
        previewId: "PromptHistorySearch/basic",
        code: `<PromptHistorySearch
  opened={opened}
  onClose={close}
  history={history}
  onSelect={setDraft}
/>`,
      },
    ],
  },
  {
    name: "PastedTextAttachment",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { PastedTextAttachment, type PastedText } from "@sinups/ai-kit";

export function Example({ paste, remove }: { paste: PastedText; remove: () => void }) {
  return (
    <PastedTextAttachment
      paste={paste}
      labels={{ name: "Paste #{id}", lines: "{lines} lines" }}
      onRemove={remove}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A chip for a large paste that was collapsed out of the composer. It looks like a file attachment, shows `Pasted text #1` and the line count, opens a read-only preview on click and has a remove button when `onRemove` is set. InputBar does this automatically: pastes at or above `pasteCollapseThreshold` (10,000 characters or 50 lines by default, `false` to turn off) become a `[Pasted text #N]` placeholder plus this chip, and `onSend` receives the expanded text. Render the chip yourself only in a custom composer, together with the helpers `shouldCollapsePaste`, `insertPastePlaceholder`, `expandPastedText`, `prunePastes`, `removePastePlaceholder` and `formatPasteLabel`.",
      },
      {
        type: "example",
        title: "Chips",
        previewId: "PastedTextAttachment/basic",
        code: `{pastes.map((paste) => (
  <PastedTextAttachment key={paste.id} paste={paste} onRemove={() => remove(paste.id)} />
))}`,
      },
    ],
  },
  {
    name: "IdleReturnPrompt",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { IdleReturnPrompt } from "@sinups/ai-kit";

export function Example({
  awayMs,
  tokens,
  continueHere,
  startNewChat,
  disablePrompt,
}: {
  awayMs: number;
  tokens: number;
  continueHere: () => void;
  startNewChat: () => void;
  disablePrompt: () => void;
}) {
  return (
    <IdleReturnPrompt
      awayMs={awayMs}
      tokens={tokens}
      onContinue={continueHere}
      onNewChat={startNewChat}
      onDontAskAgain={disablePrompt}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Ask a user who comes back to a long conversation whether to continue it or start fresh: `Welcome back, 3h since your last message. This chat already holds 182k tokens. Keep going here or start fresh?`. Continue is always shown; New chat with this message and Stop asking render only when their callbacks are set. All strings can be replaced through `labels`. Without `tokens` the message omits the size. Your app decides when to show it, for example after an idle period when the conversation is large. Place it above the composer, for example through AgentChat `statusBar`. Actions wrap below the text in narrow containers. Related helper: `formatAwayDuration` (`45m`, `3h`, `2d`).",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "IdleReturnPrompt/wide",
        code: `<IdleReturnPrompt
  awayMs={3 * 60 * 60 * 1000}
  tokens={182_000}
  onContinue={continueHere}
  onNewChat={startNewChat}
  onDontAskAgain={disablePrompt}
/>`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "IdleReturnPrompt/narrow",
        code: `<div style={{ width: 360 }}>
  <IdleReturnPrompt awayMs={45 * 60 * 1000} onContinue={continueHere} onNewChat={startNewChat} />
</div>`,
      },
    ],
  },
  {
    name: "SpendThresholdNotice",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SpendThresholdNotice } from "@sinups/ai-kit";

export function Example({ spent, openUsage, dismiss }: { spent: number; openUsage: () => void; dismiss: () => void }) {
  return (
    <SpendThresholdNotice
      amount={spent}
      limit={50}
      currency="USD"
      actions={[{ label: "View usage", onClick: openUsage, kind: "primary" }]}
      onDismiss={dismiss}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Tell the user that spending in the session passed a threshold: `You've spent $20.40 in this session. Your limit is $50.00.`. Money is formatted with `Intl.NumberFormat` using `currency` and `locale`. Add buttons with `actions` (`primary` or `secondary`), extra text with `description`, and a close button with `onDismiss`. Use `getReachedThreshold(amount, thresholds)` to decide when to show it and remember which threshold was dismissed. Shares its look with IdleReturnPrompt; actions wrap below the text in narrow containers. `formatSpend` is exported for use in your own text.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "SpendThresholdNotice/wide",
        code: `<SpendThresholdNotice
  amount={20.4}
  limit={50}
  actions={[
    { label: "View usage", onClick: openUsage, kind: "primary" },
    { label: "Set a limit", onClick: openLimits },
  ]}
  onDismiss={dismiss}
/>`,
      },
      {
        type: "example",
        title: "Narrow, other currency",
        previewId: "SpendThresholdNotice/narrow",
        code: `<SpendThresholdNotice amount={5} currency="EUR" locale="de" onDismiss={dismiss} />`,
      },
    ],
  },
  {
    name: "QuestionPrompt",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { QuestionPrompt, type QuestionConfig } from "@sinups/ai-kit";

const questions: QuestionConfig[] = [
  {
    kind: "single",
    title: "Which retry strategy should the upload client use?",
    options: [
      {
        id: "exponential",
        label: "Exponential backoff",
        preview: { kind: "code", language: "ts", content: "delay: (attempt) => 500 * 2 ** attempt" },
      },
      { id: "fixed", label: "Fixed delay" },
    ],
    allowCustom: true,
    allowNotes: true,
  },
];

export function Example({ answer }: { answer: (value: unknown) => void }) {
  return <QuestionPrompt questions={questions} onSubmit={answer} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "The form for one question the agent asks the user. `kind` is `single` (lettered options, one choice), `multi` (several choices, bounded by `minSelections` and `maxSelections`) or `text` (a free-text area). `allowCustom` adds a typed answer as the last option and `allowNotes` adds an optional notes field. An option can carry a `preview` (Markdown or code): from 640px of prompt width it is shown beside the options, below that under the chosen or hovered option. The primary button reads Next while more questions follow and Send on the last one; it stays disabled until the answer is valid. Skip calls `onSkip`, or `onSubmit({ kind: \"skip\" })` when `onSkip` is not set. `initialAnswer` is read only on mount, so remount with `key` when the question changes. QuestionTool and InputBar `questionBar` use this component and handle multi-step navigation for you; render it directly only for a custom flow. Related helpers: `getInitialQuestionDraft`, `canSubmitQuestion`, `buildQuestionAnswer`, `formatQuestionAnswer`.",
      },
      {
        type: "example",
        title: "Wide, with previews",
        previewId: "QuestionPrompt/wide",
        code: `<QuestionPrompt questions={questions} onSubmit={setAnswer} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "QuestionPrompt/narrow",
        code: `<div style={{ width: 360 }}>
  <QuestionPrompt questions={questions} onSubmit={setAnswer} />
</div>`,
      },
      {
        type: "example",
        title: "Free text",
        previewId: "QuestionPrompt/text",
        code: `<QuestionPrompt
  questions={[{ kind: "text", title: "What should the release be called?", placeholder: "For example 0.2.0" }]}
  allowSkip={false}
  submitLabel="Save"
  onSubmit={setAnswer}
/>`,
      },
    ],
  },
  {
    name: "InputPopover",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { Button, Stack } from "@mantine/core";
import { InputPopover } from "@sinups/ai-kit";

export function Example({ branches }: { branches: string[] }) {
  const [branch, setBranch] = useState(branches[0]);
  const [open, setOpen] = useState(false);

  return (
    <InputPopover
      open={open}
      onOpenChange={setOpen}
      trigger={<Button size="xs" variant="default">{branch}</Button>}
    >
      <Stack gap={2} p={4}>
        {branches.map((name) => (
          <Button
            key={name}
            size="xs"
            variant="subtle"
            onClick={() => {
              setBranch(name);
              setOpen(false);
            }}
          >
            {name}
          </Button>
        ))}
      </Stack>
    </InputPopover>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A thin wrapper over Mantine Popover with the dropdown look of the composer pickers (ModelPicker, ModeSelector). Use it for your own toolbar controls in InputBar `leftActions` or `rightActions` so they match. The trigger element's own `onClick` still runs and then toggles the dropdown; a non-element trigger is wrapped in a span. It works controlled (`open` and `onOpenChange`) or uncontrolled (`defaultOpen`). `side` and `align` map to Mantine positions (`top` and `start` by default, so it opens above the composer), `sideOffset` sets the gap. The dropdown renders in a portal, so it is not clipped by a narrow widget.",
      },
      {
        type: "example",
        title: "Branch picker",
        previewId: "InputPopover/basic",
        code: `<InputPopover
  open={open}
  onOpenChange={setOpen}
  side="bottom"
  trigger={<Button size="xs" variant="default">{branch}</Button>}
>
  {branchList}
</InputPopover>`,
      },
    ],
  },
  {
    name: "ImageLightbox",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { ImageLightbox, type LightboxImage } from "@sinups/ai-kit";

export function Example({ images }: { images: LightboxImage[] }) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      {images.map((image, position) => (
        <button key={image.id} type="button" onClick={() => setIndex(position)}>
          {image.filename}
        </button>
      ))}
      <ImageLightbox
        open={index !== null}
        onClose={() => setIndex(null)}
        images={images}
        initialIndex={index ?? 0}
      />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A fullscreen image viewer rendered into `document.body`. It traps focus, locks page scroll and returns focus to the opener on close. Close with the X button, a click on the backdrop or Escape. With more than one image it shows previous and next buttons, dots and a counter, and ArrowLeft and ArrowRight navigate with wrap-around. UserMessage already opens it for attached images; use it directly for images elsewhere, such as tool output. It renders nothing when closed or when the active image has no `url`.",
      },
      {
        type: "example",
        title: "Gallery",
        previewId: "ImageLightbox/gallery",
        code: `<ImageLightbox
  open={index !== null}
  onClose={() => setIndex(null)}
  images={images}
  initialIndex={index ?? 0}
/>`,
      },
    ],
  },
  {
    name: "CodeBlock",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { CodeBlock, createShikiHighlighter } from "@sinups/ai-kit";
import { createHighlighter } from "shiki";

const shiki = await createHighlighter({
  themes: ["github-light", "github-dark"],
  langs: ["ts", "bash"],
});
const highlighter = createShikiHighlighter(shiki, { light: "github-light", dark: "github-dark" });

export function Example({ code }: { code: string }) {
  return (
    <CodeBlock
      code={code}
      language="ts"
      title="src/upload/retry.ts"
      highlighter={highlighter}
      withLineNumbers
      collapsedLines={20}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A code block with a header (the `title`, or the language), a copy button, optional line numbers and optional collapsing. Without `highlighter` the code is plain text; pass any function that returns token lines, or adapt a shiki instance you created with `createShikiHighlighter`, which uses a light and a dark theme so colors follow the color scheme. Results are cached, and async highlighters render plain text until tokens arrive. `collapsedLines` hides the rest behind `Show N more lines` only when at least 5 lines would be hidden; `streaming` pauses collapsing so new lines stay visible. Long lines scroll horizontally, or wrap with `wrapLines`, which reads better in narrow widgets. Markdown uses CodeBlock for fenced code, and AgentChat passes its `highlighter` prop down. Related helpers: `countCodeLines`, `getCollapsedLineCount`, `highlightCode`, `useHighlightedLines`, `clearHighlightCache`.",
      },
      {
        type: "example",
        title: "Line numbers and collapsing",
        previewId: "CodeBlock/basic",
        code: `<CodeBlock code={code} language="ts" title="src/upload/retry.ts" withLineNumbers collapsedLines={12} />
<CodeBlock code="yarn test src/upload --watch=false" language="bash" />`,
      },
      {
        type: "example",
        title: "Narrow: scroll or wrap",
        previewId: "CodeBlock/narrow",
        code: `<CodeBlock code={code} language="ts" />
<CodeBlock code={code} language="ts" wrapLines />`,
      },
    ],
  },
  {
    name: "FileExtIcon",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentModeIcon, FileExtIcon, PlanModeIcon, type ModeOption } from "@sinups/ai-kit";

const modes: ModeOption[] = [
  { id: "agent", label: "Agent", icon: AgentModeIcon },
  { id: "plan", label: "Plan", icon: PlanModeIcon },
];

export function Example({ path }: { path: string }) {
  return (
    <span>
      <FileExtIcon filename={path} size={14} /> {path}
    </span>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Small language icons for file names: TypeScript (`ts`, `tsx`), JavaScript (`js`, `jsx`, `mjs`, `cjs`) and JSON (`json`, `jsonc`). For any other extension it renders nothing, so place a generic file icon next to it when you need one. `size` defaults to 10px, matching tool rows; EditTool and the DiffReview file icons use it. `AgentModeIcon` and `PlanModeIcon` are the icons of the two default composer modes; pass them as `icon` in ModeSelector options. All icons use Mantine color variables and follow the color scheme.",
      },
      {
        type: "example",
        title: "Icons",
        previewId: "FileExtIcon/basic",
        code: `<FileExtIcon filename="retry.ts" size={16} />
<FileExtIcon filename="index.js" size={16} />
<FileExtIcon filename="package.json" size={16} />
<AgentModeIcon size={16} />
<PlanModeIcon size={16} />`,
      },
    ],
  },
  {
    name: "ShellOutput",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ShellOutput } from "@sinups/ai-kit";

export function Example({ output, exitCode, durationMs }: { output: string; exitCode: number; durationMs: number }) {
  return <ShellOutput output={output} exitCode={exitCode} durationMs={durationMs} maxLines={12} />;
}

export function Running({ output, startedAt }: { output: string; startedAt: number }) {
  return <ShellOutput output={output} live startedAt={startedAt} timeoutMs={120_000} defaultExpanded />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Terminal output as a log: ANSI colors and styles, clickable links, pretty-printed JSON (when the whole output is a JSON object or array and has no ANSI codes), a copy button that strips ANSI codes, and a meta line with exit code (green for 0, red otherwise), duration, timeout and size. Collapsed, it shows the last `maxLines` lines (12 by default) with a `+N more lines` hint and a Show all toggle; expanded, the log scrolls up to `maxHeight`. With `live` it shows Running, ticks the duration from `startedAt`, follows new lines, and offers Scroll to latest when the user scrolls up. Empty output shows `No output`. `variant=\"compact\"` drops the tinted panel for use inside another card. BashTool renders it for Bash tool parts; use it directly for any other command output. Related helpers: `parseAnsiLines`, `stripAnsi`, `hasAnsi`, `splitLinks`, `formatJsonOutput`, `tailLines`, `byteLength`, `formatBytes`, and `getBashRunInfo`, which reads output and metadata from a Bash tool part.",
      },
      {
        type: "example",
        title: "Finished commands",
        previewId: "ShellOutput/basic",
        code: `<ShellOutput output={testOutput} exitCode={1} durationMs={2_410} maxLines={8} />
<ShellOutput output={jsonOutput} exitCode={0} durationMs={1_830} />`,
      },
      {
        type: "example",
        title: "Live, narrow",
        previewId: "ShellOutput/live",
        code: `<ShellOutput
  output={lines.join("\\n")}
  live={!done}
  exitCode={done ? 0 : undefined}
  startedAt={startedAt}
  timeoutMs={120_000}
  defaultExpanded
  maxHeight={200}
/>`,
      },
    ],
  },
  {
    name: "DiffView",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { DiffView } from "@sinups/ai-kit";

export function Example({ before, after }: { before: string; after: string }) {
  return <DiffView oldText={before} newText={after} language="ts" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A unified line diff of two strings with line numbers, add and remove gutter markers and, for replaced lines, highlighted changed words (`wordHighlight`, off by default). Pass a `highlighter` and `language` to color the code; highlighting is combined with the change marks. Long lines scroll horizontally; set `wrapLines` in narrow containers. It shows the whole file without collapsing unchanged regions, so use it for edits of a few dozen lines. EditTool and EditToolDiffCard render it for Edit and Write tool parts. For multi-file review with split view and collapsed context, use DiffReview. Related helpers: `diffLines` and `countDiffStats`.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "DiffView/wide",
        code: `<DiffView oldText={before} newText={after} />`,
      },
      {
        type: "example",
        title: "Narrow, wrapped",
        previewId: "DiffView/narrow",
        code: `<div style={{ width: 360 }}>
  <DiffView oldText={before} newText={after} wrapLines />
</div>`,
      },
    ],
  },
  {
    name: "ActionRow",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { ActionRow, type StepState, type ToolCallStep } from "@sinups/ai-kit";

const step: ToolCallStep = {
  id: "step-1",
  type: "tool-call",
  toolName: "Updated upload client",
  toolDetail: "src/upload/client.ts",
  duration: 2_000,
};

export function Example() {
  const [state, setState] = useState<StepState>("animating");
  return <ActionRow step={step} state={state} index={0} onComplete={() => setState("complete")} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "A row for scripted timelines rather than live tool parts. While `state` is `animating` it shows a rotating shimmer label (`Brewing...`, `Crafting...`, chosen by `index`); after `step.duration` milliseconds it calls `onComplete`, and once complete it shows `step.toolName`. Use it for product tours, demos and onboarding replays built from `ToolCallStep` objects. For real agent output, render tool parts with ToolRenderer or MessageList instead. `useToolComplete` is the hook behind the timer.",
      },
      {
        type: "example",
        title: "Animated step",
        previewId: "ActionRow/basic",
        code: `<ActionRow step={step} state={state} index={0} onComplete={() => setState("complete")} />`,
      },
    ],
  },
  {
    name: "ToolRowBase",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { Code } from "@mantine/core";
import { ToolRowBase } from "@sinups/ai-kit";
import { IconFileText } from "@tabler/icons-react";

export function Example({ running, preview }: { running: boolean; preview: string }) {
  return (
    <ToolRowBase
      icon={<IconFileText size={12} />}
      shimmerLabel="Reading"
      completeLabel="Read"
      detail="src/upload/retry.ts"
      isAnimating={running}
      expandable={!running}
    >
      <Code block>{preview}</Code>
    </ToolRowBase>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "The single-line row most tool cards are built on: a 12px icon, a label that shimmers while `isAnimating` (`shimmerLabel`) and settles to `completeLabel`, a muted truncated `detail`, and optional `trailingContent` such as elapsed time. With `expandable` the row becomes a button with a chevron and reveals `children` in a Collapse; it works uncontrolled (`defaultOpen`) or controlled (`expanded` with `onToggleExpand`). Other Mantine Box props pass through to the root, so you can add `data-*` attributes and style props. Use it to build a custom tool renderer that sits in the same visual rhythm as the built-in cards. ContextEventRow, HookActivity, ActionRow and GenericToolRow are built on it. The detail truncates, so the row fits any width.",
      },
      {
        type: "example",
        title: "Running and expandable",
        previewId: "ToolRowBase/basic",
        code: `<ToolRowBase
  icon={<IconGitBranch size={12} />}
  shimmerLabel="Checking out branch"
  completeLabel="Checked out"
  detail="fix/upload-retry"
  isAnimating={running}
/>
<ToolRowBase
  icon={<IconFileText size={12} />}
  completeLabel="Read"
  detail="src/upload/retry.ts"
  isAnimating={false}
  expandable
  trailingContent={<Text span size="xs" c="dimmed">24 lines</Text>}
>
  <Code block>{preview}</Code>
</ToolRowBase>`,
      },
    ],
  },
  {
    name: "ToolRenderer",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ToolRenderer, type CustomToolRendererProps, type ToolPart } from "@sinups/ai-kit";

function DeployCard({ input, status, onAction }: CustomToolRendererProps) {
  return (
    <button type="button" onClick={() => onAction?.("approve", input)}>
      Deploy · {status}
    </button>
  );
}

export function Example({ part, chatStatus }: { part: ToolPart; chatStatus: string }) {
  return (
    <ToolRenderer
      part={part}
      chatStatus={chatStatus}
      toolRenderers={{ "tool-Deploy": DeployCard }}
      onToolAction={(toolCallId, action, payload) => console.log(toolCallId, action, payload)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render one tool part (AI SDK v5 shape: `{ type, toolCallId, state, input, output }`) with the matching card: `tool-Bash` → BashTool, `tool-Edit` and `tool-Write` → EditTool, `tool-Grep`, `tool-Glob` and `tool-WebSearch` → SearchTool, `tool-TodoWrite` → TodoTool, `tool-PlanWrite` → PlanTool, `tool-Question` → QuestionTool, `tool-Task` and `tool-Agent` → ToolGroup with `nestedTools`, `tool-Thinking` → ThinkingTool, `tool-mcp__<server>__<tool>` → McpTool. Types listed in `toolRegistry` render as GenericTool with a title, and anything else as a generic row with the tool name. `dynamic-tool` parts are routed by their `toolName`. Entries in `toolRenderers` are keyed by the full part type (`tool-Bash`, `tool-mcp__git__search`) and take precedence over built-in cards; a bare name only matches `mcp__user-tools__<name>`. They receive `name`, `input`, `output` (unwrapped for MCP), `status` (`streaming`, `pending`, `success`, `error`), `part` and `onAction`, which reports to `onToolAction`. Pass `chatStatus` so a tool without output is shown as pending while the chat streams and as finished after it stops. MessageList uses ToolRenderer for every tool part, so in a chat you usually pass `toolRenderers` to AgentChat instead. The card parts are also exported for custom layouts: `BashToolTerminalCard`, `EditToolDiffCard`, `SearchGroupRich`, `ThinkingCollapsed` and `GenericToolRow`.",
      },
      {
        type: "example",
        title: "Built-in cards",
        previewId: "ToolRenderer/built-in",
        code: `{parts.map((part) => (
  <ToolRenderer key={part.toolCallId} part={part} chatStatus="streaming" />
))}`,
      },
      {
        type: "example",
        title: "Custom renderer",
        previewId: "ToolRenderer/custom",
        code: `<ToolRenderer
  part={deployPart}
  chatStatus="streaming"
  toolRenderers={{ "tool-Deploy": DeployCard }}
  onToolAction={(toolCallId, action, payload) => handle(toolCallId, action, payload)}
/>`,
      },
    ],
  },
];
