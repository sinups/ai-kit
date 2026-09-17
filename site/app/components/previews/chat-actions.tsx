"use client";

import React, { useState } from "react";
import { Box, Button, Stack, Text } from "@mantine/core";
import {
  CommandChip,
  EditMessageComposer,
  FeedbackForm,
  MemoryNotice,
  MessageActions,
  MessageList,
  PlanApproval,
  RewindDialog,
  ToolResultNotice,
  type ChatMessage,
  type MessageFeedbackValue,
  type MessageListActions,
  type Plan,
  type PlanDecision,
  type SlashCommandInfo,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, wait } from "./frames";

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const CONVERSATION: ChatMessage[] = [
  {
    id: "u1",
    role: "user",
    createdAt: minutesAgo(60 * 26),
    parts: [{ type: "text", text: "Set up a login form with email and password." }],
  },
  { id: "a1", role: "assistant", parts: [{ type: "text", text: "Added `LoginForm` with validation." }] },
  {
    id: "u2",
    role: "user",
    createdAt: minutesAgo(42),
    parts: [{ type: "text", text: "Store the session token in an httpOnly cookie instead of localStorage." }],
  },
  { id: "a2", role: "assistant", parts: [{ type: "text", text: "Moved the token to a cookie set by the API." }] },
  {
    id: "u3",
    role: "user",
    createdAt: minutesAgo(7),
    parts: [{ type: "text", text: "/review src/auth" }],
  },
  {
    id: "a3",
    role: "assistant",
    parts: [{ type: "text", text: "The refresh flow looks good. One nit: `retryDelay` is never reset." }],
  },
];

const COMMANDS: SlashCommandInfo[] = [{ name: "review", description: "Review changes in a path" }];

const PLAN: Plan = {
  id: "auth-refresh",
  title: "Add retry to token refresh",
  summary: `## Goal
Refresh failures should retry with backoff instead of logging the user out.

## Steps
1. Extract \`refreshToken\` from \`src/auth/session.ts\` into \`src/auth/refresh.ts\`
2. Wrap the request in \`withRetry\` (3 attempts, exponential backoff, jitter)
3. Treat \`401\` as final, retry only network errors and \`5xx\`
4. Emit \`auth:refresh-failed\` after the last attempt
5. Add unit tests for success, retry and final failure

## Risks
- Parallel requests may trigger several refreshes; guard with a shared promise
- Backoff must stay under the 10s request timeout`,
};

function reply(text: string, id: string): ChatMessage {
  return { id, role: "assistant", parts: [{ type: "text", text }] };
}

function MessageListActionsPreview({ narrow = false }: { narrow?: boolean }) {
  const [messages, setMessages] = useState(CONVERSATION);
  const [rewindTarget, setRewindTarget] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, MessageFeedbackValue | undefined>>({});
  const [log, setLog] = useState("Hover a message to see its actions");

  const actions: MessageListActions = {
    feedback,
    onEdit: async (messageId, text) => {
      await wait(600);
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === messageId);
        return [
          ...current.slice(0, index),
          { ...current[index], parts: [{ type: "text", text }] },
          reply(`Answer to the edited message: “${text}”`, `edit-${Date.now()}`),
        ];
      });
      setLog(`Edited ${messageId}`);
    },
    onRetry: async (messageId) => {
      await wait(900);
      setMessages((current) => {
        const index = current.findIndex((message) => message.id === messageId);
        return [...current.slice(0, index), reply("A regenerated answer.", `retry-${Date.now()}`)];
      });
      setLog(`Regenerated ${messageId}`);
    },
    onRewind: (messageId) => setRewindTarget(messageId),
    onBranch: (messageId) => setLog(`Branch from ${messageId}`),
    onFeedback: async (messageId, value, details) => {
      await wait(400);
      setFeedback((current) => ({ ...current, [messageId]: value }));
      setLog(`Feedback ${value} on ${messageId}${details ? ` ${JSON.stringify(details)}` : ""}`);
    },
  };

  const content = (
    <div className="flex h-full flex-col">
      <Text size="xs" c="dimmed" px="sm" py={6}>
        {log}
      </Text>
      <div className="min-h-0 flex-1">
        <MessageList
          messages={messages}
          status="ready"
          contentWidth="100%"
          initialScrollBehavior="top"
          messageActions={actions}
          commands={COMMANDS}
          className="h-full"
        />
      </div>
      <RewindDialog
        opened={rewindTarget !== null}
        onClose={() => setRewindTarget(null)}
        messages={messages}
        defaultMessageId={rewindTarget ?? undefined}
        onRewind={async ({ messageId, mode }) => {
          await wait(700);
          setMessages((current) => current.slice(0, current.findIndex((message) => message.id === messageId)));
          setLog(`Rewound before ${messageId} (${mode})`);
        }}
      />
    </div>
  );
  return narrow ? <NarrowFrame height={520}>{content}</NarrowFrame> : <WideFrame height={520}>{content}</WideFrame>;
}

function MessageActionsPreview() {
  const [log, setLog] = useState<string[]>([]);
  const push = (entry: string) => setLog((current) => [entry, ...current].slice(0, 4));
  return (
    <div className="mx-auto w-full max-w-md">
      <Stack gap="lg">
        <Box data-message-actions-host>
          <Text size="xs" c="dimmed">
            User message
          </Text>
          <MessageActions
            messageRole="user"
            align="end"
            text="Refactor the auth module"
            timestamp="10:42 AM"
            visibility="always"
            onEdit={() => push("edit")}
            onRewind={async () => {
              await wait(600);
              push("rewind");
            }}
          />
        </Box>
        <Box data-message-actions-host>
          <Text size="xs" c="dimmed">
            Assistant message
          </Text>
          <MessageActions
            messageRole="assistant"
            text="Here is the refactored module."
            visibility="always"
            onRetry={async () => {
              await wait(800);
              push("retry");
            }}
            onBranch={() => push("branch")}
            onFeedback={async (value, details) => {
              await wait(500);
              push(`feedback ${value}${details ? ` ${JSON.stringify(details)}` : ""}`);
            }}
          />
        </Box>
      </Stack>
      <ResultBlock value={log.length ? log.join("\n") : null} />
    </div>
  );
}

function EditComposerPreview() {
  const [text, setText] = useState("Store the session token in an httpOnly cookie instead of localStorage.");
  const [editing, setEditing] = useState(true);
  return (
    <div className="mx-auto w-full max-w-md">
      {editing ? (
        <EditMessageComposer
          defaultValue={text}
          onSubmit={async (next) => {
            await wait(600);
            setText(next);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <Stack gap="xs" align="flex-end">
          <Text size="sm">{text}</Text>
          <Button size="xs" variant="default" onClick={() => setEditing(true)}>
            Edit again
          </Button>
        </Stack>
      )}
    </div>
  );
}

function FeedbackFormPreview() {
  const [details, setDetails] = useState<unknown>(null);
  return (
    <div className="mx-auto w-full max-w-md">
      <Stack gap="md">
        <FeedbackForm
          value="down"
          onSubmit={async (next) => {
            await wait(500);
            setDetails(next);
          }}
          onSkip={() => setDetails("skipped")}
        />
        <FeedbackForm value="up" />
      </Stack>
      <ResultBlock value={details} />
    </div>
  );
}

function PlanApprovalPreview({ fail = false }: { fail?: boolean }) {
  const [decision, setDecision] = useState<PlanDecision | null>(null);
  const act = async (next: PlanDecision) => {
    await wait(800);
    if (fail) throw new Error("The session has ended, start a new one to continue");
    setDecision(next);
  };
  return (
    <div className="mx-auto w-full max-w-xl">
      <PlanApproval
        plan={PLAN}
        decision={decision}
        onApprove={() => act({ kind: "approved" })}
        onApproveWithEdits={(edits) => act({ kind: "approved-with-edits", edits })}
        onReject={(feedback) => act({ kind: "rejected", feedback })}
      />
    </div>
  );
}

function RewindDialogPreview() {
  const [opened, setOpened] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  return (
    <div className="flex w-full flex-col items-center">
      <Button onClick={() => setOpened(true)}>Rewind conversation</Button>
      <ResultBlock value={result} />
      <RewindDialog
        opened={opened}
        onClose={() => setOpened(false)}
        messages={CONVERSATION}
        onRewind={async (request) => {
          await wait(600);
          setResult(request);
        }}
      />
    </div>
  );
}

function ToolResultNoticePreview() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Stack gap="sm">
        <ToolResultNotice
          variant="rejected"
          toolName="Edit"
          detail="src/auth/session.ts"
          feedback="Don't touch the session store, add the retry in the client instead."
        />
        <ToolResultNotice variant="cancelled" toolName="Bash" detail="yarn test --watch" />
        <ToolResultNotice
          variant="error"
          toolName="Bash"
          detail="yarn build"
          errorText={"src/auth/client.ts:118:7 - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'."}
        />
        <ToolResultNotice
          variant="interrupted"
          toolName="git_search"
          reason="The conversation was stopped before the tool returned."
        />
      </Stack>
    </div>
  );
}

function MemoryNoticePreview() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Stack gap="sm">
        <MemoryNotice
          content={"Use **yarn**, not npm, in this repository.\n\n- Run `yarn jest <path>` for a single module\n- Storybook runs on port 8271"}
          target="AGENTS.md"
          onOpen={() => {}}
          onUndo={() => wait(600)}
        />
        <MemoryNotice content="Prefers answers in Russian" />
      </Stack>
    </div>
  );
}

function CommandChipPreview() {
  return (
    <Stack gap="md" align="center">
      <CommandChip name="review" args="src/auth --staged" description="Review changes in a path" />
      <CommandChip name="compact" size="xs" />
      <CommandChip name="/model" args="qwen-2.5-coder-32b" size="md" />
    </Stack>
  );
}

export function renderChatActionsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "MessageActions":
    case "MessageActions/toolbar":
      return <MessageActionsPreview />;
    case "MessageActions/message-list":
      return <MessageListActionsPreview />;
    case "MessageActions/message-list-narrow":
      return <MessageListActionsPreview narrow />;
    case "EditMessageComposer":
    case "EditMessageComposer/basic":
      return <EditComposerPreview />;
    case "FeedbackForm":
    case "FeedbackForm/basic":
      return <FeedbackFormPreview />;
    case "PlanApproval":
    case "PlanApproval/basic":
      return <PlanApprovalPreview />;
    case "PlanApproval/rejected":
      return <PlanApprovalPreview fail />;
    case "RewindDialog":
    case "RewindDialog/basic":
      return <RewindDialogPreview />;
    case "ToolResultNotice":
    case "ToolResultNotice/variants":
      return <ToolResultNoticePreview />;
    case "MemoryNotice":
    case "MemoryNotice/basic":
      return <MemoryNoticePreview />;
    case "CommandChip":
    case "CommandChip/basic":
      return <CommandChipPreview />;
    default:
      return undefined;
  }
}
