"use client";

import React, { useState } from "react";
import {
  Avatar,
  Badge,
  Button,
  Code,
  Group,
  NavLink,
  PasswordInput,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconBrain,
  IconMessagePlus,
  IconMoon,
  IconPlug,
  IconPlus,
  IconRobot,
  IconServer,
  IconSettings,
  IconShieldLock,
  IconTrash,
} from "@tabler/icons-react";
import {
  AGENT_UI_STATUSES,
  CommandPalette,
  ConfirmDialog,
  EntityList,
  EntityListItem,
  KeyValueEditor,
  MasterDetail,
  SchemaValues,
  SchemaView,
  SettingRow,
  SettingsLayout,
  SettingsSection,
  ShortcutHint,
  StatusBadge,
  Wizard,
  WizardModal,
  headerKeyValidator,
  type JsonSchema,
  type KeyValuePair,
  type PaletteCommand,
  type SettingsNavItem,
  type WizardStep,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, noop, wait } from "./frames";

type ServerValues = { name: string; transport: "stdio" | "http"; command: string; url: string; token: string };

const SERVER_INITIAL: ServerValues = { name: "", transport: "stdio", command: "", url: "", token: "" };

const SERVER_STEPS: WizardStep<ServerValues>[] = [
  {
    id: "basics",
    label: "Basics",
    description: "Name and transport",
    validate: (values) => (values.name.trim() ? null : { name: "Enter a server name" }),
    render: ({ values, setValue, errors }) => (
      <Stack gap="sm">
        <TextInput
          label="Server name"
          placeholder="git"
          withAsterisk
          value={values.name}
          error={errors.name}
          onChange={(event) => setValue("name", event.currentTarget.value)}
        />
        <SegmentedControl
          value={values.transport}
          onChange={(value) => setValue("transport", value as ServerValues["transport"])}
          data={[
            { value: "stdio", label: "Local command" },
            { value: "http", label: "Remote URL" },
          ]}
        />
      </Stack>
    ),
  },
  {
    id: "command",
    label: "Command",
    description: "How to start it",
    when: (values) => values.transport === "stdio",
    validate: (values) => (values.command.trim() ? null : { command: "Enter a command" }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="Command"
        placeholder="npx -y @modelcontextprotocol/server-git"
        value={values.command}
        error={errors.command}
        onChange={(event) => setValue("command", event.currentTarget.value)}
      />
    ),
  },
  {
    id: "connection",
    label: "Connection",
    description: "Endpoint and token",
    when: (values) => values.transport === "http",
    validate: (values) =>
      /^https?:\/\//.test(values.url) ? null : { url: "Enter an http(s) URL" },
    render: ({ values, setValue, errors }) => (
      <Stack gap="sm">
        <TextInput
          label="URL"
          placeholder="https://mcp.example.com/mcp"
          value={values.url}
          error={errors.url}
          onChange={(event) => setValue("url", event.currentTarget.value)}
        />
        <PasswordInput
          label="Token"
          value={values.token}
          onChange={(event) => setValue("token", event.currentTarget.value)}
        />
      </Stack>
    ),
  },
];

function reviewServer(values: ServerValues) {
  return (
    <Stack gap={4}>
      <Text size="sm">
        <b>{values.name}</b> via {values.transport}
      </Text>
      <Code block>{values.transport === "stdio" ? values.command : values.url}</Code>
    </Stack>
  );
}

function WizardInlinePreview({ narrow = false, nonLinear = false }: { narrow?: boolean; nonLinear?: boolean }) {
  const [result, setResult] = useState<ServerValues | null>(null);
  const initialValues = nonLinear
    ? { name: "git", transport: "http" as const, command: "", url: "https://git.example.com/mcp/", token: "" }
    : SERVER_INITIAL;
  const wizard = (
    <div className="p-4">
      <Wizard
        steps={SERVER_STEPS}
        initialValues={initialValues}
        nonLinear={nonLinear}
        review={reviewServer}
        labels={nonLinear ? { finish: "Save" } : undefined}
        onCancel={() => setResult(null)}
        onComplete={async (values) => {
          await wait(500);
          setResult(values);
        }}
      />
      <ResultBlock value={result} />
    </div>
  );
  return narrow ? <NarrowFrame>{wizard}</NarrowFrame> : <WideFrame>{wizard}</WideFrame>;
}

function WizardModalPreview() {
  const [opened, setOpened] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <Button onClick={() => setOpened(true)}>Add MCP server</Button>
      <WizardModal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Add MCP server"
        steps={SERVER_STEPS}
        initialValues={SERVER_INITIAL}
        review={reviewServer}
        labels={{ finish: "Add server" }}
        onComplete={async () => {
          await wait(500);
          setOpened(false);
        }}
      />
    </div>
  );
}

function ConfirmDialogPreview({ fails = false }: { fails?: boolean }) {
  const [opened, setOpened] = useState(false);
  const [result, setResult] = useState("");
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Button color="red" variant="light" leftSection={<IconTrash size={14} />} onClick={() => setOpened(true)}>
        Delete rule
      </Button>
      {result && <Text size="sm">{result}</Text>}
      <ConfirmDialog
        opened={opened}
        onClose={() => setOpened(false)}
        title="Delete rule"
        message={
          <>
            <Code>Bash(npm run test:*)</Code> will be removed from the project settings.
          </>
        }
        labels={{ confirm: "Delete" }}
        danger
        onConfirm={async () => {
          await wait(600);
          if (fails) throw new Error(".agent/settings.json is read-only");
          setResult("Deleted");
        }}
      />
    </div>
  );
}

const SETTINGS_SECTIONS: SettingsNavItem[] = [
  { id: "general", label: "General", icon: <IconSettings size={16} /> },
  { id: "models", label: "Models", description: "Default model and limits", icon: <IconBrain size={16} />, group: "Agent" },
  { id: "permissions", label: "Permissions", icon: <IconShieldLock size={16} />, group: "Agent" },
  {
    id: "mcp",
    label: "MCP servers",
    description: "Connected tools",
    icon: <IconPlug size={16} />,
    badge: (
      <Badge size="xs" variant="light">
        3
      </Badge>
    ),
    group: "Integrations",
  },
];

function SettingsContent({ id }: { id: string }) {
  if (id === "models") {
    return (
      <SettingsSection title="Default model" description="Used for new conversations">
        <SettingRow
          label="Model"
          htmlFor="docs-model"
          control={<Select id="docs-model" data={["qwen-2.5-coder-32b", "llama-3.3-70b"]} defaultValue="qwen-2.5-coder-32b" />}
        />
        <SettingRow
          label="Max output tokens"
          description="Longer answers cost more"
          htmlFor="docs-tokens"
          control={<TextInput id="docs-tokens" defaultValue="8000" />}
        />
      </SettingsSection>
    );
  }
  return (
    <Stack gap="lg">
      <SettingsSection
        title="Appearance"
        description="How the assistant looks in this workspace"
        actions={
          <Button size="xs" variant="default">
            Reset
          </Button>
        }
      >
        <SettingRow
          label="Compact messages"
          description="Reduce spacing between messages"
          control={<Switch aria-label="Compact messages" defaultChecked />}
        />
        <SettingRow
          label="Show tool details"
          description="Expand tool calls by default"
          control={<Switch aria-label="Show tool details" />}
        />
      </SettingsSection>
      <SettingsSection title="Danger zone" description="These actions cannot be undone" danger>
        <SettingRow
          label="Delete all conversations"
          control={
            <Button color="red" variant="light" size="xs">
              Delete
            </Button>
          }
        />
      </SettingsSection>
    </Stack>
  );
}

function SettingsLayoutPreview({ narrow = false }: { narrow?: boolean }) {
  const [activeId, setActiveId] = useState("general");
  const layout = (
    <SettingsLayout title="Settings" sections={SETTINGS_SECTIONS} activeId={activeId} onActiveIdChange={setActiveId} withSearch>
      <SettingsContent id={activeId} />
    </SettingsLayout>
  );
  return narrow ? <NarrowFrame height={520}>{layout}</NarrowFrame> : <WideFrame height={520}>{layout}</WideFrame>;
}

function SettingRowsPreview() {
  return (
    <div className="flex w-full flex-col gap-6">
      {[360, 640].map((width) => (
        <div key={width} style={{ width, maxWidth: "100%" }} className="mx-auto">
          <Text size="xs" c="dimmed" mb={4}>
            {width}px
          </Text>
          <SettingsSection title="Row layouts">
            <SettingRow label="Auto" description="Inline from 480px of row width" control={<Switch aria-label="Auto" />} />
            <SettingRow
              label="Stacked"
              description="Always under the text"
              layout="stacked"
              control={<TextInput aria-label="Stacked" placeholder="Value" />}
            />
          </SettingsSection>
        </div>
      ))}
    </div>
  );
}

const ITEMS = [
  { id: "git", name: "git", tools: 42, status: "success" as const, label: "Connected" },
  { id: "filesystem", name: "filesystem", tools: 11, status: "success" as const, label: "Connected" },
  { id: "postgres", name: "postgres", tools: 3, status: "disabled" as const, label: "Disabled" },
  { id: "issues", name: "issues", tools: 18, status: "needs-auth" as const, label: "Needs auth" },
  { id: "errors", name: "errors", tools: 7, status: "error" as const, label: "Failed" },
];

function MasterDetailPreview({ narrow = false, resizable = false }: { narrow?: boolean; resizable?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(narrow ? null : "git");
  const selected = ITEMS.find((item) => item.id === selectedId);
  const view = (
    <MasterDetail
      resizable={resizable}
      list={
        <Stack gap={2} p="xs">
          {ITEMS.map((item) => (
            <NavLink
              key={item.id}
              component="button"
              type="button"
              label={item.name}
              description={`${item.tools} tools`}
              leftSection={<IconServer size={16} />}
              rightSection={<StatusBadge status={item.status} label={item.label} size="xs" />}
              active={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
            />
          ))}
        </Stack>
      }
      detail={
        selected ? (
          <Stack p="lg" gap="sm">
            <Title order={3}>{selected.name}</Title>
            <StatusBadge status={selected.status} label={selected.label} />
            <Text size="sm" c="dimmed">
              {selected.tools} tools are available to the agent.
            </Text>
          </Stack>
        ) : null
      }
      onBack={() => setSelectedId(null)}
    />
  );
  return narrow ? <NarrowFrame height={460}>{view}</NarrowFrame> : <WideFrame height={460}>{view}</WideFrame>;
}

type Server = { id: string; name: string; description: string; transport: "stdio" | "http"; tools: number; scope: string; disabled?: boolean };

const SERVERS: Server[] = [
  { id: "git", name: "Git host", description: "Issues, pull requests and repository contents.", transport: "http", tools: 42, scope: "User" },
  { id: "filesystem", name: "Filesystem", description: "Read and write files inside the project.", transport: "stdio", tools: 11, scope: "Project" },
  { id: "postgres", name: "Postgres", description: "Read-only SQL against the analytics replica.", transport: "stdio", tools: 3, scope: "Project" },
  { id: "tickets", name: "Ticket desk", description: "Disabled by the workspace administrator.", transport: "http", tools: 18, scope: "User", disabled: true },
];

function EntityListPreview({ grouped = false }: { grouped?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>("filesystem");
  const [query, setQuery] = useState("");
  const [transport, setTransport] = useState("all");
  return (
    <NarrowFrame className="p-3">
      <EntityList<Server>
        items={SERVERS}
        getId={(server) => server.id}
        isItemDisabled={(server) => !!server.disabled}
        selectedId={selectedId}
        onSelect={(server) => setSelectedId(server.id)}
        ariaLabel="MCP servers"
        search={{
          value: query,
          onChange: setQuery,
          placeholder: "Search servers",
          filter: (server, q) => server.name.toLowerCase().includes(q.toLowerCase()),
        }}
        filters={
          grouped
            ? {
                value: transport,
                onChange: setTransport,
                filter: (server, value) => value === "all" || server.transport === value,
                options: [
                  { value: "all", label: "All", count: SERVERS.length },
                  { value: "stdio", label: "stdio", count: 2 },
                  { value: "http", label: "HTTP", count: 2 },
                ],
              }
            : undefined
        }
        groupBy={grouped ? (server) => server.scope : undefined}
        toolbar={
          <Button size="sm" variant="light" leftSection={<IconPlus size={14} />}>
            Add
          </Button>
        }
        renderItem={(server, { selected }) => (
          <EntityListItem
            title={server.name}
            description={server.description}
            icon={
              <Avatar size="sm" radius="sm" color="gray">
                {server.transport === "http" ? <IconPlug size={16} /> : <IconServer size={16} />}
              </Avatar>
            }
            meta={`${server.tools} tools`}
            selected={selected}
            disabled={server.disabled}
            actions={[
              { label: "Reconnect", onClick: noop },
              { label: "Remove", icon: <IconTrash size={14} />, color: "red", onClick: noop },
            ]}
          />
        )}
      />
    </NarrowFrame>
  );
}

function EntityListStatesPreview() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-border p-3">
        <Group justify="space-between" mb="xs">
          <Text size="xs" c="dimmed">
            Loading
          </Text>
          <Button size="compact-xs" variant="subtle" onClick={() => setLoading((value) => !value)}>
            Toggle
          </Button>
        </Group>
        <EntityList<Server>
          items={loading ? [] : SERVERS.slice(0, 2)}
          loading={loading}
          getId={(server) => server.id}
          renderItem={(server) => <EntityListItem title={server.name} description={server.description} />}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border p-3">
          <EntityList<Server>
            items={[]}
            getId={(server) => server.id}
            renderItem={() => null}
            empty={{
              title: "No servers",
              description: "Connect an MCP server to give the agent tools.",
              icon: <IconServer size={28} />,
              action: <Button size="xs">Add server</Button>,
            }}
          />
        </div>
        <div className="rounded-lg border border-border p-3">
          <EntityList<Server>
            items={[]}
            getId={(server) => server.id}
            renderItem={() => null}
            error="Could not read ~/.agent/config.json"
            onRetry={noop}
          />
        </div>
      </div>
    </div>
  );
}

const COMMANDS: PaletteCommand[] = [
  { id: "new-chat", label: "New chat", description: "Start a conversation", group: "Chat", icon: <IconMessagePlus size={16} />, shortcut: "mod+N" },
  { id: "clear", label: "Clear conversation", group: "Chat", icon: <IconTrash size={16} />, keywords: ["reset", "wipe"] },
  { id: "switch-agent", label: "Switch agent", description: "Choose another agent profile", group: "Agents", icon: <IconRobot size={16} /> },
  { id: "mcp", label: "Manage MCP servers", group: "Settings", icon: <IconPlug size={16} />, keywords: ["tools", "connectors"] },
  { id: "theme", label: "Toggle dark theme", group: "Settings", icon: <IconMoon size={16} />, shortcut: "mod+J" },
  { id: "export", label: "Export transcript", description: "Available after the first message", group: "Chat", disabled: true },
];

function CommandPalettePreview({ withRecent = false }: { withRecent?: boolean }) {
  const [opened, setOpened] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>(withRecent ? ["theme", "new-chat"] : []);
  const [last, setLast] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Group gap="xs">
        <Button variant="default" onClick={() => setOpened(true)}>
          Open palette
        </Button>
        <ShortcutHint keys="mod+K" />
      </Group>
      {last && (
        <Text size="sm">
          Ran <Code>{last}</Code>
        </Text>
      )}
      <CommandPalette
        opened={opened}
        onClose={() => setOpened(false)}
        onOpen={() => setOpened(true)}
        hotkey="mod+K"
        commands={COMMANDS}
        recentIds={recentIds}
        onSelect={(command) => {
          setLast(command.id);
          if (withRecent) {
            setRecentIds((ids) => [command.id, ...ids.filter((id) => id !== command.id)].slice(0, 3));
          }
        }}
      />
    </div>
  );
}

function StatusBadgeAllPreview() {
  return (
    <Stack gap="lg" align="center">
      <Group gap="xs" justify="center">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} />
        ))}
      </Group>
      <Group gap="lg" justify="center">
        {AGENT_UI_STATUSES.map((status) => (
          <StatusBadge key={status} status={status} variant="dot" />
        ))}
      </Group>
    </Stack>
  );
}

function StatusBadgeRowsPreview() {
  const rows = [
    { name: "git", status: "success" as const, label: "Connected" },
    { name: "filesystem", status: "running" as const, label: "Connecting" },
    { name: "issues", status: "needs-auth" as const },
    { name: "postgres", status: "error" as const, label: "Failed to start" },
  ];
  return (
    <NarrowFrame className="p-3">
      <Stack gap="xs">
        {rows.map((row) => (
          <Group key={row.name} justify="space-between" wrap="nowrap" gap="sm">
            <Text size="sm" truncate>
              {row.name}
            </Text>
            <StatusBadge status={row.status} label={row.label} variant="dot" />
          </Group>
        ))}
      </Stack>
    </NarrowFrame>
  );
}

function ShortcutHintPreview() {
  return (
    <Stack gap="md" align="center">
      <ShortcutHint keys="mod+K" label="Search" />
      <Group gap="xl">
        <ShortcutHint keys="mod+shift+P" platform="mac" label="macOS" />
        <ShortcutHint keys="mod+shift+P" platform="other" label="Windows / Linux" />
      </Group>
      <Group gap="xl">
        {(["xs", "sm", "md"] as const).map((size) => (
          <ShortcutHint key={size} keys={["mod", "enter"]} size={size} />
        ))}
      </Group>
    </Stack>
  );
}

function ShortcutListPreview() {
  const shortcuts = [
    { label: "Command palette", keys: "mod+K" },
    { label: "New line", keys: "shift+enter" },
    { label: "Stop generation", keys: "esc" },
    { label: "Previous message", keys: "alt+up" },
  ];
  return (
    <NarrowFrame className="p-3">
      <Stack gap="xs">
        {shortcuts.map((shortcut) => (
          <Group key={shortcut.label} justify="space-between" wrap="nowrap" gap="sm">
            <Text size="sm" truncate>
              {shortcut.label}
            </Text>
            <ShortcutHint keys={shortcut.keys} />
          </Group>
        ))}
      </Stack>
    </NarrowFrame>
  );
}

const ENV: KeyValuePair[] = [
  { id: "env-1", key: "DATABASE_URL", value: "postgres://localhost:5432/app" },
  { id: "env-2", key: "MODEL_API_KEY", value: "sk-live-123", secret: true },
  { id: "env-3", key: "LOG_LEVEL", value: "debug" },
];

function KeyValueEditorPreview({ headers = false }: { headers?: boolean }) {
  const [pairs, setPairs] = useState<KeyValuePair[]>(
    headers
      ? [
          { id: "h-1", key: "Authorization", value: "Bearer token", secret: true },
          { id: "h-2", key: "X Trace", value: "1" },
        ]
      : ENV,
  );
  const editor = (
    <div className="p-3">
      <KeyValueEditor
        value={pairs}
        onChange={setPairs}
        keyPlaceholder={headers ? "Header" : "Name"}
        addLabel={headers ? "Add header" : "Add variable"}
        allowSecrets
        validateKey={headers ? headerKeyValidator : undefined}
      />
      <ResultBlock value={pairs} />
    </div>
  );
  return headers ? <WideFrame>{editor}</WideFrame> : <NarrowFrame>{editor}</NarrowFrame>;
}

const CREATE_ISSUE: JsonSchema = {
  type: "object",
  required: ["repo", "title"],
  properties: {
    repo: { type: "string", description: "Repository in owner/name form" },
    title: { type: "string", description: "Issue title" },
    body: { type: ["string", "null"], description: "Markdown body" },
    priority: {
      description: "How urgent the issue is",
      oneOf: [{ const: "low" }, { const: "medium" }, { const: "high" }],
      default: "medium",
    },
    estimate: { type: "integer", minimum: 1, maximum: 13, description: "Story points" },
    labels: { type: "array", items: { type: "string" }, default: [] },
    assignee: {
      type: "object",
      description: "Who works on it",
      required: ["login"],
      properties: {
        login: { type: "string" },
        notify: { type: "boolean", default: true },
      },
    },
    attachments: {
      type: "array",
      description: "Files to attach",
      items: {
        type: "object",
        required: ["url"],
        properties: { url: { type: "string", format: "uri" }, name: { type: "string" } },
      },
    },
  },
};

const CREATE_ISSUE_ARGUMENTS = {
  repo: "sinups/ai-kit",
  title: "Retry the token refresh once before failing the request",
  estimate: 3,
  labels: ["bug", "auth"],
  assignee: { login: "sinups", notify: true },
  apiToken: "ghp_exampleexampleexample",
  draft: true,
};

function SchemaValuesPreview({ narrow = false }: { narrow?: boolean }) {
  const view = <SchemaValues schema={CREATE_ISSUE} values={CREATE_ISSUE_ARGUMENTS} />;
  return narrow ? (
    <NarrowFrame className="p-3">{view}</NarrowFrame>
  ) : (
    <WideFrame className="p-3">{view}</WideFrame>
  );
}

function SchemaViewPreview({ narrow = false }: { narrow?: boolean }) {
  return narrow ? (
    <NarrowFrame className="p-3">
      <SchemaView schema={CREATE_ISSUE} />
    </NarrowFrame>
  ) : (
    <WideFrame className="p-3">
      <SchemaView schema={CREATE_ISSUE} />
    </WideFrame>
  );
}

export function renderPrimitivePreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "Wizard":
    case "Wizard/wide":
      return <WizardInlinePreview />;
    case "Wizard/narrow":
      return <WizardInlinePreview narrow />;
    case "Wizard/modal":
      return <WizardModalPreview />;
    case "Wizard/non-linear":
      return <WizardInlinePreview nonLinear />;
    case "ConfirmDialog":
    case "ConfirmDialog/basic":
      return <ConfirmDialogPreview />;
    case "ConfirmDialog/rejected":
      return <ConfirmDialogPreview fails />;
    case "SettingsLayout":
    case "SettingsLayout/wide":
      return <SettingsLayoutPreview />;
    case "SettingsLayout/narrow":
      return <SettingsLayoutPreview narrow />;
    case "SettingsLayout/rows":
      return <SettingRowsPreview />;
    case "MasterDetail":
    case "MasterDetail/wide":
      return <MasterDetailPreview />;
    case "MasterDetail/narrow":
      return <MasterDetailPreview narrow />;
    case "MasterDetail/resizable":
      return <MasterDetailPreview resizable />;
    case "EntityList":
    case "EntityList/basic":
      return <EntityListPreview />;
    case "EntityList/grouped":
      return <EntityListPreview grouped />;
    case "EntityList/states":
      return <EntityListStatesPreview />;
    case "CommandPalette":
    case "CommandPalette/basic":
      return <CommandPalettePreview />;
    case "CommandPalette/recent":
      return <CommandPalettePreview withRecent />;
    case "StatusBadge":
    case "StatusBadge/all":
      return <StatusBadgeAllPreview />;
    case "StatusBadge/rows":
      return <StatusBadgeRowsPreview />;
    case "ShortcutHint":
    case "ShortcutHint/basic":
      return <ShortcutHintPreview />;
    case "ShortcutHint/list":
      return <ShortcutListPreview />;
    case "KeyValueEditor":
    case "KeyValueEditor/env":
      return <KeyValueEditorPreview />;
    case "KeyValueEditor/headers":
      return <KeyValueEditorPreview headers />;
    case "SchemaView":
    case "SchemaView/wide":
      return <SchemaViewPreview />;
    case "SchemaView/narrow":
      return <SchemaViewPreview narrow />;
    case "SchemaValues":
    case "SchemaValues/wide":
      return <SchemaValuesPreview />;
    case "SchemaValues/narrow":
      return <SchemaValuesPreview narrow />;
    default:
      return undefined;
  }
}
