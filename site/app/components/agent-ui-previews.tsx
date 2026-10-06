"use client";

import React, { useEffect, useState } from "react";
import {
  AgentChat,
  AgentStatus,
  CompactBoundary,
  ContextUsage,
  ElicitationForm,
  ErrorMessage,
  InputBar,
  MessageList,
  createMediaPartRenderers,
  ToolApprovalCard,
  ToolApprovalFooter,
  type ChatMessage,
  type ChatStatus,
  type CompletionItem,
  type CompletionSource,
  type ElicitationRequestedSchema,
  type QueuedMessage,
} from "@sinups/ai-kit";

import { BASE_PATH } from "../lib/site";
import { renderAgentsPreview } from "./previews/agents";
import { renderChatActionsPreview } from "./previews/chat-actions";
import { renderChatExtrasPreview } from "./previews/chat-extras";
import { renderComposerPreview } from "./previews/composer";
import { renderConfigExtrasPreview } from "./previews/config-extras";
import { renderLauncherPreview } from "./previews/launcher";
import { renderTranscriptPreview } from "./previews/transcript";
import { renderDiffPreview } from "./previews/diff";
import { renderHelpPreview } from "./previews/help";
import { renderHooksPreview } from "./previews/hooks";
import { renderMcpPreview } from "./previews/mcp";
import { renderPermissionsPreview } from "./previews/permissions";
import { renderPrimitivePreview } from "./previews/primitives";
import { renderSessionsPreview } from "./previews/sessions";
import { renderSettingsPreview } from "./previews/settings";
import { renderSkillsPreview } from "./previews/skills";
import { renderTasksPreview } from "./previews/tasks";

const noop = () => {};

export const deploySchema: ElicitationRequestedSchema = {
  type: "object",
  properties: {
    environment: {
      type: "string",
      title: "Environment",
      oneOf: [
        { const: "staging", title: "Staging" },
        { const: "production", title: "Production" },
      ],
    },
    replicas: {
      type: "integer",
      title: "Replicas",
      minimum: 1,
      maximum: 10,
      default: 2,
    },
    notify: { type: "string", title: "Notify email", format: "email" },
    dryRun: { type: "boolean", title: "Dry run", default: true },
  },
  required: ["environment"],
};

const contextSegments = [
  { label: "System prompt", value: 4200 },
  { label: "Tools", value: 18_600 },
  { label: "Messages", value: 22_400 },
];

const compactionSummary =
  "- Migrated the upload client to the new API\n- Tests for backoff are green\n- Open question: keep the 5 attempt limit?";

export const toolRunMessages: ChatMessage[] = [
  {
    id: "run-u1",
    role: "user",
    parts: [{ type: "text", text: "Where is the retry logic for uploads?" }],
  },
  {
    id: "run-a1",
    role: "assistant",
    parts: [
      {
        type: "tool-Grep",
        toolCallId: "run-grep-1",
        state: "output-available",
        input: { pattern: "retry", path: "src/upload" },
        output: { numFiles: 4 },
      },
      {
        type: "tool-Read",
        toolCallId: "run-read-1",
        state: "output-available",
        input: { file_path: "src/upload/client.ts" },
        output: "",
      },
      {
        type: "tool-Read",
        toolCallId: "run-read-2",
        state: "output-available",
        input: { file_path: "src/upload/backoff.ts" },
        output: "",
      },
      {
        type: "tool-Glob",
        toolCallId: "run-glob-1",
        state: "output-available",
        input: { pattern: "src/upload/**/*.test.ts" },
        output: { numFiles: 2 },
      },
      {
        type: "text",
        text: "Retries live in `src/upload/backoff.ts`: exponential backoff with up to 5 attempts.",
      },
    ],
  },
];

export const compactedMessages: ChatMessage[] = [
  {
    id: "cmp-s1",
    role: "system",
    parts: [
      {
        type: "compaction",
        tokensBefore: 182_400,
        tokensAfter: 12_300,
        summary: compactionSummary,
      },
    ],
  },
  {
    id: "cmp-u1",
    role: "user",
    parts: [{ type: "text", text: "Keep 5 attempts and ship it." }],
  },
  {
    id: "cmp-a1",
    role: "assistant",
    parts: [{ type: "text", text: "Done: the limit stays at 5 attempts." }],
  },
];

const commandItems: CompletionItem[] = [
  { value: "review", label: "/review", description: "Review the current diff", group: "Commands" },
  { value: "compact", label: "/compact", description: "Summarize the conversation", group: "Commands" },
  { value: "bug", label: "/bug", description: "Report a problem with the last answer", group: "Feedback" },
];

const people = ["alice", "bob", "carol", "dmitry"];

const completions: CompletionSource[] = [
  { trigger: "/", items: commandItems },
  {
    trigger: "@",
    items: (query) =>
      people
        .filter((name) => name.startsWith(query.toLowerCase()))
        .map((name) => ({ value: name, label: `@${name}` })),
  },
];

function Result({ value }: { value: string }) {
  if (!value) return null;
  return (
    <pre className="mt-3 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
      {value}
    </pre>
  );
}

function ElicitationFormPreview() {
  const [result, setResult] = useState("");
  return (
    <div className="w-full max-w-xl">
      <ElicitationForm
        serverName="deploy-server"
        message="Choose where to deploy the new build."
        requestedSchema={deploySchema}
        onAccept={(content) =>
          setResult(JSON.stringify({ action: "accept", content }, null, 2))
        }
        onDecline={() => setResult('{ "action": "decline" }')}
        onCancel={() => setResult('{ "action": "cancel" }')}
      />
      <Result value={result} />
    </div>
  );
}

function ElicitationUrlPreview() {
  return (
    <div className="w-full max-w-xl">
      <ElicitationForm
        mode="url"
        serverName="git"
        message="Authorize access to your repositories to continue."
        url="https://git.example.com/login/oauth/authorize"
        onAccept={noop}
        onDecline={noop}
      />
    </div>
  );
}

function useTicker(active: boolean) {
  const [startedAt] = useState(() => Date.now());
  const [tokens, setTokens] = useState(0);
  const [lastActivityAt, setLastActivityAt] = useState(startedAt);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setTokens((value) => value + 137);
      setLastActivityAt(Date.now());
    }, 400);
    const stop = window.setTimeout(() => window.clearInterval(id), 5000);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [active]);

  return { startedAt, tokens, lastActivityAt };
}

function AgentStatusPreview() {
  const [run, setRun] = useState(0);
  return <AgentStatusRun key={run} onRestart={() => setRun((value) => value + 1)} />;
}

function AgentStatusRun({ onRestart }: { onRestart: () => void }) {
  const { startedAt, tokens, lastActivityAt } = useTicker(true);
  return (
    <div className="flex w-full max-w-xl flex-col items-start gap-3">
      <AgentStatus
        startedAt={startedAt}
        tokens={tokens}
        lastActivityAt={lastActivityAt}
        labels={{ stalled: "Waiting for response", stop: "Restart" }}
        onStop={onRestart}
      />
      <p className="text-xs text-muted-foreground">
        Tokens stop after 5 seconds; 3 seconds later the line turns stalled.
      </p>
    </div>
  );
}

function AgentStatusPausedPreview() {
  const [startedAt] = useState(() => Date.now());
  return <AgentStatus label="Running tools" startedAt={startedAt} paused />;
}

function ContextUsageLevelsPreview() {
  return (
    <div className="flex items-center gap-8">
      <ContextUsage used={45_200} total={200_000} segments={contextSegments} withLabel />
      <ContextUsage used={168_000} total={200_000} withLabel onCompact={noop} />
      <ContextUsage used={194_000} total={200_000} withLabel onCompact={noop} />
    </div>
  );
}

function ContextUsageInputBarPreview() {
  const [used, setUsed] = useState(168_000);
  return (
    <div className="w-full">
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contentWidth="100%"
        rightActions={
          <ContextUsage
            used={used}
            total={200_000}
            segments={[
              { label: "System prompt", value: 4200 },
              { label: "Tools", value: 18_600 },
              { label: "Messages", value: Math.max(0, used - 22_800) },
            ]}
            onCompact={() => setUsed(24_000)}
          />
        }
      />
    </div>
  );
}

function ShellToolCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-[10px] border border-border">
      <div className="px-3 py-2 font-mono text-xs text-muted-foreground">
        $ yarn test --coverage
      </div>
      {children}
    </div>
  );
}

const JOB_CALL = {
  action: "smart_search",
  org_uid: "1106955086989844481",
  params: { limit: 10, mode: "best_match" },
};

function JobsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ToolApprovalRequestPreview() {
  const [answer, setAnswer] = useState("");
  return (
    <div className="flex w-full flex-col gap-3">
      <ToolApprovalCard
        key={answer}
        tool={{ name: "Find jobs" }}
        server={{ name: "Jobs board", icon: <JobsIcon /> }}
        params={JOB_CALL}
        onDecline={() => setAnswer("declined")}
        onAllowOnce={() => setAnswer("allowed once")}
        onAlwaysAllow={() => setAnswer("allowed from now on")}
      />
      {answer && (
        <button
          type="button"
          className="self-start text-xs text-muted-foreground underline"
          onClick={() => setAnswer("")}
        >
          {answer} — ask again
        </button>
      )}
    </div>
  );
}

function ToolApprovalFoldedPreview() {
  return (
    <div className="flex w-full flex-col gap-4">
      <ToolApprovalCard
        tool={{ name: "Find jobs" }}
        server={{ name: "Jobs board", icon: <JobsIcon /> }}
        params={JOB_CALL}
        defaultExpanded={false}
        onDecline={noop}
        onAllowOnce={noop}
        onAlwaysAllow={noop}
      />
      <ToolApprovalCard
        tool={{ name: "Find jobs" }}
        server={{ name: "Jobs board", icon: <JobsIcon /> }}
        params={JOB_CALL}
        decision="once"
        onDecline={noop}
        onAllowOnce={noop}
        onAlwaysAllow={noop}
      />
    </div>
  );
}

function ToolApprovalScopesPreview() {
  const [result, setResult] = useState("");
  const [run, setRun] = useState(0);
  return (
    <div className="w-full">
      <ShellToolCard>
        <ToolApprovalFooter
          key={run}
          labels={{ approve: "Allow", reject: "Deny" }}
          reason="Runs a shell command"
          approveOptions={[
            { value: "once", label: "Allow once" },
            { value: "session", label: "Allow for this session" },
            {
              value: "always",
              label: "Always allow",
              description: "Saved to project settings",
            },
          ]}
          onApprove={(scope) => setResult(`approved: ${scope ?? "default"}`)}
          onReject={() => setResult("rejected")}
          onRejectWithFeedback={(feedback) => setResult(`rejected with feedback: ${feedback}`)}
        />
      </ShellToolCard>
      {result && (
        <button
          type="button"
          className="mt-3 text-xs text-muted-foreground underline"
          onClick={() => {
            setResult("");
            setRun((value) => value + 1);
          }}
        >
          {result} — reset
        </button>
      )}
    </div>
  );
}

function ToolApprovalBasicPreview() {
  return (
    <div className="flex w-full flex-col gap-3">
      <ShellToolCard>
        <ToolApprovalFooter labels={{ approve: "Run", reject: "Skip" }} onApprove={noop} />
      </ShellToolCard>
      <ShellToolCard>
        <ToolApprovalFooter isPending labels={{ approve: "Run", reject: "Cancel" }} />
      </ShellToolCard>
    </div>
  );
}

function ErrorRetryPreview() {
  const [retryAt, setRetryAt] = useState(() => Date.now() + 8000);
  const [attempt, setAttempt] = useState(2);
  return (
    <div className="w-full">
      <ErrorMessage
        title="API overloaded"
        message="The provider is temporarily overloaded."
        retry={{ attempt, maxAttempts: 10, retryAt }}
        onRetry={() => {
          setAttempt((value) => Math.min(10, value + 1));
          setRetryAt(Date.now() + 8000);
        }}
      />
    </div>
  );
}

function ErrorLimitPreview() {
  const [resetsAt] = useState(() => Date.now() + 45 * 60 * 1000);
  return (
    <div className="w-full">
      <ErrorMessage
        variant="warning"
        title="Usage limit reached"
        message="You have used all requests available on your plan."
        resetsAt={resetsAt}
      />
    </div>
  );
}

function InputBarCompletionsPreview() {
  const [log, setLog] = useState("");
  return (
    <div className="flex h-full w-full flex-col justify-end">
      <Result value={log} />
      <InputBar
        status="ready"
        placeholder="Type / for commands or @ to mention"
        onSend={({ content }) => setLog(`sent: ${content}`)}
        onStop={noop}
        completions={completions}
      />
    </div>
  );
}

const SHOE_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23e7f0ff'/%3E%3Cpath d='M28 128h210l44-26-40-16-34 12-52-44-24 26 18 16-32 10z' fill='%23fff' stroke='%231f2a37' stroke-width='3' stroke-linejoin='round'/%3E%3Cpath d='M28 128h254v14H28z' fill='%231f2a37'/%3E%3Ccircle cx='196' cy='84' r='12' fill='%23f59f0a'/%3E%3Cpath d='M108 108l44-22' stroke='%23e8407a' stroke-width='6' stroke-linecap='round'/%3E%3C/svg%3E";

const SCREENSHOT_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect width='320' height='180' fill='%23101418'/%3E%3Crect x='16' y='16' width='288' height='28' rx='6' fill='%231d242c'/%3E%3Crect x='16' y='56' width='150' height='108' rx='6' fill='%231d242c'/%3E%3Crect x='178' y='56' width='126' height='48' rx='6' fill='%232a3440'/%3E%3Crect x='178' y='116' width='126' height='48' rx='6' fill='%232a3440'/%3E%3Cpath d='M30 150l34-40 26 28 20-16 28 28' stroke='%234dabf7' stroke-width='4' fill='none'/%3E%3C/svg%3E";

const sharedMediaMessages = [
  {
    id: "u1",
    role: "user",
    parts: [
      { type: "text", text: "Here is the pair I meant" },
      {
        type: "file",
        url: SHOE_IMAGE,
        mediaType: "image/svg+xml",
        filename: "sneaker.svg",
      },
    ],
  },
  {
    id: "a1",
    role: "assistant",
    parts: [
      { type: "text", text: "Got it. I pulled the sales of that model for the last quarter:" },
      {
        type: "file",
        url: SCREENSHOT_IMAGE,
        mediaType: "image/svg+xml",
        filename: "quarter.svg",
      },
    ],
  },
  {
    id: "a2",
    role: "assistant",
    parts: [
      { type: "text", text: "Anna from support joined and attached the warranty terms." },
      {
        type: "file",
        url: "https://example.com/warranty.pdf",
        mediaType: "application/pdf",
        filename: "warranty.pdf",
        size: 182_400,
      },
    ],
  },
] as ChatMessage[];

const mediaRenderers = createMediaPartRenderers();

function SharedMediaPreview() {
  return (
    <MessageList
      messages={sharedMediaMessages}
      status="ready"
      partRenderers={mediaRenderers}
      contentWidth={720}
      className="h-full"
    />
  );
}

const playerMessages = [
  {
    id: "a1",
    role: "assistant",
    parts: [
      { type: "text", text: "Here is the call you asked about, and the clip from the dashboard:" },
      {
        type: "file",
        url: `${BASE_PATH}/demo/beep.mp3`,
        mediaType: "audio/mpeg",
        filename: "call-excerpt.mp3",
      },
      {
        type: "file",
        url: `${BASE_PATH}/demo/clip.mp4`,
        mediaType: "video/mp4",
        filename: "dashboard.mp4",
      },
    ],
  },
] as ChatMessage[];

function MediaPlayersPreview() {
  return (
    <MessageList
      messages={playerMessages}
      status="ready"
      partRenderers={mediaRenderers}
      contentWidth={720}
      className="h-full"
    />
  );
}

function InputBarCollapsiblePreview() {
  const [opened, setOpened] = useState(false);
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3">
      <InputBar
        collapsible
        collapsedWidth={320}
        placeholder="Ask anything"
        status="ready"
        onSend={noop}
        onStop={noop}
        onAttach={noop}
        onExpand={() => setOpened(true)}
      />
      <p className="text-xs text-muted-foreground">
        {opened ? "Unfolded — the field, the toolbar and the shortcuts are the usual ones." : "Click the line to unfold it."}
      </p>
    </div>
  );
}

function InputBarGlowPreview() {
  const [status, setStatus] = useState<ChatStatus>("ready");
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3">
      <InputBar
        glow
        placeholder="Ask anything"
        status={status}
        onSend={() => {
          setStatus("submitted");
          setTimeout(() => setStatus("ready"), 4200);
        }}
        onStop={() => setStatus("ready")}
        onAttach={noop}
      />
      <button
        type="button"
        className="self-start text-xs text-muted-foreground underline"
        onClick={() => setStatus(status === "ready" ? "streaming" : "ready")}
      >
        {status === "ready" ? "Start a turn" : "Finish the turn"}
      </button>
    </div>
  );
}

function InputBarQueuePreview() {
  const [status, setStatus] = useState<ChatStatus>("streaming");
  const [queue, setQueue] = useState<QueuedMessage[]>([
    { id: "q1", content: "Then run the full test suite and fix anything that fails" },
  ]);
  return (
    <div className="flex h-full w-full flex-col justify-end gap-3">
      <InputBar
        status={status}
        placeholder="Type while the agent is working…"
        onSend={noop}
        onStop={() => setStatus("ready")}
        onQueue={({ content }) =>
          setQueue((prev) => [...prev, { id: `${Date.now()}`, content }])
        }
        queuedMessages={queue}
        onRemoveQueued={(id) => setQueue((prev) => prev.filter((item) => item.id !== id))}
      />
      {status === "ready" && (
        <button
          type="button"
          className="self-center text-xs text-muted-foreground underline"
          onClick={() => setStatus("streaming")}
        >
          Resume streaming
        </button>
      )}
    </div>
  );
}

function InputBarFullWidthPreview() {
  return (
    <div className="w-full">
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contentWidth="100%"
        placeholder="Full-width composer"
      />
    </div>
  );
}

function useLocalChat(initial: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [status, setStatus] = useState<ChatStatus>("ready");

  const onSend = (message: { role: "user"; content: string }) => {
    const id = `${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: `u-${id}`, role: "user", parts: [{ type: "text", text: message.content }] },
    ]);
    setStatus("submitted");
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${id}`,
          role: "assistant",
          parts: [{ type: "text", text: "Noted. I will take it into account." }],
        },
      ]);
      setStatus("ready");
    }, 900);
  };

  return { messages, status, onSend, onStop: () => setStatus("ready") };
}

function AgentChatFullPagePreview() {
  const chat = useLocalChat([...compactedMessages, ...toolRunMessages]);
  return <AgentChat {...chat} contentWidth={760} collapseToolRuns />;
}

export function renderAgentUiPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "ElicitationForm":
    case "ElicitationForm/form":
      return <ElicitationFormPreview />;
    case "ElicitationForm/url":
      return <ElicitationUrlPreview />;
    case "ElicitationForm/disabled":
      return (
        <div className="w-full max-w-xl">
          <ElicitationForm
            disabled
            message="Waiting for the previous request."
            requestedSchema={deploySchema}
          />
        </div>
      );
    case "AgentStatus":
    case "AgentStatus/live":
      return <AgentStatusPreview />;
    case "AgentStatus/paused":
      return <AgentStatusPausedPreview />;
    case "ContextUsage":
    case "ContextUsage/levels":
      return <ContextUsageLevelsPreview />;
    case "ContextUsage/in-input-bar":
      return <ContextUsageInputBarPreview />;
    case "CompactBoundary":
    case "CompactBoundary/summary":
      return (
        <div className="w-full">
          <CompactBoundary tokensBefore={182_400} tokensAfter={12_300} summary={compactionSummary} />
        </div>
      );
    case "CompactBoundary/plain":
      return (
        <div className="flex w-full flex-col gap-8">
          <CompactBoundary tokensAfter={9_800} />
          <CompactBoundary label="History trimmed" />
        </div>
      );
    case "ToolApprovalFooter":
    case "ToolApprovalFooter/scopes":
      return <ToolApprovalScopesPreview />;
    case "ToolApprovalCard":
    case "ToolApprovalCard/basic":
      return <ToolApprovalRequestPreview />;
    case "ToolApprovalCard/folded":
      return <ToolApprovalFoldedPreview />;
    case "ToolApprovalFooter/basic":
      return <ToolApprovalBasicPreview />;
    case "ErrorMessage":
    case "ErrorMessage/basic":
      return (
        <div className="w-full">
          <ErrorMessage
            title="Request failed"
            message="Network error: failed to fetch (status 502 Bad Gateway)"
          />
        </div>
      );
    case "ErrorMessage/retry":
      return <ErrorRetryPreview />;
    case "ErrorMessage/limit":
      return <ErrorLimitPreview />;
    case "InputBar/completions":
      return <InputBarCompletionsPreview />;
    case "InputBar/collapsible":
      return <InputBarCollapsiblePreview />;
    case "InputBar/glow":
      return <InputBarGlowPreview />;
    case "InputBar/queue":
      return <InputBarQueuePreview />;
    case "InputBar/full-width":
      return <InputBarFullWidthPreview />;
    case "MessageList/tool-runs":
      return (
        <MessageList
          messages={toolRunMessages}
          status="ready"
          collapseToolRuns
          contentWidth={720}
          className="h-full"
        />
      );
    case "MediaPart":
    case "MediaPart/shared-images":
      return <SharedMediaPreview />;
    case "MediaPart/players":
      return <MediaPlayersPreview />;
    case "MessageList/compaction":
      return (
        <MessageList
          messages={compactedMessages}
          status="ready"
          contentWidth={720}
          className="h-full"
        />
      );
    case "AgentChat/full-page":
      return <AgentChatFullPagePreview />;
    default:
      return (
        renderPrimitivePreview(previewId) ??
        renderMcpPreview(previewId) ??
        renderPermissionsPreview(previewId) ??
        renderHooksPreview(previewId) ??
        renderChatActionsPreview(previewId) ??
        renderAgentsPreview(previewId) ??
        renderSkillsPreview(previewId) ??
        renderSessionsPreview(previewId) ??
        renderTasksPreview(previewId) ??
        renderDiffPreview(previewId) ??
        renderSettingsPreview(previewId) ??
        renderHelpPreview(previewId) ??
        renderChatExtrasPreview(previewId) ??
        renderComposerPreview(previewId) ??
        renderConfigExtrasPreview(previewId) ??
        renderLauncherPreview(previewId) ??
        renderTranscriptPreview(previewId)
      );
  }
}
