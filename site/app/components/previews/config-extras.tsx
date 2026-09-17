"use client";

import React, { useState } from "react";
import { Badge, Button, Group, Paper, Stack, Switch, Text, Select } from "@mantine/core";
import { IconBrain, IconPlugConnected, IconSettings, IconShieldLock } from "@tabler/icons-react";
import {
  AgentIdentityFields,
  AgentMessage,
  AgentModelFields,
  AgentPromptField,
  AiKitProvider,
  AiKitThemeCustomizer,
  DEFAULT_AGENT_FIELD_LABELS,
  DiffStats,
  FileIcon,
  FileStatusBadge,
  InputBar,
  InvalidSettingsNotice,
  McpConfigWarnings,
  McpDiscoveredServers,
  McpImportDialog,
  McpToolAnnotationBadges,
  McpTransportIcon,
  MemoryFileDetail,
  MemoryPanel,
  SettingRow,
  SettingsModal,
  SettingsSection,
  TaskElapsed,
  TaskKindIcon,
  ToolApprovalFooter,
  UserMessage,
  ValidationErrorsList,
  createAgentDraft,
  validateAgentDraft,
  type AgentDraft,
  type AgentMessageData,
  type AiKitThemeSettings,
  type ChatMessage,
  type McpConfigWarning,
  type McpDiscoveredServer,
  type McpServerCandidate,
  type MemoryFile,
  type SettingsNavItem,
  type SettingsValidationError,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, noop, wait } from "./frames";

const NOW = Date.parse("2026-09-17T12:00:00Z");

const SETTINGS_SECTIONS: SettingsNavItem[] = [
  { id: "general", label: "General", icon: <IconSettings size={16} /> },
  { id: "models", label: "Models", description: "Default model and limits", icon: <IconBrain size={16} />, group: "Agent" },
  { id: "permissions", label: "Permissions", icon: <IconShieldLock size={16} />, group: "Agent" },
  {
    id: "mcp",
    label: "MCP servers",
    description: "Connected tools",
    icon: <IconPlugConnected size={16} />,
    badge: (
      <Badge size="xs" variant="light">
        3
      </Badge>
    ),
    group: "Integrations",
  },
];

function SettingsModalPreview() {
  const [opened, setOpened] = useState(false);
  const [activeId, setActiveId] = useState("general");
  return (
    <Stack align="center" className="w-full">
      <Button onClick={() => setOpened(true)}>Open settings</Button>
      <SettingsModal
        opened={opened}
        onClose={() => setOpened(false)}
        sections={SETTINGS_SECTIONS}
        activeId={activeId}
        onActiveChange={setActiveId}
        searchable
      >
        <SettingsSection title={SETTINGS_SECTIONS.find((section) => section.id === activeId)?.label ?? ""}>
          <SettingRow
            label="Default model"
            description="Used for new conversations"
            control={<Select data={["Qwen3 Coder", "Llama 4 Scout", "DeepSeek V3"]} defaultValue="Qwen3 Coder" w={200} />}
          />
          <SettingRow label="Stream responses" control={<Switch defaultChecked />} />
        </SettingsSection>
      </SettingsModal>
    </Stack>
  );
}

const VALIDATION_ERRORS: SettingsValidationError[] = [
  {
    file: ".agent/settings.json",
    path: "permissions.allow[2]",
    message: 'Unknown tool "Shell(npm test)"',
    suggestion: 'Did you mean "Bash(npm test)"?',
    docsUrl: "https://example.com/docs/permissions",
  },
  {
    file: ".agent/settings.json",
    path: "model",
    message: "Expected a string, received a number",
  },
  {
    file: ".agent/settings.json",
    path: "hooks.PreToolUse[0].matcher",
    message: "The matcher is an invalid regular expression",
  },
  {
    file: ".agent/settings.local.json",
    path: "env.EDITOR",
    message: "Overrides the value from the project settings",
    severity: "warning",
  },
];

function ValidationErrorsListPreview({ narrow = false }: { narrow?: boolean }) {
  const [opened, setOpened] = useState<string | null>(null);
  const list = (
    <div className="p-3">
      <ValidationErrorsList errors={VALIDATION_ERRORS} maxItems={2} onOpenFile={setOpened} />
      <ResultBlock value={opened && `Open ${opened}`} />
    </div>
  );
  return narrow ? <NarrowFrame>{list}</NarrowFrame> : <WideFrame>{list}</WideFrame>;
}

function InvalidSettingsNoticePreview() {
  const [dismissed, setDismissed] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      {!dismissed && (
        <InvalidSettingsNotice
          file=".agent/settings.json"
          errors={VALIDATION_ERRORS.filter((error) => error.file === ".agent/settings.json")}
          onOpenFile={(file) => setResult(`Open ${file}`)}
          onContinueWithout={async () => {
            await wait(800);
            setDismissed(true);
          }}
          onDismiss={() => setDismissed(true)}
        />
      )}
      {dismissed && (
        <Button variant="default" size="xs" onClick={() => setDismissed(false)}>
          Show again
        </Button>
      )}
      <ResultBlock value={result} />
    </div>
  );
}

function InvalidSettingsWarningPreview() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <InvalidSettingsNotice
        file=".agent/settings.local.json"
        errors={VALIDATION_ERRORS.filter((error) => error.severity === "warning")}
        defaultExpanded
      />
      <InvalidSettingsNotice
        file="~/.agent/settings.json"
        count={4}
        onContinueWithout={async () => {
          await wait(600);
          throw new Error("The file is locked by another process");
        }}
      />
    </div>
  );
}

const IMPORT_CANDIDATES: McpServerCandidate[] = [
  { id: "c-git", name: "git", transport: "stdio", command: "uvx", args: ["mcp-server-git", "--repository", "."] },
  { id: "c-postgres", name: "postgres", transport: "stdio", command: "npx", args: ["-y", "mcp-postgres", "postgresql://localhost/app"] },
  { id: "c-issues", name: "issues", transport: "http", url: "https://issues.example.com/mcp" },
  { id: "c-errors", name: "errors", transport: "sse", url: "https://errors.example.com/sse" },
];

function McpImportDialogPreview({ empty = false }: { empty?: boolean }) {
  const [opened, setOpened] = useState(false);
  const [imported, setImported] = useState<McpServerCandidate[] | null>(null);
  return (
    <Stack align="center" className="w-full">
      <Button onClick={() => setOpened(true)}>{empty ? "Import from an empty config" : "Import servers"}</Button>
      <McpImportDialog
        opened={opened}
        onClose={() => setOpened(false)}
        sourceLabel="Desktop client"
        servers={empty ? [] : IMPORT_CANDIDATES}
        existingNames={["git", "filesystem"]}
        onImport={async (servers) => {
          await wait(800);
          setImported(servers);
        }}
      />
      <ResultBlock value={imported?.map((server) => server.name)} />
    </Stack>
  );
}

const DISCOVERED: McpDiscoveredServer[] = [
  { id: "d-filesystem", name: "filesystem", transport: "stdio", command: "npx", args: ["-y", "mcp-filesystem", "./docs"], source: ".mcp.json" },
  { id: "d-postgres", name: "postgres", transport: "stdio", command: "npx", args: ["-y", "mcp-postgres", "postgresql://localhost/app"], source: ".mcp.json" },
  { id: "d-errors", name: "errors", transport: "http", url: "https://errors.example.com/mcp", source: ".mcp.json" },
];

function McpDiscoveredServersPreview({ narrow = false, failing = false }: { narrow?: boolean; failing?: boolean }) {
  const [pending, setPending] = useState(DISCOVERED);
  const [result, setResult] = useState<string | null>(null);
  const content = (
    <div className="p-3">
      <McpDiscoveredServers
        servers={pending}
        onApprove={async (servers) => {
          await wait(800);
          if (failing) throw new Error("Could not write .agent/settings.local.json");
          setResult(`Approved: ${servers.map((server) => server.name).join(", ")}`);
          setPending([]);
        }}
        onReject={async (servers) => {
          await wait(500);
          setResult(`Rejected: ${servers.map((server) => server.name).join(", ")}`);
          setPending([]);
        }}
      />
      {pending.length === 0 && (
        <Button variant="default" size="xs" onClick={() => setPending(DISCOVERED)}>
          Show again
        </Button>
      )}
      <ResultBlock value={result} />
    </div>
  );
  return narrow ? <NarrowFrame>{content}</NarrowFrame> : <WideFrame>{content}</WideFrame>;
}

const CONFIG_WARNINGS: McpConfigWarning[] = [
  { file: ".mcp.json", path: "mcpServers.git", kind: "duplicate-name", message: "Also defined in ~/.agent/mcp.json; the project entry wins", serverName: "git" },
  { file: ".mcp.json", path: "mcpServers.postgres.timeout", kind: "unknown-field", message: "Field is ignored", serverName: "postgres" },
  { file: "~/.agent/mcp.json", path: "mcpServers.issues.url", kind: "invalid-value", message: "Expected an http or https URL", serverName: "issues" },
];

function McpConfigWarningsPreview({ narrow = false }: { narrow?: boolean }) {
  const [opened, setOpened] = useState<string | null>(null);
  const content = (
    <div className="p-3">
      <McpConfigWarnings warnings={CONFIG_WARNINGS} onOpenFile={setOpened} />
      <ResultBlock value={opened && `Open ${opened}`} />
    </div>
  );
  return narrow ? <NarrowFrame>{content}</NarrowFrame> : <WideFrame>{content}</WideFrame>;
}

function McpBadgesPreview() {
  const rows = [
    { name: "git_log", transport: "stdio" as const, annotations: { readOnlyHint: true, idempotentHint: true } },
    { name: "query", transport: "stdio" as const, annotations: { readOnlyHint: true } },
    { name: "delete_issue", transport: "http" as const, annotations: { destructiveHint: true, openWorldHint: true } },
    { name: "stream_events", transport: "sse" as const, annotations: { openWorldHint: true } },
  ];
  return (
    <WideFrame>
      <Stack gap="xs" p="md">
        {rows.map((row) => (
          <Group key={row.name} gap="sm" wrap="nowrap">
            <McpTransportIcon transport={row.transport} />
            <Text size="sm" ff="monospace" w={140}>
              {row.name}
            </Text>
            <McpToolAnnotationBadges annotations={row.annotations} withTooltips />
          </Group>
        ))}
      </Stack>
    </WideFrame>
  );
}

const AGENT_MODELS = [
  { id: "qwen3-coder", name: "Qwen3 Coder", version: "30B" },
  { id: "llama-4-scout", name: "Llama 4 Scout" },
  { id: "deepseek-v3", name: "DeepSeek", version: "V3" },
];

function AgentFieldsPreview({ narrow = false }: { narrow?: boolean }) {
  const [draft, setDraft] = useState<AgentDraft>(() => createAgentDraft());
  const [autoName, setAutoName] = useState(true);
  const errors = validateAgentDraft(draft, { existingNames: ["test-runner"] });
  const onChange = (patch: Partial<AgentDraft>) => setDraft((previous) => ({ ...previous, ...patch }));
  const fields = (
    <Stack gap="md" p="md">
      <AgentIdentityFields
        draft={draft}
        errors={errors}
        onChange={onChange}
        labels={DEFAULT_AGENT_FIELD_LABELS}
        autoName={autoName}
        onNameEdited={() => setAutoName(false)}
      />
      <AgentPromptField draft={draft} errors={errors} onChange={onChange} labels={DEFAULT_AGENT_FIELD_LABELS} minRows={4} />
      <AgentModelFields
        draft={draft}
        errors={errors}
        onChange={onChange}
        labels={DEFAULT_AGENT_FIELD_LABELS}
        models={AGENT_MODELS}
        skills={["code-review", "write-tests", "release-notes"]}
      />
    </Stack>
  );
  return narrow ? <NarrowFrame>{fields}</NarrowFrame> : <WideFrame>{fields}</WideFrame>;
}

const AGENT_MESSAGES: AgentMessageData[] = [
  {
    id: "m1",
    from: { name: "planner", color: "violet" },
    to: { name: "test-runner", color: "teal" },
    summary: "Run the upload queue tests after the retry change",
    content:
      "The retry logic moved into upload-queue.ts. Run `yarn jest upload-queue` and report failing cases with the first assertion message only.",
    timestamp: NOW - 4 * 60_000,
  },
  {
    id: "m2",
    from: { name: "test-runner", color: "teal" },
    to: { name: "planner", color: "violet" },
    summary: "12 passed, 1 failed: backoff exceeds the limit",
    timestamp: NOW - 2 * 60_000,
  },
  {
    id: "m3",
    from: { name: "planner", color: "violet" },
    summary: "Pausing edits until the failing test is fixed",
    content: "All agents: do not touch upload-queue.ts until the backoff test is green.",
    timestamp: NOW - 60_000,
  },
];

function AgentMessagePreview({ narrow = false }: { narrow?: boolean }) {
  const list = (
    <Stack gap="xs" p="sm">
      {AGENT_MESSAGES.map((message) => (
        <AgentMessage key={message.id} message={message} formatTime={(date) => date.toISOString().slice(11, 16)} />
      ))}
    </Stack>
  );
  return narrow ? <NarrowFrame>{list}</NarrowFrame> : <WideFrame>{list}</WideFrame>;
}

function TaskMetaPreview() {
  const [startedAt] = useState(() => Date.now() - 83_000);
  const rows = [
    { kind: "shell" as const, title: "yarn test --watch", task: { status: "running" as const, startedAt } },
    { kind: "agent" as const, title: "code-reviewer", task: { status: "completed" as const, startedAt: NOW - 312_000, endedAt: NOW } },
    { kind: "remote" as const, title: "Nightly benchmark", task: { status: "failed" as const, startedAt: NOW - 45_000, endedAt: NOW } },
    { kind: "workflow" as const, title: "Release checklist", task: { status: "queued" as const } },
  ];
  return (
    <WideFrame>
      <Stack gap="xs" p="md">
        {rows.map((row) => (
          <Group key={row.title} gap="sm" wrap="nowrap">
            <TaskKindIcon kind={row.kind} size="sm" />
            <Text size="sm" flex={1}>
              {row.title}
            </Text>
            <Text size="xs" c="dimmed" ff="monospace">
              <TaskElapsed task={row.task} />
            </Text>
          </Group>
        ))}
      </Stack>
    </WideFrame>
  );
}

function DiffMetaPreview() {
  const rows = [
    { path: "src/upload/upload-queue.ts", status: "modified" as const, additions: 42, deletions: 7 },
    { path: "src/upload/backoff.test.ts", status: "added" as const, additions: 88, deletions: 0 },
    { path: "docs/retries.md", status: "renamed" as const, additions: 3, deletions: 3 },
    { path: "scripts/legacy-upload.sh", status: "deleted" as const, additions: 0, deletions: 54 },
    { path: "config/retry.json", status: "added" as const, additions: 12, deletions: 0, untracked: true },
  ];
  const labels = { added: "Added", modified: "Modified", deleted: "Deleted", renamed: "Renamed" };
  return (
    <WideFrame>
      <Stack gap="xs" p="md">
        {rows.map((row) => (
          <Group key={row.path} gap="sm" wrap="nowrap">
            <FileIcon path={row.path} />
            <Text size="sm" ff="monospace" flex={1} truncate>
              {row.path}
            </Text>
            <DiffStats additions={row.additions} deletions={row.deletions} />
            <FileStatusBadge status={row.status} untracked={row.untracked} label={row.untracked ? "Untracked" : labels[row.status]} />
          </Group>
        ))}
      </Stack>
    </WideFrame>
  );
}

const MEMORY_FILES: MemoryFile[] = [
  {
    id: "user",
    scope: "user",
    path: "~/.agent/AGENTS.md",
    updatedAt: "2026-09-15T09:30:00Z",
    content: "# Preferences\n\n- Keep answers short\n- Prefer small pull requests with one change each",
  },
  {
    id: "project",
    scope: "project",
    path: "AGENTS.md",
    updatedAt: "2026-09-17T11:48:00Z",
    content:
      "# upload-service\n\nUse **yarn**, not npm.\n\n## Checks\n\n- `yarn jest <path>` for a single module\n- `yarn tsc --noEmit` before a pull request",
  },
  {
    id: "local",
    scope: "local",
    path: "AGENTS.local.md",
    updatedAt: "2026-09-17T08:12:00Z",
    content: "The local database runs on port 5433.",
  },
  {
    id: "agent-reviewer",
    scope: "agent",
    agentName: "code-reviewer",
    path: ".agent/agent-memory/code-reviewer/MEMORY.md",
    updatedAt: "2026-09-16T18:40:00Z",
    content: "# Review notes\n\n- `any` is accepted only in test fixtures",
  },
];

function MemoryPanelPreview({
  narrow = false,
  state,
}: {
  narrow?: boolean;
  state?: "loading" | "error" | "empty";
}) {
  const [files, setFiles] = useState(MEMORY_FILES);
  const [selectedId, setSelectedId] = useState<string | null>(narrow ? null : "project");
  const panel = (
    <MemoryPanel
      files={state === "empty" || state === "loading" ? [] : files}
      loading={state === "loading"}
      error={state === "error" ? "Could not read ~/.agent/AGENTS.md: permission denied" : undefined}
      onRetry={noop}
      now={NOW}
      selectedId={selectedId}
      onSelectedIdChange={setSelectedId}
      onSave={async (file, content) => {
        await wait(600);
        setFiles((items) => items.map((item) => (item.id === file.id ? { ...item, content } : item)));
      }}
      onOpenLocation={noop}
      onCreate={noop}
      style={{ height: "100%" }}
    />
  );
  return narrow ? (
    <NarrowFrame height={560}>{panel}</NarrowFrame>
  ) : (
    <WideFrame height={560}>{panel}</WideFrame>
  );
}

function MemoryFileDetailPreview() {
  const [file, setFile] = useState(MEMORY_FILES[1]!);
  const [editing, setEditing] = useState(false);
  return (
    <WideFrame>
      <MemoryFileDetail
        file={file}
        editing={editing}
        now={NOW}
        onEdit={() => setEditing(true)}
        onCancelEdit={() => setEditing(false)}
        onSave={async (_file, content) => {
          await wait(600);
          setFile((previous) => ({ ...previous, content }));
        }}
        onSaved={() => setEditing(false)}
        onOpenLocation={noop}
      />
    </WideFrame>
  );
}

const THEME_MESSAGE = {
  id: "theme-user",
  role: "user",
  parts: [{ type: "text", text: "Add a retry to the upload queue and cover it with a test." }],
} as ChatMessage;

function ThemeSample() {
  return (
    <Stack gap="md">
      <UserMessage message={THEME_MESSAGE} />
      <Paper withBorder radius="md" style={{ overflow: "hidden" }}>
        <Text size="xs" c="dimmed" p="xs" ff="monospace">
          yarn jest upload-queue
        </Text>
        <ToolApprovalFooter onApprove={noop} onReject={noop} />
      </Paper>
      <InputBar status="ready" onSend={noop} onStop={noop} contentWidth="100%" />
    </Stack>
  );
}

function AiKitProviderPreview() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-2">
      {(
        [
          { label: "Defaults", settings: {} },
          { label: "accent violet, radius round, density compact", settings: { accent: "violet", radius: "round", density: "compact" } },
        ] satisfies Array<{ label: string; settings: AiKitThemeSettings }>
      ).map((item) => (
        <Stack key={item.label} gap="xs">
          <Text size="xs" c="dimmed">
            {item.label}
          </Text>
          <AiKitProvider {...item.settings}>
            <ThemeSample />
          </AiKitProvider>
        </Stack>
      ))}
    </div>
  );
}

function AiKitThemeCustomizerPreview({ narrow = false }: { narrow?: boolean }) {
  const [settings, setSettings] = useState<AiKitThemeSettings>({ accent: "blue" });
  const customizer = (
    <AiKitThemeCustomizer value={settings} onChange={setSettings} sections={{ mode: false }} />
  );
  if (narrow) {
    return (
      <NarrowFrame>
        <div className="p-3">
          {customizer}
          <ResultBlock value={settings} />
        </div>
      </NarrowFrame>
    );
  }
  return (
    <WideFrame>
      <div className="grid gap-6 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {customizer}
        <AiKitProvider {...settings}>
          <ThemeSample />
        </AiKitProvider>
      </div>
    </WideFrame>
  );
}

export function renderConfigExtrasPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "SettingsModal":
    case "SettingsModal/basic":
      return <SettingsModalPreview />;
    case "ValidationErrorsList":
    case "ValidationErrorsList/wide":
      return <ValidationErrorsListPreview />;
    case "ValidationErrorsList/narrow":
      return <ValidationErrorsListPreview narrow />;
    case "InvalidSettingsNotice":
    case "InvalidSettingsNotice/error":
      return <InvalidSettingsNoticePreview />;
    case "InvalidSettingsNotice/warning":
      return <InvalidSettingsWarningPreview />;
    case "McpImportDialog":
    case "McpImportDialog/basic":
      return <McpImportDialogPreview />;
    case "McpImportDialog/empty":
      return <McpImportDialogPreview empty />;
    case "McpDiscoveredServers":
    case "McpDiscoveredServers/wide":
      return <McpDiscoveredServersPreview />;
    case "McpDiscoveredServers/narrow":
      return <McpDiscoveredServersPreview narrow />;
    case "McpDiscoveredServers/error":
      return <McpDiscoveredServersPreview narrow failing />;
    case "McpConfigWarnings":
    case "McpConfigWarnings/wide":
      return <McpConfigWarningsPreview />;
    case "McpConfigWarnings/narrow":
      return <McpConfigWarningsPreview narrow />;
    case "McpToolAnnotationBadges":
    case "McpToolAnnotationBadges/basic":
    case "McpTransportIcon":
    case "McpTransportIcon/basic":
      return <McpBadgesPreview />;
    case "AgentIdentityFields":
    case "AgentIdentityFields/wide":
      return <AgentFieldsPreview />;
    case "AgentIdentityFields/narrow":
      return <AgentFieldsPreview narrow />;
    case "AgentMessage":
    case "AgentMessage/wide":
      return <AgentMessagePreview />;
    case "AgentMessage/narrow":
      return <AgentMessagePreview narrow />;
    case "TaskElapsed":
    case "TaskElapsed/basic":
      return <TaskMetaPreview />;
    case "DiffStats":
    case "DiffStats/basic":
      return <DiffMetaPreview />;
    case "MemoryPanel":
    case "MemoryPanel/wide":
      return <MemoryPanelPreview />;
    case "MemoryPanel/narrow":
      return <MemoryPanelPreview narrow />;
    case "MemoryPanel/states":
      return (
        <div className="grid w-full gap-4 md:grid-cols-3">
          <MemoryPanelPreview narrow state="loading" />
          <MemoryPanelPreview narrow state="error" />
          <MemoryPanelPreview narrow state="empty" />
        </div>
      );
    case "MemoryFileDetail":
    case "MemoryFileDetail/basic":
      return <MemoryFileDetailPreview />;
    case "AiKitProvider":
    case "AiKitProvider/settings":
      return <AiKitProviderPreview />;
    case "AiKitThemeCustomizer":
    case "AiKitThemeCustomizer/wide":
      return <AiKitThemeCustomizerPreview />;
    case "AiKitThemeCustomizer/narrow":
      return <AiKitThemeCustomizerPreview narrow />;
    default:
      return undefined;
  }
}
