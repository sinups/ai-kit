"use client";

import React, { useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Button,
  Code,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  ActionRow,
  AgentChat,
  AgentModeIcon,
  ChatHeader,
  CodeBlock,
  ContextBreakdown,
  ContextEventRow,
  ContextUsage,
  DiffView,
  FileExtIcon,
  HookActivity,
  IdleReturnPrompt,
  ImageLightbox,
  InputPopover,
  PastedTextAttachment,
  PlanModeIcon,
  PromptHistorySearch,
  QuestionPrompt,
  ShellOutput,
  SpendThresholdNotice,
  ToolRenderer,
  ToolRowBase,
  ToolUnavailableNotice,
  TranscriptSearch,
  TurnSummary,
  findTextMatches,
  stepMatchIndex,
  type ChatMessage,
  type ContextBreakdownGroup,
  type ContextSuggestion,
  type CustomToolRendererProps,
  type LightboxImage,
  type PastedText,
  type QuestionAnswer,
  type QuestionConfig,
  type StepState,
  type ToolApprovals,
  type ToolCallStep,
  type ToolPart,
} from "@sinups/ai-kit";
import {
  IconFileText,
  IconGitBranch,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
} from "@tabler/icons-react";
import { NarrowFrame, ResultBlock, WideFrame, noop } from "./frames";

const CONTEXT_GROUPS: ContextBreakdownGroup[] = [
  { id: "system", label: "System prompt", tokens: 6_200 },
  {
    id: "tools",
    label: "Tools",
    items: [
      { id: "bash", label: "Bash", tokens: 2_900 },
      { id: "edit", label: "Edit", tokens: 2_100 },
      { id: "grep", label: "Grep", tokens: 1_400 },
    ],
  },
  {
    id: "mcpTools",
    label: "MCP tools",
    items: [
      { id: "postgres", label: "postgres", tokens: 11_800, description: "14 tools" },
      { id: "issues", label: "issues", tokens: 9_600, description: "22 tools" },
      { id: "git", label: "git", tokens: 4_300, description: "9 tools" },
      { id: "filesystem", label: "filesystem", tokens: 3_100, description: "11 tools" },
    ],
  },
  {
    id: "memory",
    label: "Memory files",
    items: [
      { id: "project", label: "AGENTS.md", tokens: 2_400, description: "./AGENTS.md" },
      { id: "user", label: "AGENTS.md", tokens: 900, description: "~/.config/agent/AGENTS.md" },
    ],
  },
  { id: "skills", label: "Skills", tokens: 1_700 },
  { id: "messages", label: "Messages", tokens: 71_500 },
];

const CONTEXT_SUGGESTIONS: ContextSuggestion[] = [
  {
    severity: "warning",
    title: "Disable unused MCP servers",
    description: "postgres and issues were not called in this session.",
    savings: 21_400,
    action: { label: "Review", onClick: noop },
  },
  {
    severity: "info",
    title: "Compact the conversation",
    description: "Older messages are replaced with a summary.",
    savings: 52_000,
    action: { label: "Compact", onClick: noop },
  },
];

function ContextBreakdownPreview({ narrow = false }: { narrow?: boolean }) {
  const content = (
    <div className="p-4">
      <ContextBreakdown
        groups={CONTEXT_GROUPS}
        total={200_000}
        suggestions={CONTEXT_SUGGESTIONS}
        defaultExpanded={["mcpTools"]}
      />
    </div>
  );
  return narrow ? <NarrowFrame>{content}</NarrowFrame> : <WideFrame>{content}</WideFrame>;
}

function ContextBreakdownPopoverPreview() {
  return (
    <Group justify="center" className="w-full py-6">
      <ContextUsage
        used={120_500}
        total={200_000}
        breakdown={CONTEXT_GROUPS}
        suggestions={CONTEXT_SUGGESTIONS}
        withLabel
      />
    </Group>
  );
}

function ContextEventsPreview() {
  return (
    <NarrowFrame className="p-3">
      <Stack gap={2}>
        <ContextEventRow kind="file" label="src/upload/client.ts" detail="214 lines" />
        <ContextEventRow
          kind="directory"
          label="src/upload"
          detail="5 entries"
          items={["client.ts", "retry.ts", "retry.test.ts", "types.ts", "index.ts"]}
          defaultExpanded
        />
        <ContextEventRow kind="memory" label="AGENTS.md" />
        <ContextEventRow kind="mcp-resource" label="postgres://schema/public" />
        <ContextEventRow kind="skill" label="release-notes" />
        <ContextEventRow kind="diagnostics" label="src/upload/retry.ts" detail="2 errors" />
      </Stack>
    </NarrowFrame>
  );
}

function TurnSummaryPreview() {
  return (
    <Stack gap="sm" className="w-full max-w-xl">
      <TurnSummary durationMs={123_000} />
      <TurnSummary durationMs={47_000} tokens={40_200} tokenBudget={100_000} />
      <TurnSummary durationMs={3_900_000} tokens={182_000} backgroundTasks={2} />
    </Stack>
  );
}

function HookActivityPreview() {
  return (
    <NarrowFrame className="p-3">
      <Stack gap={2}>
        <HookActivity event="PreToolUse" status="running" />
        <HookActivity
          event="PostToolUse"
          status="done"
          hooks={[
            { name: "npm run lint -- --fix", durationMs: 1_840 },
            { name: "./scripts/format.sh", durationMs: 420 },
          ]}
        />
        <HookActivity
          event="PreToolUse"
          status="blocked"
          reason="Writes outside the workspace are not allowed: /etc/hosts"
          hooks={[{ name: "./hooks/guard-paths.sh", durationMs: 35 }]}
        />
        <HookActivity
          event="Stop"
          status="error"
          hooks={[
            {
              name: "./hooks/notify.sh",
              durationMs: 5_000,
              error: "Command timed out after 5s",
            },
          ]}
        />
      </Stack>
    </NarrowFrame>
  );
}

const TRANSCRIPT = [
  "Find why uploads retry forever when the network drops.",
  "The retry loop in src/upload/retry.ts has no attempt limit. I added a limit of 3 retries with exponential backoff.",
  "Add a test for the retry limit.",
  "Added retry.test.ts: it checks that the fourth retry is not scheduled.",
];

function TranscriptSearchPreview() {
  const [query, setQuery] = useState("retry");
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(true);

  const perMessage = TRANSCRIPT.map((text) => (opened ? findTextMatches(text, query) : []));
  const offsets = perMessage.map((_, message) =>
    perMessage.slice(0, message).reduce((sum, ranges) => sum + ranges.length, 0),
  );
  const total = perMessage.reduce((sum, ranges) => sum + ranges.length, 0);
  const activeIndex = total === 0 ? -1 : Math.min(active, total - 1);

  return (
    <NarrowFrame height={360} className="relative">
      <div className="absolute right-3 top-3 left-3 z-10">
        {opened ? (
          <TranscriptSearch
            value={query}
            onChange={(value) => {
              setQuery(value);
              setActive(0);
            }}
            activeIndex={activeIndex}
            total={total}
            onNext={() => setActive(stepMatchIndex(activeIndex, total, 1))}
            onPrevious={() => setActive(stepMatchIndex(activeIndex, total, -1))}
            onClose={() => setOpened(false)}
          />
        ) : (
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={() => setOpened(true)}>
              Search
            </Button>
          </Group>
        )}
      </div>
      <Stack gap="sm" className="h-full overflow-auto px-3 pb-3 pt-16">
        {TRANSCRIPT.map((text, message) => {
          const ranges = perMessage[message];
          const pieces: React.ReactNode[] = ranges.flatMap((range, index) => [
            text.slice(index === 0 ? 0 : ranges[index - 1].end, range.start),
            <mark
              key={range.start}
              data-active={offsets[message] + index === activeIndex || undefined}
              className="bg-yellow-200 text-black data-[active]:bg-orange-300"
            >
              {text.slice(range.start, range.end)}
            </mark>,
          ]);
          pieces.push(text.slice(ranges.length > 0 ? ranges[ranges.length - 1].end : 0));
          return (
            <Text key={message} size="sm" c={message % 2 === 0 ? undefined : "dimmed"}>
              {pieces}
            </Text>
          );
        })}
      </Stack>
    </NarrowFrame>
  );
}

const PROMPT_HISTORY = [
  "Explain what src/upload/client.ts does",
  "Add a retry limit to the upload client",
  "Write tests for the retry limit",
  "Run the test suite and fix failures",
  "Summarize the changes in this branch\nGroup them by module\nKeep it under ten lines",
];

function PromptHistorySearchPreview() {
  const [opened, setOpened] = useState(false);
  const [picked, setPicked] = useState("");
  return (
    <Stack align="center" gap="sm" className="w-full">
      <Button variant="default" onClick={() => setOpened(true)}>
        Search prompts
      </Button>
      {picked && <Code block>{picked}</Code>}
      <PromptHistorySearch
        opened={opened}
        onClose={() => setOpened(false)}
        history={PROMPT_HISTORY}
        onSelect={setPicked}
      />
    </Stack>
  );
}

const PASTED_LOG = Array.from(
  { length: 240 },
  (_, index) =>
    `2026-09-17T10:${String(Math.floor(index / 60)).padStart(2, "0")}:${String(index % 60).padStart(2, "0")}Z upload chunk ${index + 1} ok`,
).join("\n");

function PastedTextAttachmentPreview() {
  const [pastes, setPastes] = useState<PastedText[]>([
    { id: 1, text: PASTED_LOG, lines: 240 },
    { id: 2, text: PASTED_LOG.split("\n").slice(0, 64).join("\n"), lines: 64 },
  ]);
  return (
    <Group gap="xs" className="w-full max-w-xl">
      {pastes.map((paste) => (
        <PastedTextAttachment
          key={paste.id}
          paste={paste}
          onRemove={() => setPastes((prev) => prev.filter((item) => item.id !== paste.id))}
        />
      ))}
      {pastes.length === 0 && (
        <Text size="sm" c="dimmed">
          All pastes removed
        </Text>
      )}
    </Group>
  );
}

function NoticesPreview() {
  const [log, setLog] = useState("");
  const [spendVisible, setSpendVisible] = useState(true);
  return (
    <Stack gap="md" className="w-full max-w-2xl">
      <IdleReturnPrompt
        awayMs={3 * 60 * 60 * 1000}
        tokens={182_000}
        onContinue={() => setLog("continue")}
        onNewChat={() => setLog("new chat")}
        onDontAskAgain={() => setLog("don't ask again")}
      />
      {spendVisible ? (
        <SpendThresholdNotice
          amount={20.4}
          limit={50}
          actions={[
            { label: "View usage", onClick: () => setLog("view usage"), kind: "primary" },
            { label: "Set a limit", onClick: () => setLog("set a limit") },
          ]}
          onDismiss={() => setSpendVisible(false)}
        />
      ) : (
        <Button size="xs" variant="default" onClick={() => setSpendVisible(true)}>
          Show spend notice again
        </Button>
      )}
      <ResultBlock value={log || null} />
    </Stack>
  );
}

function NoticesNarrowPreview() {
  return (
    <NarrowFrame className="p-3">
      <Stack gap="sm">
        <IdleReturnPrompt awayMs={45 * 60 * 1000} onContinue={noop} onNewChat={noop} />
        <SpendThresholdNotice amount={5} currency="EUR" locale="de" onDismiss={noop} />
      </Stack>
    </NarrowFrame>
  );
}

const QUESTIONS: QuestionConfig[] = [
  {
    kind: "single",
    title: "Which retry strategy should the upload client use?",
    options: [
      {
        id: "exponential",
        label: "Exponential backoff",
        description: "500ms, 1s, 2s",
        preview: {
          kind: "code",
          language: "ts",
          content: "await withRetry(upload, {\n  retries: 3,\n  delay: (attempt) => 500 * 2 ** attempt,\n});",
        },
      },
      {
        id: "fixed",
        label: "Fixed delay",
        description: "1s between attempts",
        preview: {
          kind: "code",
          language: "ts",
          content: "await withRetry(upload, {\n  retries: 3,\n  delay: () => 1000,\n});",
        },
      },
      { id: "none", label: "No retries", description: "fail on the first error" },
    ],
    allowCustom: true,
    allowNotes: true,
  },
];

function QuestionPromptPreview({ narrow = false }: { narrow?: boolean }) {
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  const content = (
    <div className="p-3">
      <QuestionPrompt questions={QUESTIONS} onSubmit={setAnswer} />
      <ResultBlock value={answer} />
    </div>
  );
  return narrow ? <NarrowFrame>{content}</NarrowFrame> : <WideFrame>{content}</WideFrame>;
}

function QuestionPromptTextPreview() {
  const [answer, setAnswer] = useState<QuestionAnswer | null>(null);
  return (
    <NarrowFrame className="p-3">
      <QuestionPrompt
        questions={[
          {
            kind: "text",
            title: "What should the release be called?",
            placeholder: "For example 0.2.0",
          },
        ]}
        allowSkip={false}
        submitLabel="Save"
        onSubmit={setAnswer}
      />
      <ResultBlock value={answer} />
    </NarrowFrame>
  );
}

const BRANCHES = ["main", "fix/upload-retry", "feat/export-dialog", "chore/deps"];

function InputPopoverPreview() {
  const [branch, setBranch] = useState(BRANCHES[1]);
  const [open, setOpen] = useState(false);
  return (
    <Group justify="center" className="w-full py-10">
      <InputPopover
        open={open}
        onOpenChange={setOpen}
        side="bottom"
        align="start"
        trigger={
          <Button size="xs" variant="default" leftSection={<IconGitBranch size={14} />}>
            {branch}
          </Button>
        }
      >
        <Stack gap={2} p={4} miw={200}>
          {BRANCHES.map((name) => (
            <Button
              key={name}
              size="xs"
              variant={name === branch ? "light" : "subtle"}
              color="gray"
              justify="flex-start"
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
    </Group>
  );
}

const svgImage = (label: string, from: string, to: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><text x="600" y="420" font-family="sans-serif" font-size="64" fill="white" text-anchor="middle">${label}</text></svg>`,
  )}`;

const LIGHTBOX_IMAGES: LightboxImage[] = [
  { id: "login", url: svgImage("login-screen.png", "royalblue", "teal"), filename: "login-screen.png" },
  { id: "error", url: svgImage("upload-error.png", "darkorange", "crimson"), filename: "upload-error.png" },
  { id: "chart", url: svgImage("latency-chart.png", "seagreen", "steelblue"), filename: "latency-chart.png" },
];

function ImageLightboxPreview() {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <Group justify="center" gap="sm" className="w-full">
      {LIGHTBOX_IMAGES.map((image, position) => (
        <UnstyledButton
          key={image.id}
          onClick={() => setIndex(position)}
          aria-label={`Open ${image.filename}`}
        >
          <Image src={image.url} alt={image.filename} w={112} h={80} radius="md" fit="cover" />
        </UnstyledButton>
      ))}
      <ImageLightbox
        open={index !== null}
        onClose={() => setIndex(null)}
        images={LIGHTBOX_IMAGES}
        initialIndex={index ?? 0}
      />
    </Group>
  );
}

const RETRY_CODE = `import { sleep } from "./sleep";

export interface RetryOptions {
  retries: number;
  delay: (attempt: number) => number;
}

export async function withRetry<T>(run: () => Promise<T>, options: RetryOptions): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await run();
    } catch (error) {
      if (attempt >= options.retries) {
        throw error;
      }
      await sleep(options.delay(attempt));
      attempt += 1;
    }
  }
}

export const exponential = (base: number) => (attempt: number) => base * 2 ** attempt;
export const fixed = (ms: number) => () => ms;
export const jitter = (delay: (attempt: number) => number) => (attempt: number) =>
  Math.round(delay(attempt) * (0.5 + Math.random()));
export const DEFAULT_RETRY: RetryOptions = { retries: 3, delay: exponential(500) };
export const NO_RETRY: RetryOptions = { retries: 0, delay: fixed(0) };`;

function CodeBlockPreview() {
  return (
    <Stack gap="md" className="w-full max-w-2xl">
      <CodeBlock code={RETRY_CODE} language="ts" title="src/upload/retry.ts" withLineNumbers collapsedLines={12} />
      <CodeBlock code="yarn test src/upload --watch=false" language="bash" />
    </Stack>
  );
}

function CodeBlockNarrowPreview() {
  return (
    <NarrowFrame className="p-3">
      <Stack gap="sm">
        <CodeBlock code={RETRY_CODE.split("\n").slice(0, 12).join("\n")} language="ts" />
        <CodeBlock code={RETRY_CODE.split("\n").slice(0, 12).join("\n")} language="ts" wrapLines />
      </Stack>
    </NarrowFrame>
  );
}

function FileExtIconPreview() {
  const files = ["retry.ts", "Uploader.tsx", "index.js", "package.json", "README.md"];
  return (
    <Stack gap="md" className="w-full max-w-sm">
      {files.map((file) => (
        <Group key={file} gap="xs" wrap="nowrap">
          <FileExtIcon filename={file} size={16} />
          {file.endsWith(".md") && <IconFileText size={16} />}
          <Text size="sm" ff="monospace">
            {file}
          </Text>
        </Group>
      ))}
      <Group gap="md">
        <Group gap={6}>
          <AgentModeIcon size={16} />
          <Text size="sm">Agent</Text>
        </Group>
        <Group gap={6}>
          <PlanModeIcon size={16} />
          <Text size="sm">Plan</Text>
        </Group>
      </Group>
    </Stack>
  );
}

const TEST_OUTPUT = [
  "[1m> upload@0.4.0 test[22m",
  "",
  " [32m✓[39m src/upload/client.test.ts [2m(12 tests)[22m",
  " [32m✓[39m src/upload/chunk.test.ts [2m(8 tests)[22m",
  " [31m✗[39m src/upload/retry.test.ts [2m(5 tests | 1 failed)[22m",
  "",
  "[31m FAIL [39m src/upload/retry.test.ts > stops after 3 retries",
  "AssertionError: expected 4 calls to equal 3",
  "  at src/upload/retry.test.ts:41:23",
  "",
  " Test Files  [31m1 failed[39m | [32m2 passed[39m (3)",
  "      Tests  [31m1 failed[39m | [32m24 passed[39m (25)",
  "   Duration  2.41s",
  "",
  "Docs: https://example.com/testing/retries",
].join("\n");

function ShellOutputPreview() {
  return (
    <Stack gap="lg" className="w-full max-w-2xl">
      <ShellOutput output={TEST_OUTPUT} exitCode={1} durationMs={2_410} maxLines={8} />
      <ShellOutput
        output='{"status":"ok","uploaded":42,"failed":0,"durationMs":1830}'
        exitCode={0}
        durationMs={1_830}
      />
    </Stack>
  );
}

const BUILD_STEPS = 17;

function ShellOutputLivePreview() {
  const [lines, setLines] = useState<string[]>(["$ yarn build"]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const done = lines.length > BUILD_STEPS + 1;

  useEffect(() => {
    if (done) return undefined;
    const id = window.setTimeout(() => {
      setLines((prev) =>
        prev.length > BUILD_STEPS
          ? [...prev, "\u001b[32mBuild finished\u001b[39m"]
          : [...prev, `compiled module ${prev.length} of ${BUILD_STEPS}`],
      );
    }, 500);
    return () => window.clearTimeout(id);
  }, [done, lines]);

  return (
    <NarrowFrame className="p-3">
      <Stack gap="xs">
        <ShellOutput
          output={lines.join("\n")}
          live={!done}
          exitCode={done ? 0 : undefined}
          startedAt={startedAt}
          timeoutMs={120_000}
          defaultExpanded
          maxHeight={200}
        />
        {done && (
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setStartedAt(Date.now());
              setLines(["$ yarn build"]);
            }}
          >
            Run again
          </Button>
        )}
      </Stack>
    </NarrowFrame>
  );
}

const DIFF_OLD = `export async function upload(file: File) {
  const token = await api.refresh(session.refreshToken);
  return api.put(file, { token });
}`;

const DIFF_NEW = `export async function upload(file: File) {
  const token = await withRetry(() => api.refresh(session.refreshToken), DEFAULT_RETRY);
  return api.put(file, { token, timeoutMs: 30_000 });
}`;

function DiffViewPreview({ narrow = false }: { narrow?: boolean }) {
  const content = (
    <div className="p-3">
      <DiffView oldText={DIFF_OLD} newText={DIFF_NEW} wrapLines={narrow} />
    </div>
  );
  return narrow ? <NarrowFrame>{content}</NarrowFrame> : <WideFrame>{content}</WideFrame>;
}

const ACTION_STEP: ToolCallStep = {
  id: "step-1",
  type: "tool-call",
  toolName: "Updated upload client",
  toolDetail: "src/upload/client.ts",
  duration: 2_000,
};

function ActionRowPreview() {
  const [state, setState] = useState<StepState>("animating");
  return (
    <Stack gap="sm" className="w-full max-w-md">
      <ActionRow step={ACTION_STEP} state={state} index={0} onComplete={() => setState("complete")} />
      <Button size="xs" variant="default" disabled={state === "animating"} onClick={() => setState("animating")}>
        Replay
      </Button>
    </Stack>
  );
}

function ToolRowBasePreview() {
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setTimeout(() => setRunning(false), 2_500);
    return () => window.clearTimeout(id);
  }, [running]);

  return (
    <NarrowFrame className="p-3">
      <Stack gap={2}>
        <ToolRowBase
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
          trailingContent={
            <Text span size="xs" c="dimmed">
              24 lines
            </Text>
          }
        >
          <Code block>{RETRY_CODE.split("\n").slice(0, 8).join("\n")}</Code>
        </ToolRowBase>
        <Button size="xs" variant="default" mt="sm" disabled={running} onClick={() => setRunning(true)}>
          Replay
        </Button>
      </Stack>
    </NarrowFrame>
  );
}

const RENDERER_PARTS: ToolPart[] = [
  {
    type: "tool-Grep",
    toolCallId: "grep-1",
    state: "output-available",
    input: { pattern: "refreshToken", path: "src" },
    output: {
      results: [
        { path: "src/upload/client.ts", line: 42 },
        { path: "src/auth/session.ts", line: 118 },
      ],
    },
  },
  {
    type: "tool-Bash",
    toolCallId: "bash-1",
    state: "output-available",
    input: { command: "yarn test src/upload", description: "Run upload tests" },
    output: { stdout: TEST_OUTPUT, exitCode: 1, durationMs: 2_410 },
  },
  {
    type: "tool-Edit",
    toolCallId: "edit-1",
    state: "output-available",
    input: {
      file_path: "src/upload/client.ts",
      old_string: "const token = await api.refresh(session.refreshToken);",
      new_string: "const token = await withRetry(() => api.refresh(session.refreshToken), DEFAULT_RETRY);",
    },
    output: "File updated",
  },
  {
    type: "tool-mcp__postgres__query",
    toolCallId: "mcp-1",
    state: "output-available",
    input: { sql: "select count(*) from uploads where status = 'failed'" },
    output: [{ type: "text", text: '[{"count": 17}]' }],
  },
  {
    type: "tool-Deploy",
    toolCallId: "deploy-1",
    state: "input-available",
    input: { environment: "staging" },
  },
];

function ToolRendererPreview() {
  return (
    <Stack gap={4} className="w-full max-w-2xl">
      {RENDERER_PARTS.map((part) => (
        <ToolRenderer key={part.toolCallId} part={part} chatStatus="streaming" />
      ))}
    </Stack>
  );
}

function DeployCard({ input, status, onAction }: CustomToolRendererProps) {
  const environment = (input as { environment?: string }).environment ?? "unknown";
  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" wrap="nowrap">
        <Text size="sm">
          Deploy to <b>{environment}</b> · {status}
        </Text>
        <Button size="xs" onClick={() => onAction?.("approve", { environment })}>
          Approve
        </Button>
      </Group>
    </Paper>
  );
}

function ToolRendererCustomPreview() {
  const [action, setAction] = useState<unknown>(null);
  return (
    <Stack gap="xs" className="w-full max-w-xl">
      <ToolRenderer
        part={RENDERER_PARTS[4]}
        chatStatus="streaming"
        toolRenderers={{ "tool-Deploy": DeployCard }}
        onToolAction={(toolCallId, name, payload) => setAction({ toolCallId, name, payload })}
      />
      <ResultBlock value={action} />
    </Stack>
  );
}

function ChatHeaderPreview({ narrow }: { narrow?: boolean }) {
  const [inspector, setInspector] = useState(true);
  const header = (
    <ChatHeader
      title="Flaky upload test in the release pipeline"
      subtitle="claude-opus-5 · acme workspace"
      leftSection={
        <ActionIcon variant="subtle" color="gray" aria-label="Toggle the sidebar">
          <IconLayoutSidebar size={18} />
        </ActionIcon>
      }
      secondarySection={
        <Badge size="sm" variant="light" color="teal">
          3 servers
        </Badge>
      }
      rightSection={
        <Group gap="sm" wrap="nowrap">
          <ContextUsage used={128_000} total={200_000} />
          <ActionIcon
            variant={inspector ? "light" : "subtle"}
            color="gray"
            aria-label="Toggle the inspector"
            onClick={() => setInspector((open) => !open)}
          >
            <IconLayoutSidebarRight size={18} />
          </ActionIcon>
        </Group>
      }
    />
  );
  return narrow ? <NarrowFrame>{header}</NarrowFrame> : <WideFrame>{header}</WideFrame>;
}

function ToolUnavailablePreview() {
  const [log, setLog] = useState("");
  const [visible, setVisible] = useState(true);
  return (
    <Stack gap="md" className="w-full max-w-2xl">
      {visible ? (
        <ToolUnavailableNotice
          server="tracker"
          message="The connection dropped after three attempts."
          onRetry={() => setLog("retry")}
          onDismiss={() => setVisible(false)}
        />
      ) : (
        <Button size="xs" variant="default" onClick={() => setVisible(true)}>
          Show the notice again
        </Button>
      )}
      <ToolUnavailableNotice message="The tool is no longer registered on this server." />
      <ResultBlock value={log || null} />
    </Stack>
  );
}

const APPROVAL_CALL_ID = "call-create-issue";

const APPROVAL_MESSAGES: ChatMessage[] = [
  {
    id: "u1",
    role: "user",
    parts: [{ type: "text", text: "File the flaky upload test in the tracker." }],
  },
  {
    id: "a1",
    role: "assistant",
    parts: [
      { type: "text", text: "I will open an issue with the failing run attached." },
      {
        type: "tool-mcp__tracker__create_issue",
        toolCallId: APPROVAL_CALL_ID,
        state: "input-available",
        input: { title: "Flaky upload test", project: "pipeline" },
      },
    ],
  },
];

function AgentChatApprovalsPreview() {
  const [approvals, setApprovals] = useState<ToolApprovals>({
    [APPROVAL_CALL_ID]: {
      isPending: true,
      reason: "Creates an issue in the tracker workspace",
      requestedBy: { name: "triage agent", color: "blue" },
      approveOptions: [
        { value: "once", label: "Allow once" },
        { value: "session", label: "Allow for this session" },
      ],
      onApprove: (scope) =>
        setApprovals({ [APPROVAL_CALL_ID]: { outcome: { decision: "approved", scope } } }),
      onReject: () =>
        setApprovals({ [APPROVAL_CALL_ID]: { outcome: { decision: "rejected" } } }),
    },
  });
  return (
    <WideFrame height={420}>
      <AgentChat
        messages={APPROVAL_MESSAGES}
        status="ready"
        onSend={noop}
        onStop={noop}
        contentWidth="100%"
        approvals={approvals}
      />
    </WideFrame>
  );
}

export function renderChatExtrasPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "ContextBreakdown":
    case "ContextBreakdown/wide":
      return <ContextBreakdownPreview />;
    case "ContextBreakdown/narrow":
      return <ContextBreakdownPreview narrow />;
    case "ContextBreakdown/in-context-usage":
      return <ContextBreakdownPopoverPreview />;
    case "ContextEventRow":
    case "ContextEventRow/kinds":
      return <ContextEventsPreview />;
    case "TurnSummary":
    case "TurnSummary/basic":
      return <TurnSummaryPreview />;
    case "HookActivity":
    case "HookActivity/statuses":
      return <HookActivityPreview />;
    case "TranscriptSearch":
    case "TranscriptSearch/basic":
      return <TranscriptSearchPreview />;
    case "PromptHistorySearch":
    case "PromptHistorySearch/basic":
      return <PromptHistorySearchPreview />;
    case "PastedTextAttachment":
    case "PastedTextAttachment/basic":
      return <PastedTextAttachmentPreview />;
    case "ChatHeader":
    case "ChatHeader/wide":
      return <ChatHeaderPreview />;
    case "ChatHeader/narrow":
      return <ChatHeaderPreview narrow />;
    case "ToolUnavailableNotice":
    case "ToolUnavailableNotice/basic":
      return <ToolUnavailablePreview />;
    case "AgentChat/approvals":
      return <AgentChatApprovalsPreview />;
    case "IdleReturnPrompt":
    case "IdleReturnPrompt/wide":
    case "SpendThresholdNotice":
    case "SpendThresholdNotice/wide":
      return <NoticesPreview />;
    case "IdleReturnPrompt/narrow":
    case "SpendThresholdNotice/narrow":
      return <NoticesNarrowPreview />;
    case "QuestionPrompt":
    case "QuestionPrompt/wide":
      return <QuestionPromptPreview />;
    case "QuestionPrompt/narrow":
      return <QuestionPromptPreview narrow />;
    case "QuestionPrompt/text":
      return <QuestionPromptTextPreview />;
    case "InputPopover":
    case "InputPopover/basic":
      return <InputPopoverPreview />;
    case "ImageLightbox":
    case "ImageLightbox/gallery":
      return <ImageLightboxPreview />;
    case "CodeBlock":
    case "CodeBlock/basic":
      return <CodeBlockPreview />;
    case "CodeBlock/narrow":
      return <CodeBlockNarrowPreview />;
    case "FileExtIcon":
    case "FileExtIcon/basic":
      return <FileExtIconPreview />;
    case "ShellOutput":
    case "ShellOutput/basic":
      return <ShellOutputPreview />;
    case "ShellOutput/live":
      return <ShellOutputLivePreview />;
    case "DiffView":
    case "DiffView/wide":
      return <DiffViewPreview />;
    case "DiffView/narrow":
      return <DiffViewPreview narrow />;
    case "ActionRow":
    case "ActionRow/basic":
      return <ActionRowPreview />;
    case "ToolRowBase":
    case "ToolRowBase/basic":
      return <ToolRowBasePreview />;
    case "ToolRenderer":
    case "ToolRenderer/built-in":
      return <ToolRendererPreview />;
    case "ToolRenderer/custom":
      return <ToolRendererCustomPreview />;
    default:
      return undefined;
  }
}
