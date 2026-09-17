import type { ComponentDoc } from "@/app/data/component-docs";

export const PRIMITIVE_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "Wizard",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { Wizard, type WizardStep } from "@sinups/ai-kit";
import { TextInput } from "@mantine/core";

type Values = { name: string; url: string };

const steps: WizardStep<Values>[] = [
  {
    id: "name",
    label: "Name",
    validate: (values) => (values.name ? null : { name: "Enter a name" }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="Name"
        value={values.name}
        error={errors.name}
        onChange={(event) => setValue("name", event.currentTarget.value)}
      />
    ),
  },
  {
    id: "url",
    label: "URL",
    validate: async (values) => ((await ping(values.url)) ? null : { url: "Server is unreachable" }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="URL"
        value={values.url}
        error={errors.url}
        onChange={(event) => setValue("url", event.currentTarget.value)}
      />
    ),
  },
];

export function Example() {
  return (
    <Wizard
      steps={steps}
      initialValues={{ name: "", url: "" }}
      review={(values) => <pre>{JSON.stringify(values, null, 2)}</pre>}
      onComplete={(values) => saveServer(values)}
      onCancel={() => {}}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Use Wizard for multi-step flows: adding a server, creating a rule, configuring an agent. Every step validates before moving on (sync or async), `when` hides conditional steps, `review` appends a summary step, and a rejected `onComplete` is shown in an alert. The stepper is vertical from 640px of wizard width and collapses into a compact header below that. `WizardModal` wraps the same flow in a modal that goes full screen on phones. Pass `nonLinear` when editing existing values: any step can be opened and Finish validates all steps, jumping to the first invalid one. `useWizard` exposes the state machine without the UI.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "Wizard/wide",
        code: `<Wizard
  steps={steps}
  initialValues={{ name: "", transport: "stdio", command: "", url: "", token: "" }}
  review={renderReview}
  onComplete={saveServer}
  onCancel={reset}
/>`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "Wizard/narrow",
        code: `<div style={{ width: 360 }}>
  <Wizard steps={steps} initialValues={initialValues} review={renderReview} onComplete={saveServer} />
</div>`,
      },
      {
        type: "example",
        title: "In a modal",
        previewId: "Wizard/modal",
        code: `<WizardModal
  opened={opened}
  onClose={close}
  title="Add MCP server"
  steps={steps}
  initialValues={initialValues}
  review={renderReview}
  labels={{ finish: "Add server" }}
  onComplete={saveServer}
/>`,
      },
      {
        type: "example",
        title: "Editing (non-linear)",
        previewId: "Wizard/non-linear",
        code: `<Wizard
  nonLinear
  steps={steps}
  initialValues={existingServer}
  review={renderReview}
  labels={{ finish: "Save" }}
  onComplete={updateServer}
/>`,
      },
    ],
  },
  {
    name: "ConfirmDialog",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { Button, Code } from "@mantine/core";
import { ConfirmDialog } from "@sinups/ai-kit";

export function Example() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button color="red" variant="light" onClick={() => setOpened(true)}>
        Delete rule
      </Button>
      <ConfirmDialog
        opened={opened}
        onClose={() => setOpened(false)}
        title="Delete rule"
        message={<><Code>Bash(npm run test:*)</Code> will be removed from the project settings.</>}
        labels={{ confirm: "Delete" }}
        danger
        onConfirm={() => deleteRule("allow-test")}
      />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Ask for confirmation before a destructive or irreversible action. `onConfirm` may return a promise: the confirm button shows a loader until it settles, the dialog closes on success and shows the rejection message in an alert on failure, so the user can retry or cancel. Name the affected object in `message`.",
      },
      {
        type: "example",
        title: "Destructive action",
        previewId: "ConfirmDialog/basic",
        code: `<ConfirmDialog
  opened={opened}
  onClose={close}
  title="Delete rule"
  message="Bash(npm run test:*) will be removed from the project settings."
  labels={{ confirm: "Delete" }}
  danger
  onConfirm={deleteRule}
/>`,
      },
      {
        type: "example",
        title: "Rejected action",
        previewId: "ConfirmDialog/rejected",
        code: `<ConfirmDialog
  opened={opened}
  onClose={close}
  title="Delete rule"
  labels={{ confirm: "Delete" }}
  danger
  onConfirm={async () => {
    throw new Error(".agent/settings.json is read-only");
  }}
/>`,
      },
    ],
  },
  {
    name: "SettingsLayout",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { Switch } from "@mantine/core";
import { SettingRow, SettingsLayout, SettingsSection, type SettingsNavItem } from "@sinups/ai-kit";

const sections: SettingsNavItem[] = [
  { id: "general", label: "General" },
  { id: "models", label: "Models", description: "Default model and limits", group: "Agent" },
  { id: "mcp", label: "MCP servers", group: "Integrations" },
];

export function Example() {
  const [activeId, setActiveId] = useState("general");
  return (
    <div style={{ height: 560 }}>
      <SettingsLayout title="Settings" sections={sections} activeId={activeId} onActiveIdChange={setActiveId} withSearch>
        <SettingsSection title="Appearance" description="How the assistant looks">
          <SettingRow
            label="Compact messages"
            description="Reduce spacing between messages"
            control={<Switch aria-label="Compact messages" />}
          />
        </SettingsSection>
      </SettingsLayout>
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Build a settings screen from three pieces. `SettingsLayout` shows grouped `NavLink` navigation beside the content from 720px of its own width and a section picker above the content when narrower; `withSearch` filters sections by label and description. `SettingsSection` is a borderless group with a title, description, actions and dividers between rows, set apart by spacing; `danger` marks destructive settings. `SettingRow` places the control beside the label from 480px of row width and under it when narrower (`layout` forces either). The layout fills the parent height and scrolls navigation and content separately.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "SettingsLayout/wide",
        code: `<SettingsLayout title="Settings" sections={sections} activeId={activeId} onActiveIdChange={setActiveId} withSearch>
  {sectionContent}
</SettingsLayout>`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "SettingsLayout/narrow",
        code: `<div style={{ width: 360, height: 520 }}>
  <SettingsLayout title="Settings" sections={sections} activeId={activeId} onActiveIdChange={setActiveId} withSearch>
    {sectionContent}
  </SettingsLayout>
</div>`,
      },
      {
        type: "example",
        title: "Row layouts",
        previewId: "SettingsLayout/rows",
        code: `import { Switch, TextInput } from "@mantine/core";
import { SettingRow, SettingsSection } from "@sinups/ai-kit";

export function Example() {
  return (
    <SettingsSection title="Row layouts">
      <SettingRow label="Auto" description="Inline from 480px of row width" control={<Switch aria-label="Auto" />} />
      <SettingRow label="Stacked" layout="stacked" control={<TextInput aria-label="Stacked" />} />
    </SettingsSection>
  );
}`,
      },
    ],
  },
  {
    name: "MasterDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { MasterDetail, McpServerList, McpServerDetail, type McpServer } from "@sinups/ai-kit";

export function Example({ servers }: { servers: McpServer[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = servers.find((server) => server.id === selectedId);
  return (
    <div style={{ height: 600 }}>
      <MasterDetail
        list={<McpServerList servers={servers} selectedId={selectedId} onSelect={(server) => setSelectedId(server.id)} />}
        detail={selected ? <McpServerDetail server={selected} /> : null}
        onBack={() => setSelectedId(null)}
        resizable
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show a list and the details of the selected item. From `breakpoint` (720px of the component width) both panes sit side by side, with `resizable` the border can be dragged; below it the detail replaces the list and `onBack` renders a back button. When nothing is selected the wide layout shows `emptyDetail`. The component fills its parent height and each pane scrolls on its own.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "MasterDetail/wide",
        code: `<MasterDetail list={serverList} detail={detail} onBack={clearSelection} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "MasterDetail/narrow",
        code: `<div style={{ width: 360, height: 460 }}>
  <MasterDetail list={serverList} detail={detail} onBack={clearSelection} labels={{ back: "Servers" }} />
</div>`,
      },
      {
        type: "example",
        title: "Resizable",
        previewId: "MasterDetail/resizable",
        code: `<MasterDetail resizable listWidth={280} list={serverList} detail={detail} />`,
      },
    ],
  },
  {
    name: "EntityList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { Button } from "@mantine/core";
import { EntityList, EntityListItem } from "@sinups/ai-kit";

type Server = { id: string; name: string; description: string; tools: number };

export function Example({ servers, loading, error }: { servers: Server[]; loading: boolean; error?: string }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <EntityList<Server>
      items={servers}
      getId={(server) => server.id}
      loading={loading}
      error={error}
      selectedId={selectedId}
      onSelect={(server) => setSelectedId(server.id)}
      search={{ value: query, onChange: setQuery, filter: (server, q) => server.name.includes(q) }}
      empty={{ title: "No servers", action: <Button size="xs">Add server</Button> }}
      renderItem={(server, { selected }) => (
        <EntityListItem
          title={server.name}
          description={server.description}
          meta={\`\${server.tools} tools\`}
          selected={selected}
          actions={[{ label: "Remove", color: "red", onClick: () => removeServer(server.id) }]}
        />
      )}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render any collection of entities (servers, agents, skills, sessions) with the four data states: `loading` skeleton rows, `error` alert with retry, `empty` state with a call to action, and data. Add `search`, a `filters` control (segmented when wide and at most four options, a select otherwise), `groupBy` headers and a `toolbar`. The list is a keyboard-navigable listbox: arrows, Home/End and Enter. `EntityListItem` is the matching row with icon, status, badges, meta and an actions menu that does not select the row. Badges never truncate: the title does, and in rows narrower than 320px the badges move under the title.",
      },
      {
        type: "example",
        title: "Search and actions",
        previewId: "EntityList/basic",
        code: `<EntityList<Server>
  items={servers}
  getId={(server) => server.id}
  isItemDisabled={(server) => !!server.disabled}
  selectedId={selectedId}
  onSelect={(server) => setSelectedId(server.id)}
  search={{ value: query, onChange: setQuery, placeholder: "Search servers", filter: byName }}
  toolbar={addButton}
  renderItem={renderServer}
/>`,
      },
      {
        type: "example",
        title: "Filters and groups",
        previewId: "EntityList/grouped",
        code: `<EntityList<Server>
  items={servers}
  getId={(server) => server.id}
  groupBy={(server) => server.scope}
  filters={{
    value: transport,
    onChange: setTransport,
    filter: (server, value) => value === "all" || server.transport === value,
    options: [
      { value: "all", label: "All", count: 4 },
      { value: "stdio", label: "stdio", count: 2 },
      { value: "http", label: "HTTP", count: 2 },
    ],
  }}
  renderItem={renderServer}
/>`,
      },
      {
        type: "example",
        title: "Loading, empty and error",
        previewId: "EntityList/states",
        code: `<>
  <EntityList items={[]} loading getId={getId} renderItem={renderServer} />
  <EntityList items={[]} getId={getId} renderItem={renderServer} empty={{ title: "No servers", action: addButton }} />
  <EntityList items={[]} getId={getId} renderItem={renderServer} error="Could not read ~/.agent/config.json" onRetry={reload} />
</>`,
      },
    ],
  },
  {
    name: "CommandPalette",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { CommandPalette, type PaletteCommand } from "@sinups/ai-kit";

const commands: PaletteCommand[] = [
  { id: "new-chat", label: "New chat", group: "Chat", shortcut: "mod+N", onSelect: startChat },
  { id: "mcp", label: "Manage MCP servers", group: "Settings", keywords: ["tools"], onSelect: openMcp },
];

export function Example() {
  const [opened, setOpened] = useState(false);
  return (
    <CommandPalette
      opened={opened}
      onOpen={() => setOpened(true)}
      onClose={() => setOpened(false)}
      hotkey="mod+K"
      commands={commands}
      recentIds={["mcp"]}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Give power users one place to run commands. The palette fuzzy-matches label, keywords and description, highlights matched characters, groups commands, shows `recentIds` first while the query is empty, and renders shortcuts with `ShortcutHint`. `hotkey` together with `onOpen` registers the global shortcut. Each command runs its own `onSelect`, and the palette's `onSelect` sees every choice, for example to update the recent list. `useFuzzySearch` is available for custom lists.",
      },
      {
        type: "example",
        title: "Basic",
        previewId: "CommandPalette/basic",
        code: `<CommandPalette opened={opened} onOpen={open} onClose={close} hotkey="mod+K" commands={commands} />`,
      },
      {
        type: "example",
        title: "Recent commands",
        previewId: "CommandPalette/recent",
        code: `<CommandPalette
  opened={opened}
  onClose={close}
  commands={commands}
  recentIds={recentIds}
  onSelect={(command) => setRecentIds((ids) => [command.id, ...ids.filter((id) => id !== command.id)].slice(0, 3))}
/>`,
      },
    ],
  },
  {
    name: "StatusBadge",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { StatusBadge } from "@sinups/ai-kit";

export function Example() {
  return (
    <>
      <StatusBadge status="success" label="Connected" />
      <StatusBadge status="running" variant="dot" label="Connecting" />
      <StatusBadge status="needs-auth" />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show the state of a server, agent, task or tool with one shared vocabulary: `idle`, `pending`, `running`, `success`, `warning`, `error`, `disabled` and `needs-auth`. Each status has a color, an icon and a default label; `pending` and `running` show a loader. Map your domain status to it (for example `getMcpAgentUiStatus`) and override the text with `label`. `variant=\"dot\"` fits dense rows.",
      },
      {
        type: "example",
        title: "All statuses",
        previewId: "StatusBadge/all",
        code: `import { AGENT_UI_STATUSES, StatusBadge } from "@sinups/ai-kit";

export function Example() {
  return (
    <>
      {AGENT_UI_STATUSES.map((status) => <StatusBadge key={status} status={status} />)}
      {AGENT_UI_STATUSES.map((status) => <StatusBadge key={status} status={status} variant="dot" />)}
    </>
  );
}`,
      },
      {
        type: "example",
        title: "In rows",
        previewId: "StatusBadge/rows",
        code: `<StatusBadge status="error" label="Failed to start" variant="dot" />`,
      },
    ],
  },
  {
    name: "ShortcutHint",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { ShortcutHint } from "@sinups/ai-kit";

export function Example() {
  return <ShortcutHint keys="mod+K" label="Search" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Render a keyboard shortcut with Mantine `Kbd`. `mod` resolves to ⌘ on macOS and Ctrl elsewhere; the platform is detected in the browser and can be forced with `platform`. Accepts `mod+shift+P` strings or key arrays, and an optional label.",
      },
      {
        type: "example",
        title: "Platforms and sizes",
        previewId: "ShortcutHint/basic",
        code: `<>
  <ShortcutHint keys="mod+K" label="Search" />
  <ShortcutHint keys="mod+shift+P" platform="mac" label="macOS" />
  <ShortcutHint keys="mod+shift+P" platform="other" label="Windows / Linux" />
  <ShortcutHint keys={["mod", "enter"]} size="xs" />
</>`,
      },
      {
        type: "example",
        title: "Shortcut list",
        previewId: "ShortcutHint/list",
        code: `<ShortcutHint keys="shift+enter" />`,
      },
    ],
  },
  {
    name: "KeyValueEditor",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { KeyValueEditor, headerKeyValidator, type KeyValuePair } from "@sinups/ai-kit";

export function Example() {
  const [env, setEnv] = useState<KeyValuePair[]>([
    { id: "1", key: "DATABASE_URL", value: "postgres://localhost:5432/app" },
    { id: "2", key: "API_KEY", value: "sk-live-123", secret: true },
  ]);
  const [headers, setHeaders] = useState<KeyValuePair[]>([]);
  return (
    <>
      <KeyValueEditor value={env} onChange={setEnv} addLabel="Add variable" allowSecrets />
      <KeyValueEditor value={headers} onChange={setHeaders} keyPlaceholder="Header" validateKey={headerKeyValidator} allowSecrets />
    </>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Edit environment variables or HTTP headers. Keys are validated as you type (empty, duplicate and `validateKey`, `envKeyValidator` by default), secret values use a password field, and pasting `.env` text or `Header: value` lines into a key field expands into rows. Key and value stack when the editor is narrower than 440px. `parseKeyValueText` is exported for imports from files.",
      },
      {
        type: "example",
        title: "Environment variables",
        previewId: "KeyValueEditor/env",
        code: `<KeyValueEditor value={env} onChange={setEnv} keyPlaceholder="Name" addLabel="Add variable" allowSecrets />`,
      },
      {
        type: "example",
        title: "Headers",
        previewId: "KeyValueEditor/headers",
        code: `<KeyValueEditor
  value={headers}
  onChange={setHeaders}
  keyPlaceholder="Header"
  addLabel="Add header"
  validateKey={headerKeyValidator}
  allowSecrets
/>`,
      },
    ],
  },
  {
    name: "SchemaView",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SchemaView, type JsonSchema } from "@sinups/ai-kit";

const inputSchema: JsonSchema = {
  type: "object",
  required: ["repo", "title"],
  properties: {
    repo: { type: "string", description: "Repository in owner/name form" },
    title: { type: "string" },
    labels: { type: "array", items: { type: "string" }, default: [] },
    assignee: { type: "object", properties: { login: { type: "string" } } },
  },
};

export function Example() {
  return <SchemaView schema={inputSchema} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show a JSON Schema, such as an MCP tool `inputSchema`, as a parameter reference. From 560px of width it is a table with name, type, description and default; narrower it becomes stacked rows. Required parameters get a badge, enums and `const` unions list allowed values, ranges and formats are shown, and nested objects, arrays of objects and `oneOf`/`anyOf` variants collapse (`defaultExpandedDepth`). `flattenSchema` returns the rows for custom renderers.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "SchemaView/wide",
        code: `<SchemaView schema={createIssueSchema} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "SchemaView/narrow",
        code: `<div style={{ width: 360 }}>
  <SchemaView schema={createIssueSchema} />
</div>`,
      },
    ],
  },
];
