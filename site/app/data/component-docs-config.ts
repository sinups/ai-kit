import type { ComponentDoc } from '@/app/data/component-docs';

export const CONFIG_EXTRA_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: 'SettingsModal',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { useState } from "react";
import { Button, Switch } from "@mantine/core";
import { SettingRow, SettingsModal, SettingsSection, type SettingsNavItem } from "@sinups/ai-kit";

const sections: SettingsNavItem[] = [
  { id: "general", label: "General" },
  { id: "models", label: "Models", description: "Default model and limits", group: "Agent" },
  { id: "mcp", label: "MCP servers", group: "Integrations", fill: true },
];

export function Example() {
  const [opened, setOpened] = useState(false);
  const [activeId, setActiveId] = useState("general");

  return (
    <>
      <Button onClick={() => setOpened(true)}>Settings</Button>
      <SettingsModal
        opened={opened}
        onClose={() => setOpened(false)}
        sections={sections}
        activeId={activeId}
        onActiveIdChange={setActiveId}
        withSearch
      >
        <SettingsSection title="General">
          <SettingRow label="Stream responses" control={<Switch defaultChecked />} />
        </SettingsSection>
      </SettingsModal>
    </>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Use SettingsModal when settings open over the current screen instead of on their own route. It renders SettingsLayout inside a Mantine Modal with a fixed height, so switching sections does not resize the dialog. It accepts every SettingsLayout prop except `title`, which becomes the modal title (`Settings` by default). `size` sets the width (`70rem` by default); below `fullScreenQuery` (`(max-width: 48em)` by default) the modal goes full screen and the layout switches to its narrow form with a section picker. Sections with `fill: true` get the full height without the layout scroll area, which suits panels that scroll themselves, such as McpSettingsPanel or MemoryPanel.',
      },
      {
        type: 'example',
        title: 'Modal',
        previewId: 'SettingsModal/basic',
        code: `<SettingsModal
  opened={opened}
  onClose={close}
  sections={sections}
  activeId={activeId}
  onActiveIdChange={setActiveId}
  withSearch
>
  <SettingsSection title="Models">
    <SettingRow label="Default model" description="Used for new conversations" control={<Select data={models} />} />
    <SettingRow label="Stream responses" control={<Switch defaultChecked />} />
  </SettingsSection>
</SettingsModal>`,
      },
    ],
  },
  {
    name: 'ValidationErrorsList',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { ValidationErrorsList, type SettingsValidationError } from "@sinups/ai-kit";

const errors: SettingsValidationError[] = [
  {
    file: ".agent/settings.json",
    path: "permissions.allow[2]",
    message: 'Unknown tool "Shell(npm test)"',
    suggestion: 'Did you mean "Bash(npm test)"?',
    docsUrl: "https://example.com/docs/permissions",
  },
  { file: ".agent/settings.json", path: "model", message: "Expected a string, received a number" },
  {
    file: ".agent/settings.local.json",
    path: "env.EDITOR",
    message: "Overrides the value from the project settings",
    severity: "warning",
  },
];

export function Example({ openFile }: { openFile: (file: string) => void }) {
  return <ValidationErrorsList errors={errors} maxItems={5} onOpenFile={openFile} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show the problems found while validating settings files. Errors are grouped by `file`; each group has a header with the file name, a problem count (red when the group has errors, yellow when it has only warnings) and an Open file button when `onOpenFile` is set. Each row shows the field `path`, the `message`, an optional `suggestion` and a Docs link for `docsUrl`. Identical errors (same file, path and message) are shown once. `maxItems` limits rows per file and adds a Show more button. Set `withFileHeaders={false}` when the file is already named nearby, as InvalidSettingsNotice does. With no errors nothing renders, or `emptyLabel` if you pass one. File names are truncated from the start, so the file name stays visible in a narrow column. The grouping logic is exported as pure functions: `groupValidationErrors`, `dedupeValidationErrors`, `getValidationSeverity`, `getValidationErrorKey` and `fillValidationTemplate`.',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'ValidationErrorsList/wide',
        code: `<ValidationErrorsList errors={errors} maxItems={2} onOpenFile={openFile} />`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'ValidationErrorsList/narrow',
        code: `<div style={{ width: 360 }}>
  <ValidationErrorsList errors={errors} maxItems={2} onOpenFile={openFile} />
</div>`,
      },
    ],
  },
  {
    name: 'InvalidSettingsNotice',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { InvalidSettingsNotice, type SettingsValidationError } from "@sinups/ai-kit";

export function Example({
  errors,
  openFile,
  skipFile,
  dismiss,
}: {
  errors: SettingsValidationError[];
  openFile: (file: string) => void;
  skipFile: () => Promise<void>;
  dismiss: () => void;
}) {
  return (
    <InvalidSettingsNotice
      file=".agent/settings.json"
      errors={errors}
      onOpenFile={openFile}
      onContinueWithout={skipFile}
      onDismiss={dismiss}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Tell the user that a settings file failed validation and is ignored, and offer a way out. Place it above the chat or at the top of a settings screen. The description is built from the problem count: pass `errors` to show the count and an expandable ValidationErrorsList (Show details), or only `count` when the details are not available. The color follows the errors: red when at least one is an error, yellow when all are warnings; `severity` overrides it. Actions appear only for the callbacks you pass: Open file (`onOpenFile`), Continue without this file (`onContinueWithout`, which may return a promise: the button shows a loader and a rejection message is shown inside the alert) and a close button (`onDismiss`). `defaultExpanded` opens the details initially; `title`, `description` and `labels` (with `labels.list` for the error list) replace the English texts.',
      },
      {
        type: 'example',
        title: 'Errors with actions',
        previewId: 'InvalidSettingsNotice/error',
        code: `<InvalidSettingsNotice
  file=".agent/settings.json"
  errors={errors}
  onOpenFile={openFile}
  onContinueWithout={skipFile}
  onDismiss={dismiss}
/>`,
      },
      {
        type: 'example',
        title: 'Warnings, count only, failing action',
        previewId: 'InvalidSettingsNotice/warning',
        code: `<>
  <InvalidSettingsNotice file=".agent/settings.local.json" errors={warnings} defaultExpanded />
  <InvalidSettingsNotice
    file="~/.agent/settings.json"
    count={4}
    onContinueWithout={() => Promise.reject(new Error("The file is locked by another process"))}
  />
</>`,
      },
    ],
  },
  {
    name: 'McpImportDialog',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { McpImportDialog, type McpServerCandidate } from "@sinups/ai-kit";

const candidates: McpServerCandidate[] = [
  { id: "git", name: "git", transport: "stdio", command: "uvx", args: ["mcp-server-git"] },
  { id: "issues", name: "issues", transport: "http", url: "https://issues.example.com/mcp" },
];

export function Example({ save }: { save: (servers: McpServerCandidate[]) => Promise<void> }) {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button onClick={() => setOpened(true)}>Import servers</Button>
      <McpImportDialog
        opened={opened}
        onClose={() => setOpened(false)}
        sourceLabel="Desktop client"
        servers={candidates}
        existingNames={["git", "filesystem"]}
        onImport={save}
      />
    </>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          "Import MCP servers found in another client's configuration. Every candidate is selected initially and shows its transport and target (command or URL). Names that collide with `existingNames` (case-insensitive) get a `_1`, `_2` suffix, marked Renamed, and stay editable; invalid, taken or duplicate names block the Import button with a message under the field. `onImport` receives the selected servers with their final names. While its promise is pending the button shows a loader and the inputs are disabled; a rejection keeps the dialog open with the message in an alert; on success the dialog closes. With an empty `servers` list the dialog shows an empty state. The rename and validation rules are exported as `resolveImportNames` and `validateImportNames`, so you can apply the same rules on the server side.",
      },
      {
        type: 'example',
        title: 'Import with renames',
        previewId: 'McpImportDialog/basic',
        code: `<McpImportDialog
  opened={opened}
  onClose={close}
  sourceLabel="Desktop client"
  servers={candidates}
  existingNames={["git", "filesystem"]}
  onImport={save}
/>`,
      },
      {
        type: 'example',
        title: 'Empty',
        previewId: 'McpImportDialog/empty',
        code: `<McpImportDialog opened={opened} onClose={close} sourceLabel="Desktop client" servers={[]} onImport={save} />`,
      },
    ],
  },
  {
    name: 'McpDiscoveredServers',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { McpDiscoveredServers, type McpDiscoveredServer } from "@sinups/ai-kit";

const discovered: McpDiscoveredServer[] = [
  { id: "filesystem", name: "filesystem", transport: "stdio", command: "npx", args: ["-y", "mcp-filesystem", "./docs"], source: ".mcp.json" },
  { id: "errors", name: "errors", transport: "http", url: "https://errors.example.com/mcp", source: ".mcp.json" },
];

export function Example({
  approve,
  reject,
}: {
  approve: (servers: McpDiscoveredServer[]) => Promise<void>;
  reject: (servers: McpDiscoveredServer[]) => Promise<void>;
}) {
  return <McpDiscoveredServers servers={discovered} onApprove={approve} onReject={reject} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Ask the user to approve MCP servers that a project configuration adds, before any of them runs. Pass only servers the user has not decided on yet; with an empty list nothing renders, so remove servers from the list once the decision is saved. All servers are selected by default (`defaultSelectedIds` changes that). `onApprove` receives the selected servers; `onReject` receives every listed server and the Reject button appears only when it is set. Both buttons show a loader while the promise is pending, and a rejection is shown in a dismissible alert. The card works in a 360px widget and on a settings page.',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'McpDiscoveredServers/wide',
        code: `<McpDiscoveredServers servers={pending} onApprove={approve} onReject={reject} />`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'McpDiscoveredServers/narrow',
        code: `<div style={{ width: 360 }}>
  <McpDiscoveredServers servers={pending} onApprove={approve} onReject={reject} />
</div>`,
      },
      {
        type: 'example',
        title: 'Saving fails',
        previewId: 'McpDiscoveredServers/error',
        code: `<McpDiscoveredServers
  servers={pending}
  onApprove={() => Promise.reject(new Error("Could not write .agent/settings.local.json"))}
  onReject={reject}
/>`,
      },
    ],
  },
  {
    name: 'McpConfigWarnings',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { McpConfigWarnings, type McpConfigWarning } from "@sinups/ai-kit";

const warnings: McpConfigWarning[] = [
  { file: ".mcp.json", path: "mcpServers.git", kind: "duplicate-name", message: "Also defined in ~/.agent/mcp.json; the project entry wins" },
  { file: ".mcp.json", path: "mcpServers.postgres.timeout", kind: "unknown-field", message: "Field is ignored" },
  { file: "~/.agent/mcp.json", path: "mcpServers.issues.url", kind: "invalid-value", message: "Expected an http or https URL" },
];

export function Example({ openFile }: { openFile: (file: string) => void }) {
  return <McpConfigWarnings warnings={warnings} onOpenFile={openFile} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'List problems found while reading MCP configuration files, usually above McpServerList. Warnings are grouped by file with the field path, a kind badge and the message; exact duplicates are shown once. Known kinds are `duplicate-name`, `unknown-field` and `invalid-value`; any other string is accepted and shown as is unless you add a label for it in `labels.kinds`. With no warnings nothing renders. `onOpenFile` adds an Open file button to each group. The grouping is exported as `groupConfigWarnings`.',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'McpConfigWarnings/wide',
        code: `<McpConfigWarnings warnings={warnings} onOpenFile={openFile} />`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'McpConfigWarnings/narrow',
        code: `<div style={{ width: 360 }}>
  <McpConfigWarnings warnings={warnings} onOpenFile={openFile} />
</div>`,
      },
    ],
  },
  {
    name: 'McpToolAnnotationBadges',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { Group, Text } from "@mantine/core";
import { McpToolAnnotationBadges, McpTransportIcon, type McpToolDefinition } from "@sinups/ai-kit";

export function ToolRow({ tool }: { tool: McpToolDefinition }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <McpTransportIcon transport="stdio" />
      <Text size="sm" ff="monospace">{tool.name}</Text>
      <McpToolAnnotationBadges annotations={tool.annotations} withTooltips />
    </Group>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show the behavior hints an MCP server declares for a tool: read-only (teal), destructive (red), idempotent (gray) and open world (blue), mapped from `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. Hints that are false or missing produce no badge; with no hints the component renders nothing. `withTooltips` adds a one-line explanation to each badge; `labels` replaces the label and description of every kind (defaults are in `DEFAULT_MCP_TOOL_ANNOTATION_LABELS`). McpToolDetail and McpServerDetail use it; use it in your own tool lists and approval prompts. `getMcpToolAnnotationKinds` returns the kinds without rendering.',
      },
      {
        type: 'example',
        title: 'Annotations and transports',
        previewId: 'McpToolAnnotationBadges/basic',
        code: `<Group gap="sm" wrap="nowrap">
  <McpTransportIcon transport="http" />
  <Text size="sm" ff="monospace">delete_issue</Text>
  <McpToolAnnotationBadges annotations={{ destructiveHint: true, openWorldHint: true }} withTooltips />
</Group>`,
      },
    ],
  },
  {
    name: 'McpTransportIcon',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { Group, Text } from "@mantine/core";
import { McpTransportIcon, type McpTransport } from "@sinups/ai-kit";

const TRANSPORT_NAMES: Record<McpTransport, string> = { stdio: "stdio", http: "HTTP", sse: "SSE" };

export function TransportLabel({ transport }: { transport: McpTransport }) {
  return (
    <Group gap={6} wrap="nowrap">
      <McpTransportIcon transport={transport} size={14} />
      <Text size="xs">{TRANSPORT_NAMES[transport]}</Text>
    </Group>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Icon for an MCP transport: a terminal for `stdio`, a globe for `http` and a broadcast icon for `sse`. `size` is in px, 16 by default. The icon is decorative (`aria-hidden`), so put the transport name next to it. The MCP list, detail, wizard, import and discovery components use it.',
      },
      {
        type: 'example',
        title: 'Transports',
        previewId: 'McpTransportIcon/basic',
        code: `<>
  <McpTransportIcon transport="stdio" />
  <McpTransportIcon transport="http" />
  <McpTransportIcon transport="sse" />
</>`,
      },
    ],
  },
  {
    name: 'AgentIdentityFields',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { useState } from "react";
import { Stack } from "@mantine/core";
import {
  AgentIdentityFields,
  AgentModelFields,
  AgentPromptField,
  DEFAULT_AGENT_FIELD_LABELS,
  createAgentDraft,
  validateAgentDraft,
  type AgentDraft,
} from "@sinups/ai-kit";

const models = [
  { id: "qwen3-coder", name: "Qwen3 Coder", version: "30B" },
  { id: "llama-4-scout", name: "Llama 4 Scout" },
];

export function AgentForm({ existingNames }: { existingNames: string[] }) {
  const [draft, setDraft] = useState<AgentDraft>(() => createAgentDraft());
  const [autoName, setAutoName] = useState(true);
  const errors = validateAgentDraft(draft, { existingNames });
  const onChange = (patch: Partial<AgentDraft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const labels = DEFAULT_AGENT_FIELD_LABELS;

  return (
    <Stack gap="md">
      <AgentIdentityFields
        draft={draft}
        errors={errors}
        onChange={onChange}
        labels={labels}
        autoName={autoName}
        onNameEdited={() => setAutoName(false)}
      />
      <AgentPromptField draft={draft} errors={errors} onChange={onChange} labels={labels} />
      <AgentModelFields
        draft={draft}
        errors={errors}
        onChange={onChange}
        labels={labels}
        models={models}
        skills={["code-review", "write-tests"]}
      />
    </Stack>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'The field groups that AgentEditor and AgentCreateWizard are built from, exported for your own agent forms. All of them are controlled: they read an `AgentDraft`, report partial changes through `onChange` and show messages from `errors`. AgentIdentityFields renders display name, name and "when to use" description; while `autoName` is true the name follows the display name through `slugifyAgentName`, and `onNameEdited` fires when the user types a name by hand; `nameDisabled` locks the name when editing an existing agent. AgentPromptField is the system prompt editor with Write and Preview tabs (Markdown preview). AgentModelFields renders the model select (with an Inherit from the session option), max turns, a skills multiselect when `skills` or the draft has any, and AgentColorPicker. AgentColorPicker can be used alone: clicking the selected color clears it, `colors` defaults to `AGENT_COLORS`. Name and model fields sit in pairs when the form is wide and stack below that. Validate with `validateAgentDraft` and create drafts with `createAgentDraft` or `toAgentDraft`.',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'AgentIdentityFields/wide',
        code: `<Stack gap="md">
  <AgentIdentityFields draft={draft} errors={errors} onChange={onChange} labels={labels} autoName={autoName} onNameEdited={stopAutoName} />
  <AgentPromptField draft={draft} errors={errors} onChange={onChange} labels={labels} minRows={4} />
  <AgentModelFields draft={draft} errors={errors} onChange={onChange} labels={labels} models={models} skills={skills} />
</Stack>`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'AgentIdentityFields/narrow',
        code: `<div style={{ width: 360 }}>
  <AgentIdentityFields draft={draft} errors={errors} onChange={onChange} labels={labels} autoName={autoName} onNameEdited={stopAutoName} />
</div>`,
      },
    ],
  },
  {
    name: 'AgentMessage',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { AgentMessage, type AgentMessageData } from "@sinups/ai-kit";

const message: AgentMessageData = {
  id: "m1",
  from: { name: "planner", color: "violet" },
  to: { name: "test-runner", color: "teal" },
  summary: "Run the upload queue tests after the retry change",
  content: "The retry logic moved into upload-queue.ts. Run yarn jest upload-queue and report failures.",
  timestamp: Date.now(),
};

export function Example() {
  return <AgentMessage message={message} />;
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Show a message that one agent sent to another in a multi-agent run, for example in TaskDetail or in a team activity feed. The header shows the sender and the recipient as colored dot badges (use the same `color` for an agent everywhere) or `everyone` when `to` is omitted, and the time from `timestamp` (`formatTime` changes the format). The `summary` is always visible; `content` that differs from the summary is revealed with a Show message button, or from the start with `defaultExpanded`. Labels come from the background task labels (`labels`).',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'AgentMessage/wide',
        code: `{messages.map((message) => (
  <AgentMessage key={message.id} message={message} />
))}`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'AgentMessage/narrow',
        code: `<div style={{ width: 360 }}>
  {messages.map((message) => (
    <AgentMessage key={message.id} message={message} />
  ))}
</div>`,
      },
    ],
  },
  {
    name: 'TaskElapsed',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { Group, Text } from "@mantine/core";
import { TaskElapsed, TaskKindIcon, type BackgroundTask } from "@sinups/ai-kit";

export function TaskRow({ task }: { task: BackgroundTask }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <TaskKindIcon kind={task.kind} size="sm" />
      <Text size="sm" flex={1}>{task.title}</Text>
      <Text size="xs" c="dimmed" ff="monospace">
        <TaskElapsed task={task} />
      </Text>
    </Group>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Small pieces of task metadata for your own task rows. TaskElapsed prints the time between `startedAt` and `endedAt` (for example `1m 23s`) and ticks every second while the task is `running` and has no end time; it renders nothing for a task that has not started. It renders a bare `span`, so wrap it in Text for size and color. TaskKindIcon shows the icon of a task kind (`shell`, `agent`, `remote`, `workflow`) in a light gray ThemeIcon; `size` is a Mantine size, `md` by default. TaskList, TaskDetail and AgentTree use both. The underlying helpers are `getTaskElapsedMs`, `toTimestamp` and the `useNow` hook.',
      },
      {
        type: 'example',
        title: 'Kinds and elapsed time',
        previewId: 'TaskElapsed/basic',
        code: `<Group gap="sm" wrap="nowrap">
  <TaskKindIcon kind="shell" size="sm" />
  <Text size="sm" flex={1}>yarn test --watch</Text>
  <Text size="xs" c="dimmed" ff="monospace">
    <TaskElapsed task={{ status: "running", startedAt }} />
  </Text>
</Group>`,
      },
    ],
  },
  {
    name: 'DiffStats',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `import { Group, Text } from "@mantine/core";
import { DiffStats, FileIcon, FileStatusBadge, type FileChangeStatus } from "@sinups/ai-kit";

const statusLabels: Record<FileChangeStatus, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
};

export function ChangedFileRow({
  path,
  status,
  additions,
  deletions,
}: {
  path: string;
  status: FileChangeStatus;
  additions: number;
  deletions: number;
}) {
  return (
    <Group gap="sm" wrap="nowrap">
      <FileIcon path={path} />
      <Text size="sm" ff="monospace" flex={1} truncate>{path}</Text>
      <DiffStats additions={additions} deletions={deletions} />
      <FileStatusBadge status={status} label={statusLabels[status]} />
    </Group>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Building blocks of the diff file rows, exported for summaries outside DiffReview, such as a turn summary or a commit dialog. DiffStats prints `+N −M` in green and red monospace; `size` is the text size, `xs` by default. FileStatusBadge is a one-letter badge (A, M, D, R) colored by status, with the full `label` in a tooltip and as the accessible name; `untracked` shows a teal U instead. FileIcon shows a file type icon for TypeScript, JavaScript and JSON files and a generic file icon otherwise; `size` is in px. `getFileStatusLabel` picks the status label from diff labels, and `computeFileStats` / `summarizeChanges` count lines for you.',
      },
      {
        type: 'example',
        title: 'File rows',
        previewId: 'DiffStats/basic',
        code: `<Group gap="sm" wrap="nowrap">
  <FileIcon path="src/upload/upload-queue.ts" />
  <Text size="sm" ff="monospace" flex={1} truncate>src/upload/upload-queue.ts</Text>
  <DiffStats additions={42} deletions={7} />
  <FileStatusBadge status="modified" label="Modified" />
</Group>`,
      },
    ],
  },
  {
    name: 'MemoryPanel',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { useState } from "react";
import { MemoryPanel, type MemoryFile } from "@sinups/ai-kit";

export function Example({
  files,
  loading,
  error,
  reload,
  save,
  reveal,
}: {
  files: MemoryFile[];
  loading: boolean;
  error?: string;
  reload: () => void;
  save: (file: MemoryFile, content: string) => Promise<void>;
  reveal: (file: MemoryFile) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <MemoryPanel
      files={files}
      loading={loading}
      error={error}
      onRetry={reload}
      selectedId={selectedId}
      onSelectedIdChange={setSelectedId}
      onSave={save}
      onOpenLocation={reveal}
      style={{ height: 560 }}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Let the user read and edit the instruction files the agent loads as memory. Files are grouped by scope in a fixed order: User, Project, Local and Agent (agent files show the agent name). The list is searchable by path, agent name and content. Selecting a file opens MemoryFileDetail with the rendered Markdown. From `breakpoint` (720px of panel width by default) the list and the file sit side by side, with a placeholder when nothing is selected; below it the file replaces the list and a back button returns. The panel fills its container, so give it a height. Edit appears only with `onSave`; a rejected save keeps the editor open with the message, and leaving a file with unsaved edits asks for confirmation. `onOpenLocation` and `onCreate` add Open location and New file actions. States: `loading` shows skeleton rows, `error` shows an alert with Retry (`onRetry`), an empty `files` list shows an empty state. `selectedId` can be controlled, for example to open the file named in a Saved to memory notice. Helpers: `sortMemoryFiles`, `matchesMemoryQuery`, `getMemoryFileName`, `formatMemoryUpdatedAt`.',
      },
      {
        type: 'example',
        title: 'Wide',
        previewId: 'MemoryPanel/wide',
        code: `<MemoryPanel
  files={files}
  selectedId={selectedId}
  onSelectedIdChange={setSelectedId}
  onSave={save}
  onOpenLocation={reveal}
  onCreate={createFile}
  style={{ height: 560 }}
/>`,
      },
      {
        type: 'example',
        title: 'Narrow',
        previewId: 'MemoryPanel/narrow',
        code: `<div style={{ width: 360, height: 560 }}>
  <MemoryPanel files={files} onSave={save} onOpenLocation={reveal} style={{ height: "100%" }} />
</div>`,
      },
      {
        type: 'example',
        title: 'Loading, error, empty',
        previewId: 'MemoryPanel/states',
        code: `<>
  <MemoryPanel files={[]} loading />
  <MemoryPanel files={[]} error="Could not read ~/.agent/AGENTS.md: permission denied" onRetry={reload} />
  <MemoryPanel files={[]} onCreate={createFile} />
</>`,
      },
    ],
  },
  {
    name: 'MemoryFileDetail',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { useState } from "react";
import { MemoryFileDetail, type MemoryFile } from "@sinups/ai-kit";

export function Example({
  file,
  save,
}: {
  file: MemoryFile;
  save: (file: MemoryFile, content: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <MemoryFileDetail
      file={file}
      editing={editing}
      onEdit={() => setEditing(true)}
      onCancelEdit={() => setEditing(false)}
      onSave={save}
      onSaved={() => setEditing(false)}
    />
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'One memory file on its own: file name, scope badge, path, relative update time and the content rendered as Markdown. Use it where MemoryPanel is too much, for example after a Saved to memory notice. Editing is controlled: `editing` switches to a text editor that starts from `file.content`; the Edit button appears when both `onEdit` and `onSave` are set. Save calls `onSave` and shows a loader; a rejection keeps the editor open with the message, success calls `onSaved`. `onDirtyChange` reports unsaved edits so you can confirm before leaving. An empty file shows `This file is empty.`. `now` and `locale` control the relative update time.',
      },
      {
        type: 'example',
        title: 'View and edit',
        previewId: 'MemoryFileDetail/basic',
        code: `<MemoryFileDetail
  file={file}
  editing={editing}
  onEdit={startEditing}
  onCancelEdit={stopEditing}
  onSave={save}
  onSaved={stopEditing}
  onOpenLocation={reveal}
/>`,
      },
    ],
  },
  {
    name: 'AiKitProvider',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import "@mantine/core/styles.css";
import "@sinups/ai-kit/styles.css";
import { MantineProvider } from "@mantine/core";
import { AgentChat, AiKitProvider, type AgentChatProps } from "@sinups/ai-kit";

export function App(chat: AgentChatProps) {
  return (
    <MantineProvider>
      <AiKitProvider accent="violet" radius="round" density="compact" persistKey="ai-kit-theme">
        <AgentChat {...chat} />
      </AiKitProvider>
    </MantineProvider>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Apply the kit theme to a subtree. Render it inside your MantineProvider around the kit components; host components outside it keep the host theme. Settings: `accent` sets the primary color (gray, blue, indigo, violet, grape, pink), `radius` sets the default radius (sharp, default, round), `density` sets control heights and paddings (default, compact), `colorScheme` switches the color scheme of the whole app through Mantine. `theme` merges Mantine overrides on top of the kit theme, and `tokens` sets `--ae-*` variables for the subtree (keys without the `--ae-` prefix); tokens win over settings. The provider re-declares the CSS variables on its own element and on portals it opens, so menus and modals inside match. `persistKey` saves changes made through `useAiKitTheme().setSettings` to localStorage and restores them. `useAiKitTheme` returns the effective settings, the defaults from props, `setSettings`, `reset` and the resolved `aiKit` theme values; it throws outside a provider, and `useOptionalAiKitTheme` returns null instead. Wrap host UI placed inside a kit subtree in `AiKitHostScope` to give it the host theme back. See Theming (/docs/theming) for nesting and token details.',
      },
      {
        type: 'example',
        title: 'Settings',
        previewId: 'AiKitProvider/settings',
        code: `<>
  <AiKitProvider>
    <InputBar status="ready" onSend={handleSend} onStop={handleStop} />
  </AiKitProvider>
  <AiKitProvider accent="violet" radius="round" density="compact">
    <InputBar status="ready" onSend={handleSend} onStop={handleStop} />
  </AiKitProvider>
</>`,
      },
    ],
  },
  {
    name: 'AiKitThemeCustomizer',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { AiKitProvider, AiKitThemeCustomizer, SettingRow, SettingsSection } from "@sinups/ai-kit";

export function AppearanceSettings() {
  return (
    <AiKitProvider persistKey="ai-kit-theme">
      <SettingsSection title="Appearance">
        <AiKitThemeCustomizer />
      </SettingsSection>
    </AiKitProvider>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'Appearance settings for end users: Color (accent swatches), Radius, Density and Mode (light, dark, auto), plus a Reset button. Without `value` and `defaultValue` it reads and changes the nearest AiKitProvider, so every kit component under that provider updates at once and `persistKey` on the provider saves the choice. Pass `value` and `onChange` to control it yourself (for example to store the settings on the server and feed them to AiKitProvider as props), or `defaultValue` for uncontrolled use without a provider. `accents` limits the offered colors to a subset of `AI_KIT_ACCENTS`; every accent passes contrast checks in both schemes. `sections` hides sections, for example `{ mode: false }` when the host app owns the color scheme. It fits a 360px panel as well as a settings page column. See Theming (/docs/theming).',
      },
      {
        type: 'example',
        title: 'Wide, with a live sample',
        previewId: 'AiKitThemeCustomizer/wide',
        code: `const [settings, setSettings] = useState<AiKitThemeSettings>({ accent: "blue" });

<Grid>
  <Grid.Col span={{ base: 12, md: 5 }}>
    <AiKitThemeCustomizer value={settings} onChange={setSettings} sections={{ mode: false }} />
  </Grid.Col>
  <Grid.Col span={{ base: 12, md: 7 }}>
    <AiKitProvider {...settings}>
      <InputBar status="ready" onSend={handleSend} onStop={handleStop} />
    </AiKitProvider>
  </Grid.Col>
</Grid>`,
      },
      {
        type: 'example',
        title: 'Narrow, controlled',
        previewId: 'AiKitThemeCustomizer/narrow',
        code: `<div style={{ width: 360 }}>
  <AiKitThemeCustomizer value={settings} onChange={setSettings} sections={{ mode: false }} />
</div>`,
      },
    ],
  },
  {
    name: 'ChatLauncher',
    blocks: [
      {
        type: 'code',
        title: 'Code',
        content: `"use client";

import { ActionIcon } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { AgentChat, ChatLauncher, type AgentChatProps } from "@sinups/ai-kit";

export function SupportWidget({ chat, unread, reset }: { chat: AgentChatProps; unread: number; reset: () => void }) {
  return (
    <ChatLauncher
      title="Assistant"
      unreadCount={unread}
      headerActions={
        <ActionIcon variant="subtle" color="gray" aria-label="New conversation" onClick={reset}>
          <IconRefresh size={16} />
        </ActionIcon>
      }
    >
      <AgentChat {...chat} contentWidth="100%" alignComposer topFade />
    </ChatLauncher>
  );
}`,
      },
      {
        type: 'usage',
        title: 'Usage',
        content:
          'A floating chat button in a corner of the page that opens a chat panel. The panel is not modal: the page stays interactive, Escape closes it while focus is inside, and focus returns to the button. The chat stays mounted while the panel is closed (`keepMounted`, true by default), so the conversation and a running stream survive closing. Place it with `position` (`bottom-right` or `bottom-left`) and `offset` (24px, a number or `{ x, y }`); size the panel with `panelWidth` (380) and `panelHeight` (640), both clamped to the viewport. When the panel does not fit, or the available width is below `fullScreenBreakpoint` (520px), it opens full screen and page scroll is frozen (`mobileFullScreen`). `unreadCount` shows a badge on the closed button. Open state can be controlled with `opened` / `onOpenedChange` or left to `defaultOpened`. It renders in a portal by default; set `withinPortal={false}` to keep it inside a container. To add the chat to a page that is not a React app, or to isolate it from the page CSS, use `mountChatLauncher(target, element, options)`: it renders into a Shadow DOM with its own MantineProvider, injects the stylesheets you pass in `styles` or `styleUrls`, and returns `unmount`. See [Embedding the launcher](/docs/launcher). The previews render the launcher with `withinPortal={false}` inside a page frame, so it measures the frame instead of the window.',
      },
      {
        type: 'example',
        title: 'Desktop and mobile',
        previewId: 'ChatLauncher/frames',
        code: `<div style={{ position: "relative", height: 560, transform: "translateZ(0)" }}>
  <ChatLauncher withinPortal={false} title="Assistant" offset={16} panelHeight={500}>
    <AgentChat {...chat} contentWidth="100%" wrapLines alignComposer emptyState={welcome} />
  </ChatLauncher>
</div>`,
      },
      {
        type: 'example',
        title: 'Full screen below 520px',
        previewId: 'ChatLauncher/mobile',
        code: `<div style={{ position: "relative", width: 390, height: 560, transform: "translateZ(0)" }}>
  <ChatLauncher withinPortal={false} title="Assistant">
    <AgentChat {...chat} contentWidth="100%" wrapLines />
  </ChatLauncher>
</div>`,
      },
      {
        type: 'example',
        title: 'Unread badge and keepMounted',
        previewId: 'ChatLauncher/unread',
        code: `<ChatLauncher
  withinPortal={false}
  position="bottom-left"
  keepMounted={keepMounted}
  unreadCount={unread}
  onOpenedChange={(opened) => opened && setUnread(0)}
>
  <AgentChat {...chat} contentWidth="100%" wrapLines />
</ChatLauncher>`,
      },
      {
        type: 'code',
        title: 'Mount on any page',
        content: `import mantineCss from "@mantine/core/styles.css?inline";
import baseCss from "@sinups/ai-kit/styles/base.css?inline";
import launcherCss from "@sinups/ai-kit/styles/ChatLauncher.css?inline";
import chatCss from "@sinups/ai-kit/styles/AgentChat.css?inline";
import providerCss from "@sinups/ai-kit/styles/AiKitProvider.css?inline";
import { AiKitProvider, ChatLauncher, mountChatLauncher } from "@sinups/ai-kit";

const host = document.createElement("div");
document.body.append(host);

const widget = mountChatLauncher(
  host,
  <ChatLauncher title="Assistant">
    <SupportChat />
  </ChatLauncher>,
  {
    styles: [mantineCss, baseCss, launcherCss, chatCss, providerCss],
    colorScheme: "light",
    wrap: (element) => <AiKitProvider accent="indigo">{element}</AiKitProvider>,
  }
);

// later
widget.unmount();`,
      },
    ],
  },
];
