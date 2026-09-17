"use client";

import { useState } from "react";
import { Paper, Stack, Text, TextInput } from "@mantine/core";
import {
  AgentList,
  AiKitThemeCustomizer,
  DiffFileView,
  McpServerList,
  MessageList,
  PermissionModeSelector,
  TaskList,
  ToolApprovalFooter,
  Wizard,
  type AgentDefinition,
  type AiKitThemeSettings,
  type BackgroundTask,
  type ChatMessage,
  type FileChange,
  type McpServer,
  type PermissionMode,
} from "@sinups/ai-kit";
import { previewHighlighter } from "./preview-highlighter";

const noop = () => {};

const CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "bento-user",
    role: "user",
    parts: [{ type: "text", text: "Why does the upload retry forever?" }],
  },
  {
    id: "bento-assistant",
    role: "assistant",
    parts: [
      {
        type: "tool-Grep",
        toolCallId: "bento-grep",
        state: "output-available",
        input: { pattern: "retry", path: "src/upload" },
        output: { numFiles: 3, filenames: [] },
      },
      {
        type: "text",
        text: "The attempt counter reset on every error. It now stops after **5 attempts**.",
      },
      {
        type: "tool-Bash",
        toolCallId: "bento-bash",
        state: "output-available",
        input: { command: "yarn test src/upload", description: "Run upload tests" },
        output: "Tests: 9 passed, 9 total",
      },
    ],
  },
];

export function ChatBentoPreview() {
  return (
    <MessageList
      messages={CHAT_MESSAGES}
      status="ready"
      contentWidth="100%"
      initialScrollBehavior="top"
    />
  );
}

const RETRY_BEFORE = `async function upload(f: File) {
  for (let i = 0; ; i = 0) {
    try {
      return await send(f);
    } catch {
      await sleep(backoff(i));
    }
  }
}
`;

const RETRY_AFTER = `const MAX = 5;

async function upload(f: File) {
  for (let i = 1; ; i++) {
    try {
      return await send(f);
    } catch (error) {
      if (i >= MAX) throw error;
      await sleep(backoff(i));
    }
  }
}
`;

const RETRY_CHANGE: FileChange = {
  path: "src/upload/upload.ts",
  status: "modified",
  oldContent: RETRY_BEFORE,
  newContent: RETRY_AFTER,
  language: "ts",
};

export function DiffBentoPreview() {
  return <DiffFileView change={RETRY_CHANGE} highlighter={previewHighlighter} contextLines={1} />;
}

export function TasksBentoPreview() {
  const [now] = useState(() => Date.now());
  const tasks: BackgroundTask[] = [
    {
      id: "lint",
      kind: "shell",
      title: "yarn lint --fix",
      status: "running",
      startedAt: now - 42_000,
      progress: { value: 64, label: "412 of 640 files" },
    },
    {
      id: "review",
      kind: "agent",
      title: "Code review",
      status: "completed",
      startedAt: now - 380_000,
      endedAt: now - 120_000,
      tokens: 18_200,
      toolUses: 14,
    },
    {
      id: "e2e",
      kind: "shell",
      title: "yarn e2e checkout",
      status: "failed",
      startedAt: now - 900_000,
      endedAt: now - 840_000,
      exitCode: 1,
      error: "2 tests failed",
    },
  ];
  return <TaskList tasks={tasks} withSearch={false} withKindFilter={false} />;
}

const SERVERS: McpServer[] = [
  { id: "docs", name: "docs-search", transport: "http", status: "connected", url: "https://docs.example.com/mcp", scope: "project", toolCount: 4 },
  { id: "git", name: "git", transport: "stdio", status: "connected", command: "npx", args: ["git-mcp"], scope: "user", toolCount: 12 },
  { id: "tickets", name: "tickets", transport: "http", status: "needs-auth", url: "https://tickets.example.com/mcp", scope: "user" },
];

export function McpBentoPreview() {
  return <McpServerList servers={SERVERS} onSelect={noop} groupByScope={false} />;
}

const AGENTS: AgentDefinition[] = [
  { id: "reviewer", name: "code-reviewer", displayName: "Code reviewer", description: "Reviews diffs for bugs and missing tests", systemPrompt: "", model: "qwen-2.5-coder-32b", tools: ["Read", "Grep"], color: "violet", source: "project" },
  { id: "writer", name: "docs-writer", displayName: "Docs writer", description: "Writes and edits documentation pages", systemPrompt: "", model: "llama-3.3-70b", tools: "all", color: "teal", source: "user" },
  { id: "explorer", name: "explorer", displayName: "Explorer", description: "Finds code across the repository", systemPrompt: "", model: "inherit", tools: ["Read", "Glob", "Grep"], color: "orange", source: "builtin", readOnly: true },
];

export function AgentsBentoPreview() {
  return <AgentList agents={AGENTS} onSelect={noop} />;
}

export function PermissionsBentoPreview() {
  const [mode, setMode] = useState<PermissionMode>("default");
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="sm">
        <Text size="xs" c="dimmed" mb={4}>
          Run command
        </Text>
        <Text size="sm" ff="monospace" mb="sm">
          rm -rf dist && yarn build
        </Text>
        <ToolApprovalFooter
          onApprove={noop}
          onReject={noop}
          labels={{ approve: "Allow", reject: "Deny" }}
          reason="Deletes the dist folder"
        />
      </Paper>
      <PermissionModeSelector value={mode} onChange={setMode} variant="select" />
    </Stack>
  );
}

type ServerValues = { name: string; url: string };

export function WizardBentoPreview() {
  return (
    <Wizard<ServerValues>
      orientation="horizontal"
      initialValues={{ name: "docs-search", url: "https://docs.example.com/mcp" }}
      onComplete={noop}
      steps={[
        {
          id: "server",
          label: "Server",
          render: ({ values, setValue }) => (
            <Stack gap="xs">
              <TextInput label="Name" value={values.name} onChange={(event) => setValue("name", event.currentTarget.value)} />
              <TextInput label="URL" value={values.url} onChange={(event) => setValue("url", event.currentTarget.value)} />
            </Stack>
          ),
        },
        { id: "auth", label: "Auth", render: () => null },
        { id: "tools", label: "Tools", render: () => null },
      ]}
    />
  );
}

export function ThemeBentoPreview() {
  const [settings, setSettings] = useState<AiKitThemeSettings>({ accent: "violet" });
  return <AiKitThemeCustomizer value={settings} onChange={setSettings} sections={{ mode: false }} />;
}
