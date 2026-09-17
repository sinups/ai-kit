import type { ComponentDoc } from "@/app/data/component-docs";

export const MCP_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "McpSettingsPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { McpSettingsPanel, type McpServer, type McpServerDraft } from "@sinups/ai-kit";

export function McpSettings({ servers }: { servers: McpServer[] }) {
  return (
    <div style={{ height: 640 }}>
      <McpSettingsPanel
        servers={servers}
        onAdd={(draft: McpServerDraft) => api.addServer(draft)}
        onUpdate={(draft) => api.updateServer(draft.id!, draft)}
        onReconnect={(server) => api.reconnect(server.id)}
        onAuthenticate={(server) => api.startOAuth(server.id)}
        onEnable={(server) => api.setEnabled(server.id, true)}
        onDisable={(server) => api.setEnabled(server.id, false)}
        onRemove={(server) => api.removeServer(server.id)}
        onTryTool={(server, tool) => openToolRunner(server, tool)}
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Drop in a complete MCP settings screen. It combines `McpServerList`, `McpServerDetail`, `McpToolDetail` and the add/edit `McpServerWizardModal` inside `MasterDetail`: list and detail side by side when wide, one pane with back navigation in a narrow widget. Everything is data and callbacks: pass `servers` from your MCP client, return promises from actions to show pending states and errors. Omit a callback to hide its action. Fills the parent height.",
      },
      {
        type: "example",
        title: "Full page",
        previewId: "McpSettingsPanel/wide",
        code: `<McpSettingsPanel
  servers={servers}
  onAdd={addServer}
  onUpdate={updateServer}
  onReconnect={reconnect}
  onAuthenticate={authenticate}
  onEnable={enable}
  onDisable={disable}
  onRemove={remove}
/>`,
      },
      {
        type: "example",
        title: "Narrow widget",
        previewId: "McpSettingsPanel/narrow",
        code: `<div style={{ width: 360, height: 600 }}>
  <McpSettingsPanel servers={servers} onAdd={addServer} onReconnect={reconnect} onRemove={remove} />
</div>`,
      },
    ],
  },
  {
    name: "McpServerList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { McpServerList } from "@sinups/ai-kit";

export function Example() {
  return (
    <McpServerList
      servers={servers}
      selectedId={selectedId}
      onSelect={(server) => setSelectedId(server.id)}
      onAdd={openWizard}
      onReconnect={reconnect}
      onAuthenticate={authenticate}
      onDisable={disable}
      onEnable={enable}
      onRemove={remove}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "List configured MCP servers with their transport, status, command or URL, connection error and tool count. Search matches the name, command and URL; the filter narrows by connected, needs attention, disabled or scope, and `withSearch={false}` or `withFilter={false}` hides either control; servers are grouped by scope when there is more than one. The actions menu offers Authenticate, Reconnect, Enable or Disable depending on the status, and Remove asks for confirmation. Handles loading, error and empty states.",
      },
      {
        type: "example",
        title: "Servers",
        previewId: "McpServerList/basic",
        code: `<McpServerList servers={servers} selectedId={selectedId} onSelect={select} onAdd={openWizard} onReconnect={reconnect} onRemove={remove} />`,
      },
      {
        type: "example",
        title: "Loading, error and empty",
        previewId: "McpServerList/states",
        code: `<>
  <McpServerList servers={[]} loading />
  <McpServerList servers={[]} error="Could not read ~/.agent/config.json" onRetry={reload} />
  <McpServerList servers={[]} onAdd={openWizard} />
</>`,
      },
    ],
  },
  {
    name: "McpServerDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { McpServerDetail } from "@sinups/ai-kit";

export function Example() {
  return (
    <McpServerDetail
      server={server}
      onSelectTool={(tool) => setToolName(tool.name)}
      onReconnect={reconnect}
      onAuthenticate={authenticate}
      onDisable={disable}
      onEnable={enable}
      onEdit={openEditWizard}
      onRemove={remove}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show one MCP server: name, transport, scope, version and status with Authenticate, Reconnect and Enable/Disable buttons that show pending state. A failed connection is shown in an alert. Tabs list tools with behavior annotations (read-only, destructive, idempotent, open world), resources, prompts with their arguments, and the configuration with command, arguments or URL and masked secrets that can be revealed. Edit and Remove live in the configuration tab.",
      },
      {
        type: "example",
        title: "Connected server",
        previewId: "McpServerDetail/basic",
        code: `<McpServerDetail server={git} onSelectTool={openTool} onReconnect={reconnect} onDisable={disable} onEdit={edit} onRemove={remove} />`,
      },
      {
        type: "example",
        title: "Needs authentication",
        previewId: "McpServerDetail/needs-auth",
        code: `<McpServerDetail server={{ ...issues, status: "needs-auth" }} onAuthenticate={authenticate} />`,
      },
      {
        type: "example",
        title: "Connection error",
        previewId: "McpServerDetail/error",
        code: `<McpServerDetail server={{ ...errors, status: "error", error: "Connection closed: 502 Bad Gateway" }} onReconnect={reconnect} />`,
      },
      {
        type: "example",
        title: "Configuration",
        previewId: "McpServerDetail/configuration",
        code: `<McpServerDetail server={postgres} tab={tab} onTabChange={setTab} onEnable={enable} onEdit={edit} onRemove={remove} />`,
      },
    ],
  },
  {
    name: "McpToolDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { McpToolDetail } from "@sinups/ai-kit";

export function Example() {
  return (
    <McpToolDetail
      tool={tool}
      serverName="git"
      onBack={() => setToolName(null)}
      onTry={(tool) => openToolRunner(tool)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Document one MCP tool from `tools/list`: title and name, description, behavior annotations with explanations, and `SchemaView` tables for `inputSchema` and `outputSchema`. Add `onTry` to offer running the tool and `onBack` to return to the server.",
      },
      {
        type: "example",
        title: "With output schema",
        previewId: "McpToolDetail/wide",
        code: `<McpToolDetail tool={searchRepositories} serverName="git" onBack={back} onTry={tryTool} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "McpToolDetail/narrow",
        code: `<div style={{ width: 360 }}>
  <McpToolDetail tool={mergePullRequest} serverName="git" onBack={back} />
</div>`,
      },
    ],
  },
  {
    name: "McpServerWizard",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { McpServerWizardModal } from "@sinups/ai-kit";

export function Example() {
  return (
    <McpServerWizardModal
      opened={opened}
      onClose={close}
      initialServer={editedServer}
      existingNames={servers.map((server) => server.name)}
      onSubmit={(draft) => (draft.id ? api.updateServer(draft.id, draft) : api.addServer(draft))}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Add or edit an MCP server in four steps: Basics (unique name, scope, transport), Connection (command and arguments for stdio, validated URL for HTTP and SSE), Environment or Headers with secrets, and Review. Pasting a full command line splits it into command and arguments. `onSubmit` receives a normalized `McpServerDraft`; a rejected promise is shown in the wizard. With `initialServer` the wizard edits: every step can be opened directly and Save validates them all. Use `McpServerWizard` inline or `McpServerWizardModal`, which closes after a successful submit.",
      },
      {
        type: "example",
        title: "Add a server",
        previewId: "McpServerWizard/add",
        code: `<McpServerWizard existingNames={names} onSubmit={addServer} onCancel={close} />`,
      },
      {
        type: "example",
        title: "Edit a server",
        previewId: "McpServerWizard/edit",
        code: `<McpServerWizard initialServer={git} existingNames={names} onSubmit={updateServer} />`,
      },
      {
        type: "example",
        title: "Modal",
        previewId: "McpServerWizard/modal",
        code: `<McpServerWizardModal opened={opened} onClose={close} defaultTransport="http" existingNames={names} onSubmit={addServer} />`,
      },
    ],
  },
];

export const PERMISSIONS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "PermissionRulesPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { PermissionRulesPanel } from "@sinups/ai-kit";

export function Example() {
  return (
    <PermissionRulesPanel
      rules={rules}
      denials={recentDenials}
      directories={directories}
      knownTools={toolNames}
      onSaveRule={(rule, mode) => (mode === "edit" ? api.updateRule(rule) : api.addRule(rule))}
      onDeleteRule={(rule) => api.deleteRule(rule.id)}
      onMoveRule={(rule, scope) => api.moveRule(rule.id, scope)}
      onAddDirectory={(directory) => api.addDirectory(directory)}
      onRemoveDirectory={(directory) => api.removeDirectory(directory.path)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Manage tool permission rules like `Bash(npm run test:*)`. Tabs split rules into Allow, Ask and Deny, show recently denied tool calls (Allow this opens the rule wizard prefilled from the denial) and additional working directories. Rules show their scope (session, local, project, user or read-only policy) and can be added or edited in `AddPermissionRuleWizard`, moved between scopes and deleted. Omit a callback to hide its action.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "PermissionRulesPanel/wide",
        code: `<PermissionRulesPanel rules={rules} denials={denials} directories={directories} knownTools={tools} onSaveRule={saveRule} onDeleteRule={deleteRule} onMoveRule={moveRule} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "PermissionRulesPanel/narrow",
        code: `<div style={{ width: 360 }}>
  <PermissionRulesPanel rules={rules} denials={denials} knownTools={tools} onSaveRule={saveRule} onDeleteRule={deleteRule} />
</div>`,
      },
    ],
  },
  {
    name: "AddPermissionRuleWizard",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AddPermissionRuleWizard } from "@sinups/ai-kit";

export function Example() {
  return (
    <AddPermissionRuleWizard
      opened={opened}
      onClose={close}
      knownTools={toolNames}
      initialRule={{ behavior: "allow", toolName: "Bash", specifier: "npm run build:*" }}
      onSubmit={(rule) => api.addRule(rule)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Create or edit one permission rule in a modal: behavior, the rule itself with tool suggestions and examples, and the scope it is stored in. Prefill `initialRule` from a denied tool call to turn it into an allow rule in two clicks; pass a rule with `id` to edit it. A rejected `onSubmit` keeps the wizard open and shows the error.",
      },
      {
        type: "example",
        title: "New rule",
        previewId: "AddPermissionRuleWizard/add",
        code: `<AddPermissionRuleWizard opened={opened} onClose={close} knownTools={tools} onSubmit={addRule} />`,
      },
      {
        type: "example",
        title: "From a denial",
        previewId: "AddPermissionRuleWizard/from-denial",
        code: `<AddPermissionRuleWizard
  opened={opened}
  onClose={close}
  knownTools={tools}
  initialRule={{ behavior: "allow", toolName: "Bash", specifier: "npm run build:*" }}
  onSubmit={addRule}
/>`,
      },
    ],
  },
  {
    name: "PermissionRuleInput",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { PermissionRuleInput } from "@sinups/ai-kit";

export function Example() {
  const [rule, setRule] = useState("Bash(npm run test:*)");
  return <PermissionRuleInput value={rule} onChange={setRule} knownTools={["Bash", "Read", "WebFetch"]} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Type a permission rule in the `Tool(specifier)` syntax. The field suggests known tool names, validates the syntax on blur (or immediately with `forceValidation`), warns about unknown tools and explains the rule in plain words under the field, for the given `behavior`.",
      },
      {
        type: "example",
        title: "States",
        previewId: "PermissionRuleInput/states",
        code: `<>
  <PermissionRuleInput label="Allow rule" value="Bash(npm run test:*)" onChange={setRule} knownTools={tools} />
  <PermissionRuleInput label="Deny rule" behavior="deny" value="Read(.env*)" onChange={setRule} knownTools={tools} />
  <PermissionRuleInput label="Invalid" value="Bash(npm run" onChange={setRule} forceValidation />
</>`,
      },
    ],
  },
  {
    name: "PermissionModeSelector",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { PermissionModeSelector, type PermissionMode } from "@sinups/ai-kit";

export function Example() {
  const [mode, setMode] = useState<PermissionMode>("default");
  return <PermissionModeSelector value={mode} onChange={setMode} />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Switch the agent permission mode: Default, Accept edits, Plan or Bypass. Each mode shows its description, and dangerous modes show a warning. `variant=\"auto\"` renders a segmented control when there is room and a select in narrow containers.",
      },
      {
        type: "example",
        title: "Segmented",
        previewId: "PermissionModeSelector/segmented",
        code: `<PermissionModeSelector value={mode} onChange={setMode} variant="segmented" />`,
      },
      {
        type: "example",
        title: "Select",
        previewId: "PermissionModeSelector/select",
        code: `<PermissionModeSelector value={mode} onChange={setMode} variant="select" />`,
      },
    ],
  },
];

export const HOOKS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "HooksPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { HooksPanel } from "@sinups/ai-kit";

export function Example() {
  return (
    <HooksPanel
      hooks={hooks}
      knownTools={toolNames}
      onSave={(hook, mode) => (mode === "edit" ? api.updateHook(hook) : api.addHook(hook))}
      onDelete={(hook) => api.deleteHook(hook.id)}
      onToggle={(hook, enabled) => api.setHookEnabled(hook.id, enabled)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Configure lifecycle hooks such as PreToolUse, PostToolUse, SessionStart or Stop. Hooks are grouped by event with a description of when it runs; each hook shows its matcher, command or prompt, timeout and scope, and can be toggled, edited in `HookWizard` or deleted. Handles loading, error and empty states.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "HooksPanel/wide",
        code: `<HooksPanel hooks={hooks} knownTools={tools} onSave={saveHook} onDelete={deleteHook} onToggle={toggleHook} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "HooksPanel/narrow",
        code: `<div style={{ width: 360 }}>
  <HooksPanel hooks={hooks} onSave={saveHook} onToggle={toggleHook} />
</div>`,
      },
    ],
  },
  {
    name: "HookWizard",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { HookWizard } from "@sinups/ai-kit";

export function Example() {
  return (
    <HookWizard
      opened={opened}
      onClose={close}
      knownTools={toolNames}
      initialHook={editedHook}
      onSubmit={(hook) => api.saveHook(hook)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Create or edit a hook in a modal: pick the event, a tool matcher for tool events, a shell command or an LLM prompt with a timeout, and the scope. The wizard shows the JSON payload the hook receives for the chosen event. A rejected `onSubmit` keeps the wizard open with the error.",
      },
      {
        type: "example",
        title: "New hook",
        previewId: "HookWizard/add",
        code: `<HookWizard opened={opened} onClose={close} knownTools={tools} onSubmit={addHook} />`,
      },
      {
        type: "example",
        title: "Edit a hook",
        previewId: "HookWizard/edit",
        code: `<HookWizard opened={opened} onClose={close} knownTools={tools} initialHook={formatOnWrite} onSubmit={updateHook} />`,
      },
    ],
  },
];
