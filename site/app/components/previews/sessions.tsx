"use client";

import React, { useState } from "react";
import { Box, Button, Code, Text } from "@mantine/core";
import {
  ExportDialog,
  MasterDetail,
  SessionList,
  SessionPreview,
  type ChatMessage,
  type SessionSummary,
} from "@sinups/ai-kit";
import { NarrowFrame, WideFrame } from "./frames";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function createSessions(now: Date): SessionSummary[] {
  const at = (offset: number) => new Date(now.getTime() - offset);
  return [
    {
      id: "auth-retry",
      title: "Add retry to token refresh",
      preview: "Done. The refresh call now retries three times with exponential backoff.",
      createdAt: at(3 * HOUR),
      updatedAt: at(12 * 60_000),
      messageCount: 14,
      model: "qwen-2.5-coder-32b",
      branch: "fix/auth-retry",
      tokenCount: 48_210,
      cost: 0.84,
      tags: ["auth", "bugfix"],
    },
    {
      id: "release-notes",
      title: "Draft release notes for 2.4",
      preview: "Here is a grouped changelog with breaking changes first.",
      createdAt: at(30 * DAY),
      updatedAt: at(2 * DAY),
      messageCount: 32,
      model: "llama-3.3-70b",
      pinned: true,
      tags: ["docs"],
    },
    {
      id: "flaky-e2e",
      title: "Investigate flaky checkout e2e test",
      preview: "The race comes from the payment iframe loading after the submit click.",
      createdAt: at(5 * HOUR),
      updatedAt: at(4 * HOUR),
      messageCount: 21,
      model: "llama-3.3-70b",
      branch: "test/checkout-race",
    },
    {
      id: "upload-backoff",
      title: "Migrate upload client to the new API",
      preview: "Keep 5 attempts and ship it.",
      createdAt: at(DAY + 6 * HOUR),
      updatedAt: at(DAY + 2 * HOUR),
      messageCount: 58,
      model: "qwen-2.5-coder-32b",
      tokenCount: 182_400,
      cost: 3.12,
    },
    {
      id: "sql-perf",
      title: "Speed up the monthly report query",
      preview: "An index on (account_id, created_at) removes the sequential scan.",
      createdAt: at(4 * DAY),
      updatedAt: at(4 * DAY),
      messageCount: 9,
      model: "mistral-small-24b",
      tags: ["database"],
    },
    {
      id: "k8s-limits",
      title: "Tune Kubernetes memory limits for the worker pool",
      preview: "Requests at 512Mi and limits at 1Gi keep OOM kills away.",
      createdAt: at(48 * DAY),
      updatedAt: at(47 * DAY),
      messageCount: 26,
      model: "qwen-2.5-coder-32b",
    },
    {
      id: "old-spike",
      title: "Spike: websocket transport",
      preview: "Server-sent events are enough for the current traffic.",
      createdAt: at(80 * DAY),
      updatedAt: at(80 * DAY),
      messageCount: 6,
      archived: true,
    },
  ];
}

export const SESSION_MESSAGES: ChatMessage[] = [
  {
    id: "s-u1",
    role: "user",
    parts: [{ type: "text", text: "Token refresh logs users out when the network blips. Add a retry." }],
  },
  {
    id: "s-a1",
    role: "assistant",
    parts: [
      { type: "reasoning", text: "Only network errors and 5xx should be retried; 401 is final." },
      {
        type: "tool-Read",
        toolCallId: "s-read-1",
        state: "output-available",
        input: { file_path: "src/auth/session.ts" },
        output: "",
      },
      {
        type: "text",
        text: "I wrapped `refreshToken` in `withRetry`: 3 attempts with exponential backoff, `401` stays final.",
      },
    ],
  },
  {
    id: "s-u2",
    role: "user",
    parts: [{ type: "text", text: "Add tests for the retry and the final failure." }],
  },
  {
    id: "s-a2",
    role: "assistant",
    parts: [{ type: "text", text: "Added three tests: success, retry after a 503, and final failure." }],
  },
];

function useSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => createSessions(new Date()));
  const update = (id: string, patch: Partial<SessionSummary>) =>
    setSessions((current) => current.map((session) => (session.id === id ? { ...session, ...patch } : session)));
  return {
    sessions,
    onRename: (session: SessionSummary, title: string) => update(session.id, { title }),
    onPin: (session: SessionSummary, pinned: boolean) => update(session.id, { pinned }),
    onArchive: (session: SessionSummary, archived: boolean) => update(session.id, { archived }),
    onDelete: (session: SessionSummary) =>
      setSessions((current) => current.filter((item) => item.id !== session.id)),
  };
}

function SessionListPreview() {
  const handlers = useSessions();
  const [selectedId, setSelectedId] = useState<string | null>("auth-retry");
  return (
    <NarrowFrame className="p-2">
      <SessionList {...handlers} selectedId={selectedId} onSelect={(session) => setSelectedId(session.id)} />
    </NarrowFrame>
  );
}

function SessionListStatesPreview() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border p-2">
        <SessionList sessions={[]} loading />
      </div>
      <div className="rounded-lg border border-border p-2">
        <SessionList sessions={[]} error="Could not load the history" onRetry={() => {}} />
      </div>
      <div className="rounded-lg border border-border p-2">
        <SessionList sessions={[]} />
      </div>
    </div>
  );
}

function SessionPreviewPreview({ loading = false }: { loading?: boolean }) {
  const [session] = useState(() => createSessions(new Date())[0]);
  return (
    <WideFrame height={520}>
      <SessionPreview
        session={session}
        messages={SESSION_MESSAGES}
        loading={loading}
        onResume={() => {}}
        onExport={() => {}}
      />
    </WideFrame>
  );
}

function ExportDialogPreview() {
  const [opened, setOpened] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button onClick={() => setOpened(true)}>Export conversation</Button>
      {saved && (
        <Text size="sm">
          Saved <Code>{saved}</Code>
        </Text>
      )}
      <ExportDialog
        opened={opened}
        onClose={() => setOpened(false)}
        messages={SESSION_MESSAGES}
        title="Add retry to token refresh"
        onDownload={(filename, _content, mimeType) => {
          setSaved(`${filename} (${mimeType})`);
          setOpened(false);
        }}
      />
    </div>
  );
}

function HistoryPreview({ narrow = false }: { narrow?: boolean }) {
  const handlers = useSessions();
  const [selectedId, setSelectedId] = useState<string | null>(narrow ? null : "auth-retry");
  const [exporting, setExporting] = useState<SessionSummary | null>(null);
  const selected = handlers.sessions.find((session) => session.id === selectedId) ?? null;
  const history = (
    <>
      <MasterDetail
        listWidth={340}
        list={
          <Box p="xs">
            <SessionList
              {...handlers}
              selectedId={selectedId}
              onSelect={(session) => setSelectedId(session.id)}
              onExport={setExporting}
            />
          </Box>
        }
        detail={
          selected ? (
            <SessionPreview
              session={selected}
              messages={SESSION_MESSAGES}
              onResume={() => {}}
              onExport={setExporting}
            />
          ) : null
        }
        onBack={() => setSelectedId(null)}
      />
      <ExportDialog
        opened={exporting !== null}
        onClose={() => setExporting(null)}
        title={exporting?.title}
        messages={SESSION_MESSAGES}
        onDownload={() => setExporting(null)}
      />
    </>
  );
  return narrow ? <NarrowFrame height={600}>{history}</NarrowFrame> : <WideFrame height={600}>{history}</WideFrame>;
}

export function renderSessionsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "SessionList":
    case "SessionList/basic":
      return <SessionListPreview />;
    case "SessionList/states":
      return <SessionListStatesPreview />;
    case "SessionList/history":
      return <HistoryPreview />;
    case "SessionList/history-narrow":
      return <HistoryPreview narrow />;
    case "SessionPreview":
    case "SessionPreview/basic":
      return <SessionPreviewPreview />;
    case "SessionPreview/loading":
      return <SessionPreviewPreview loading />;
    case "ExportDialog":
    case "ExportDialog/basic":
      return <ExportDialogPreview />;
    default:
      return undefined;
  }
}
