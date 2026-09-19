"use client";

import React, { useState } from "react";
import { Box, Group, MantineThemeProvider, SegmentedControl, Stack, Switch } from "@mantine/core";
import {
  AgentChat,
  AgentStatus,
  BackgroundTasksPanel,
  ChatInspectorLayout,
  DiffReview,
  MessageList,
  ThinkingTool,
  quietPresentation,
  rowsPresentation,
  type AgentChatLabels,
  type AgentChatProps,
  type ChatMessage,
  type FileDecision,
  type ToolOutputFormatters,
  type ToolPart,
} from "@sinups/ai-kit";
import { DIFF_FIXTURES } from "./diff";
import { WideFrame, noop } from "./frames";
import { SESSION_MESSAGES } from "./sessions";
import { createTasks } from "./tasks";

type ToolCatalog = NonNullable<AgentChatProps["toolCatalog"]>;
type ToolArgsFormatters = NonNullable<AgentChatProps["toolArgs"]>;

function mcpResult(structuredContent: Record<string, unknown>) {
  return { content: [{ type: "text", text: JSON.stringify(structuredContent) }], structuredContent };
}

const CATALOG: ToolCatalog = {
  mcp__issues__list_issues: {
    title: "Find issues",
    description: "Lists issues that match a filter",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        assignee: { type: "string", description: "Login of the assignee, `__me__` for the caller" },
        state: { type: "string", enum: ["open", "closed"] },
      },
    },
    outputSchema: {
      type: "object",
      required: ["issues"],
      properties: {
        issues: {
          type: "array",
          title: "Issues",
          items: {
            type: "object",
            required: ["key", "title"],
            properties: { key: { type: "string" }, title: { type: "string" } },
          },
        },
      },
    },
  },
  mcp__git__log: {
    title: "Read the commit log",
    annotations: { readOnlyHint: true },
    outputSchema: {
      type: "object",
      properties: { commits: { type: "array", title: "Commits" } },
    },
  },
  mcp__issues__create_issue: { title: "Create an issue", annotations: { destructiveHint: false } },
};

const ISSUES_PART: ToolPart = {
  type: "tool-mcp__issues__list_issues",
  toolCallId: "issues",
  state: "output-available",
  input: { assignee: "__me__", state: "open" },
  output: mcpResult({
    issues: [
      { key: "PAY-12", title: "Retry refunds after a gateway timeout" },
      { key: "PAY-15", title: "Flaky upload test" },
      { key: "PAY-18", title: "Invoice totals round twice" },
      { key: "PAY-21", title: "Document the webhook payload" },
    ],
  }),
};

const TRANSCRIPT: ChatMessage[] = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "What is assigned to me, and what changed on main today?" }] },
  {
    id: "a1",
    role: "assistant",
    parts: [
      {
        type: "tool-Thinking",
        toolCallId: "think",
        state: "output-available",
        input: { thought: "Check the tracker first, then the commit log of main." },
      },
      ISSUES_PART,
      {
        type: "tool-mcp__git__log",
        toolCallId: "log",
        state: "output-available",
        input: { branch: "main", since: "today" },
        output: mcpResult({
          commits: [
            { sha: "4f2a91c", message: "fix(billing): round invoice totals once" },
            { sha: "b81d0e7", message: "test(upload): retry the flaky upload once" },
          ],
        }),
      },
      {
        type: "text",
        text: "You have **4 open issues**. Two commits landed on main today; one of them fixes PAY-18.",
      },
    ],
  },
];

type Presentation = "cards" | "rows" | "quiet";

const PRESENTATIONS = {
  cards: "cards",
  rows: rowsPresentation,
  quiet: quietPresentation,
} as const;

function PresentationPreview({ standalone = false }: { standalone?: boolean }) {
  const [presentation, setPresentation] = useState<Presentation>("quiet");
  const [evenSpacing, setEvenSpacing] = useState(false);
  const common = {
    messages: TRANSCRIPT,
    status: "ready" as const,
    contentWidth: "100%",
    presentation: PRESENTATIONS[presentation],
    toolCatalog: CATALOG,
    evenSpacing,
    initialScrollBehavior: "top" as const,
  };
  return (
    <Stack gap="sm" className="w-full">
      <Group justify="space-between" gap="xs" wrap="wrap">
        <SegmentedControl
          size="xs"
          value={presentation}
          onChange={(value) => setPresentation(value as Presentation)}
          data={[
            { value: "cards", label: "Cards" },
            { value: "rows", label: "Rows" },
            { value: "quiet", label: "Quiet" },
          ]}
        />
        <Switch
          size="xs"
          label="evenSpacing"
          checked={evenSpacing}
          onChange={(event) => setEvenSpacing(event.currentTarget.checked)}
        />
      </Group>
      <WideFrame height={440}>
        {standalone ? (
          <MessageList {...common} className="h-full" />
        ) : (
          <AgentChat {...common} onSend={noop} onStop={noop} />
        )}
      </WideFrame>
    </Stack>
  );
}

const TOOL_ARGS: ToolArgsFormatters = {
  "tool-mcp__issues__list_issues": (_part, { args }) =>
    `${args.state === "closed" ? "Closed" : "Open"} issues of ${args.assignee === "__me__" ? "me" : String(args.assignee)}`,
};

const TOOL_OUTPUTS: ToolOutputFormatters = {
  "tool-mcp__issues__*": (_part, { state, summary }) => (state === "done" ? `${summary} in the tracker` : null),
};

function ToolCatalogPreview() {
  const [locale, setLocale] = useState("en-US");
  const [withCatalog, setWithCatalog] = useState(true);
  return (
    <Stack gap="sm" className="w-full">
      <Group justify="space-between" gap="xs" wrap="wrap">
        <Switch
          size="xs"
          label="toolCatalog, toolArgs, toolOutputs"
          checked={withCatalog}
          onChange={(event) => setWithCatalog(event.currentTarget.checked)}
        />
        <SegmentedControl
          size="xs"
          value={locale}
          onChange={setLocale}
          data={[
            { value: "en-US", label: "en-US" },
            { value: "de-DE", label: "de-DE" },
          ]}
        />
      </Group>
      <WideFrame height={360}>
        <AgentChat
          messages={TRANSCRIPT}
          status="ready"
          onSend={noop}
          onStop={noop}
          contentWidth="100%"
          presentation={quietPresentation}
          toolCatalog={withCatalog ? CATALOG : undefined}
          toolArgs={withCatalog ? TOOL_ARGS : undefined}
          toolOutputs={withCatalog ? TOOL_OUTPUTS : undefined}
          locale={locale}
          initialScrollBehavior="top"
        />
      </WideFrame>
    </Stack>
  );
}

const GERMAN_LABELS: Partial<AgentChatLabels> = {
  placeholder: "Nachricht schreiben…",
  thinkingTool: {
    thinking: "Denkt nach",
    thought: (duration) => (duration ? `${duration} nachgedacht` : "Nachgedacht"),
  },
  durationUnits: { hours: " Std.", minutes: " Min.", seconds: " s", milliseconds: " ms" },
  messageList: {
    working: "Arbeitet",
    planning: "Wird vorbereitet…",
    toolRuns: {
      thought: "nachgedacht",
      otherTools: (count) => `${count} ${count === 1 ? "Werkzeug" : "Werkzeuge"} genutzt`,
    },
  },
  mcpTool: {
    items: (count) => `${count} Einträge`,
    empty: "Nichts gefunden",
    more: (count) => `${count} weitere`,
    arguments: "Argumente",
    result: "Ergebnis",
    failed: "Fehler",
  },
  toolApproval: {
    approve: "Erlauben",
    reject: "Ablehnen",
    approved: "Erlaubt",
    skipped: "Übersprungen",
    scopes: { once: "einmal", session: "für diese Sitzung" },
  },
};

const APPROVAL_TRANSCRIPT: ChatMessage[] = [
  ...TRANSCRIPT,
  { id: "u2", role: "user", parts: [{ type: "text", text: "Open an issue for the flaky upload test." }] },
  {
    id: "a2",
    role: "assistant",
    parts: [
      {
        type: "tool-mcp__issues__create_issue",
        toolCallId: "create",
        state: "input-available",
        input: { title: "Flaky upload test", labels: ["ci"] },
      },
    ],
  },
];

function LabelsPreview() {
  const [german, setGerman] = useState(true);
  const [decision, setDecision] = useState<string | null>(null);
  return (
    <Stack gap="sm" className="w-full">
      <Switch
        size="xs"
        label="German labels"
        checked={german}
        onChange={(event) => setGerman(event.currentTarget.checked)}
      />
      <WideFrame height={460}>
        <AgentChat
          messages={APPROVAL_TRANSCRIPT}
          status="ready"
          onSend={noop}
          onStop={noop}
          contentWidth="100%"
          presentation={quietPresentation}
          toolCatalog={CATALOG}
          locale={german ? "de-DE" : "en-US"}
          labels={german ? GERMAN_LABELS : undefined}
          approvals={{
            create: decision
              ? { outcome: { decision: "approved", scope: decision } }
              : {
                  approveOptions: [
                    { value: "once", label: german ? "Einmal erlauben" : "Allow once" },
                    { value: "session", label: german ? "Für diese Sitzung" : "Allow for this session" },
                  ],
                  onApprove: (scope) => setDecision(scope ?? "once"),
                  onReject: () => setDecision(null),
                },
          }}
        />
      </WideFrame>
    </Stack>
  );
}

const RUNNING_TRANSCRIPT: ChatMessage[] = [
  { id: "u1", role: "user", parts: [{ type: "text", text: "Find the slow queries from last night." }] },
  {
    id: "a1",
    role: "assistant",
    parts: [
      {
        type: "tool-mcp__postgres__query",
        toolCallId: "query",
        state: "input-available",
        input: { sql: "select query, mean_exec_time from pg_stat_statements order by 2 desc limit 5" },
      },
    ],
  },
];

function WorkingRowPreview() {
  const [custom, setCustom] = useState(false);
  const [toolActivity, setToolActivity] = useState(true);
  const [startedAt] = useState(() => Date.now());
  return (
    <Stack gap="sm" className="w-full">
      <Group gap="md" wrap="wrap">
        <Switch
          size="xs"
          label="AgentStatus as workingRow"
          checked={custom}
          onChange={(event) => setCustom(event.currentTarget.checked)}
        />
        <Switch
          size="xs"
          label="toolActivity"
          checked={toolActivity}
          onChange={(event) => setToolActivity(event.currentTarget.checked)}
        />
      </Group>
      <WideFrame height={320}>
        <AgentChat
          messages={RUNNING_TRANSCRIPT}
          status="streaming"
          onSend={noop}
          onStop={noop}
          contentWidth="100%"
          toolActivity={toolActivity}
          workingRow={custom ? <AgentStatus label="Querying postgres" startedAt={startedAt} tokens={1840} /> : true}
        />
      </WideFrame>
    </Stack>
  );
}

const THINKING_PART: ToolPart = {
  type: "tool-Thinking",
  toolCallId: "think-labels",
  state: "output-available",
  input: { thought: "The retry should cover network errors and 5xx only; 401 stays final." },
};

function ThinkingLabelsPreview() {
  return (
    <div className="w-full max-w-xl">
      <ThinkingTool
        part={THINKING_PART}
        labels={{
          thinking: "Reasoning",
          thought: (duration) => (duration ? `Reasoned for ${duration}` : "Reasoned"),
        }}
      />
    </div>
  );
}

/** Keeps the drawer of the compact layout inside the preview instead of covering the docs page */
function ContainedOverlays({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <Box pos="relative" h="100%" style={{ transform: "translateZ(0)", overflow: "hidden" }}>
      <MantineThemeProvider
        theme={{ components: { Portal: { defaultProps: { target: target ?? undefined } } } }}
      >
        {target && children}
      </MantineThemeProvider>
      <div ref={setTarget} />
    </Box>
  );
}

function ChatInspectorPreview({ compact = false }: { compact?: boolean }) {
  const [opened, setOpened] = useState(!compact);
  const [decisions, setDecisions] = useState<Record<string, FileDecision>>({});
  const [tasks] = useState(() => createTasks());
  return (
    <Stack gap="sm" className="w-full">
      <Switch
        size="xs"
        label="Inspector opened"
        checked={opened}
        onChange={(event) => setOpened(event.currentTarget.checked)}
      />
      <WideFrame height={520}>
        <ContainedOverlays>
        <ChatInspectorLayout
          style={{ height: "100%" }}
          compact={compact}
          opened={opened}
          onOpenedChange={setOpened}
          minChatWidth="280px"
          minInspectorWidth="260px"
          panels={[
            {
              id: "changes",
              label: "Changes",
              content: (
                <DiffReview
                  changes={DIFF_FIXTURES}
                  decisions={decisions}
                  onAccept={(change) => setDecisions((current) => ({ ...current, [change.path]: "accepted" }))}
                  onReject={(change) => setDecisions((current) => ({ ...current, [change.path]: "rejected" }))}
                  withHotkeys={false}
                />
              ),
            },
            { id: "tasks", label: "Tasks", content: <BackgroundTasksPanel tasks={tasks} /> },
          ]}
        >
          <AgentChat
            messages={SESSION_MESSAGES}
            status="ready"
            onSend={noop}
            onStop={noop}
            contentWidth="100%"
            wrapLines
            alignComposer
          />
        </ChatInspectorLayout>
        </ContainedOverlays>
      </WideFrame>
    </Stack>
  );
}

export function renderTranscriptPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "AgentChat/presentation":
      return <PresentationPreview />;
    case "AgentChat/tool-catalog":
      return <ToolCatalogPreview />;
    case "AgentChat/labels":
      return <LabelsPreview />;
    case "AgentChat/working-row":
      return <WorkingRowPreview />;
    case "MessageList/presentation":
      return <PresentationPreview standalone />;
    case "ChatInspectorLayout":
    case "ChatInspectorLayout/wide":
      return <ChatInspectorPreview />;
    case "ChatInspectorLayout/compact":
      return <ChatInspectorPreview compact />;
    case "ThinkingTool/labels":
      return <ThinkingLabelsPreview />;
    default:
      return undefined;
  }
}
