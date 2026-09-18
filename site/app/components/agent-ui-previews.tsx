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
  ToolApprovalFooter,
  type ChatMessage,
  type ChatStatus,
  type CompletionItem,
  type CompletionSource,
  type ElicitationRequestedSchema,
  type QueuedMessage,
} from "@sinups/ai-kit";

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

function ToolApprovalCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-hidden rounded-[10px] border border-border">
      <div className="px-3 py-2 font-mono text-xs text-muted-foreground">
        $ yarn test --coverage
      </div>
      {children}
    </div>
  );
}

function ToolApprovalScopesPreview() {
  const [result, setResult] = useState("");
  const [run, setRun] = useState(0);
  return (
    <div className="w-full">
      <ToolApprovalCard>
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
      </ToolApprovalCard>
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
      <ToolApprovalCard>
        <ToolApprovalFooter labels={{ approve: "Run", reject: "Skip" }} onApprove={noop} />
      </ToolApprovalCard>
      <ToolApprovalCard>
        <ToolApprovalFooter isPending labels={{ approve: "Run", reject: "Cancel" }} />
      </ToolApprovalCard>
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
