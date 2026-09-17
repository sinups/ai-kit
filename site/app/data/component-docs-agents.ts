import type { ComponentDoc } from "@/app/data/component-docs";

export const AGENTS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "AgentsSettingsPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { AgentsSettingsPanel, type AgentDefinition, type ToolCatalogItem } from "@sinups/ai-kit";

export function AgentsSettings({ agents, catalog }: { agents: AgentDefinition[]; catalog: ToolCatalogItem[] }) {
  return (
    <div style={{ height: 640 }}>
      <AgentsSettingsPanel
        agents={agents}
        catalog={catalog}
        models={[{ id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" }]}
        skills={["code-review", "testing"]}
        onCreate={(draft) => api.createAgent(draft)}
        onUpdate={(agent, draft) => api.updateAgent(agent.id, draft)}
        onDelete={(agent) => api.deleteAgent(agent.id)}
        onGenerate={(task) => api.generateAgentDraft(task)}
        onUseInChat={(agent) => startChat(agent.name)}
      />
    </div>
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Drop in a complete subagent settings screen built on `MasterDetail`: `AgentList` beside `AgentDetail` from 720px of width, one pane with back navigation below. New agents are created in `AgentCreateWizard` (with Generate with AI when `onGenerate` is set); Edit and Duplicate open `AgentEditor` in the detail pane, leaving it with unsaved changes asks for confirmation; Delete is confirmed in a dialog. Resolve `onCreate` with the created agent to select it. The panel fills its parent height.",
      },
      {
        type: "example",
        title: "Full page",
        previewId: "AgentsSettingsPanel/wide",
        code: `<AgentsSettingsPanel
  agents={agents}
  catalog={catalog}
  models={models}
  skills={skills}
  defaultSelectedId="agent-code-reviewer"
  onCreate={createAgent}
  onUpdate={updateAgent}
  onDelete={deleteAgent}
  onGenerate={generateDraft}
  onUseInChat={useInChat}
/>`,
      },
      {
        type: "example",
        title: "Narrow widget",
        previewId: "AgentsSettingsPanel/narrow",
        code: `<div style={{ width: 360, height: 620 }}>
  <AgentsSettingsPanel agents={agents} catalog={catalog} onCreate={createAgent} onUpdate={updateAgent} onDelete={deleteAgent} />
</div>`,
      },
    ],
  },
  {
    name: "AgentList",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentList } from "@sinups/ai-kit";

export function Example() {
  return (
    <AgentList
      agents={agents}
      models={models}
      selectedId={selectedId}
      onSelect={(agent) => setSelectedId(agent.id)}
      onCreate={openWizard}
      onEdit={editAgent}
      onDuplicate={duplicateAgent}
      onDelete={deleteAgent}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "List subagent definitions with avatar, description and model, grouped by source (built-in, user, project, plugin) unless `groupBySource` is false. The list is searchable and filters by source when agents come from more than one (`withSearch` and `withSourceFilter` turn these off), offers a New agent button when `onCreate` is set and an actions menu with Edit, Duplicate and Delete; Edit and Delete are disabled for read-only agents. Handles loading, error and empty states.",
      },
      {
        type: "example",
        title: "Agents",
        previewId: "AgentList/basic",
        code: `<AgentList agents={agents} models={models} selectedId={selectedId} onSelect={select} onCreate={openWizard} onEdit={edit} onDuplicate={duplicate} onDelete={remove} />`,
      },
      {
        type: "example",
        title: "Loading, error and empty",
        previewId: "AgentList/states",
        code: `<>
  <AgentList agents={[]} loading />
  <AgentList agents={[]} error="Could not read .agent/agents" onRetry={reload} />
  <AgentList agents={[]} onCreate={openWizard} />
</>`,
      },
    ],
  },
  {
    name: "AgentDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentDetail } from "@sinups/ai-kit";

export function Example() {
  return (
    <AgentDetail
      agent={agent}
      catalog={catalog}
      models={models}
      onUseInChat={startChat}
      onEdit={editAgent}
      onDuplicate={duplicateAgent}
      onDelete={deleteAgent}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show one subagent: avatar, name, source and when to use it, the configuration (model, max turns, tools with a summary that expands into the list, disallowed tools, skills, last update) and the system prompt rendered as Markdown. Use in chat renders only with `onUseInChat`; Edit and Delete are hidden for read-only agents, which can still be duplicated.",
      },
      {
        type: "example",
        title: "Project agent",
        previewId: "AgentDetail/basic",
        code: `<AgentDetail agent={codeReviewer} catalog={catalog} models={models} onUseInChat={startChat} onEdit={edit} onDuplicate={duplicate} onDelete={remove} />`,
      },
      {
        type: "example",
        title: "Read-only agent",
        previewId: "AgentDetail/read-only",
        code: `<AgentDetail agent={{ ...researcher, readOnly: true }} catalog={catalog} onDuplicate={duplicate} onEdit={edit} onDelete={remove} />`,
      },
    ],
  },
  {
    name: "AgentEditor",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentEditor } from "@sinups/ai-kit";

export function Example() {
  return (
    <AgentEditor
      agent={agent}
      catalog={catalog}
      models={models}
      skills={skills}
      existingNames={otherAgentNames}
      onSave={(draft) => api.updateAgent(agent.id, draft)}
      onCancel={closeEditor}
      onDirtyChange={setDirty}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Edit or create a subagent in one form: identity (display name, name, when to use), instructions (system prompt), tools and disallowed tools with `ToolSelector`, and model and appearance (model, max turns, skills, color). Fields are validated, names must be unique among `existingNames`, and a rejected `onSave` is shown in an alert. Cancel with unsaved changes asks for confirmation; `onDirtyChange` lets the host guard its own navigation. Omit `agent` to create one.",
      },
      {
        type: "example",
        title: "Edit an agent",
        previewId: "AgentEditor/edit",
        code: `<AgentEditor agent={testRunner} catalog={catalog} models={models} skills={skills} existingNames={names} onSave={save} onCancel={close} />`,
      },
      {
        type: "example",
        title: "New agent",
        previewId: "AgentEditor/create",
        code: `<AgentEditor catalog={catalog} models={models} skills={skills} existingNames={names} onSave={create} onCancel={close} />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "AgentEditor/narrow",
        code: `<div style={{ width: 360 }}>
  <AgentEditor agent={testRunner} catalog={catalog} models={models} onSave={save} />
</div>`,
      },
    ],
  },
  {
    name: "AgentCreateWizard",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentCreateWizard } from "@sinups/ai-kit";

export function Example() {
  return (
    <AgentCreateWizard
      opened={opened}
      onClose={close}
      catalog={catalog}
      models={models}
      skills={skills}
      existingNames={agents.map((agent) => agent.name)}
      onGenerate={(task) => api.generateAgentDraft(task)}
      onCreate={(draft) => api.createAgent(draft)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Create a subagent step by step in a modal: Method, Identity, Prompt, Tools and Model, then a review. With `onGenerate` the first step offers Generate with AI, which turns a task description into a draft to adjust on the next steps; otherwise the wizard starts from an empty agent. The review warns when the agent can call destructive tools. A rejected `onCreate` is shown in the wizard, success closes it.",
      },
      {
        type: "example",
        title: "Generate with AI",
        previewId: "AgentCreateWizard/generate",
        code: `<AgentCreateWizard opened={opened} onClose={close} catalog={catalog} models={models} existingNames={names} onGenerate={generateDraft} onCreate={createAgent} />`,
      },
      {
        type: "example",
        title: "Manual configuration",
        previewId: "AgentCreateWizard/manual",
        code: `<AgentCreateWizard opened={opened} onClose={close} catalog={catalog} models={models} skills={skills} onCreate={createAgent} />`,
      },
    ],
  },
  {
    name: "ToolSelector",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { ToolSelector, type AgentToolSelection, type ToolCatalogItem } from "@sinups/ai-kit";

export function Example({ catalog }: { catalog: ToolCatalogItem[] }) {
  const [tools, setTools] = useState<AgentToolSelection>(["Read", "Grep"]);
  return <ToolSelector catalog={catalog} value={tools} onChange={setTools} label="Tools" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Pick the tools an agent may call. Switch between All tools and Selected; in Selected mode tools are searchable, grouped by `group` (built-in, each MCP server) with collapsible headers, and marked read-only or destructive. A counter shows how many tools are selected. Shows an empty state when the catalog is empty.",
      },
      {
        type: "example",
        title: "Wide",
        previewId: "ToolSelector/wide",
        code: `<ToolSelector catalog={catalog} value={tools} onChange={setTools} label="Tools" description="Give the agent only what the task needs" />`,
      },
      {
        type: "example",
        title: "Narrow",
        previewId: "ToolSelector/narrow",
        code: `<div style={{ width: 360 }}>
  <ToolSelector catalog={catalog} value={tools} onChange={setTools} defaultCollapsedGroups={["MCP: issues"]} />
</div>`,
      },
    ],
  },
  {
    name: "AgentAvatar",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { AgentAvatar } from "@sinups/ai-kit";

export function Example() {
  return <AgentAvatar agent={{ name: "docs-writer", displayName: "Docs writer", color: "blue", icon: "📝" }} size="lg" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show an agent in lists, headers and chat. The avatar uses the agent `icon` when set, otherwise initials of `displayName` or `name`, tinted with the agent `color`.",
      },
      {
        type: "example",
        title: "Agents and sizes",
        previewId: "AgentAvatar/basic",
        code: `<>
  <AgentAvatar agent={codeReviewer} />
  <AgentAvatar agent={docsWriter} size="lg" />
</>`,
      },
    ],
  },
];

export const SKILLS_COMPONENT_DOCS: ComponentDoc[] = [
  {
    name: "SkillsSettingsPanel",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { SkillsSettingsPanel, type Skill } from "@sinups/ai-kit";

export function SkillsSettings({ skills }: { skills: Skill[] }) {
  return (
    <SkillsSettingsPanel
      style={{ height: 640 }}
      skills={skills}
      availableTools={["Read", "Write", "Bash", "WebFetch"]}
      onToggle={(skill, enabled) => api.setSkillEnabled(skill.id, enabled)}
      onCreate={(draft) => api.createSkill(draft)}
      onUpdate={(skill, draft) => api.updateSkill(skill.id, draft)}
      onRemove={(skill) => api.removeSkill(skill.id)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Manage agent skills in one screen built on `MasterDetail`: `SkillCatalog` beside `SkillDetail` from 720px of width, one pane with a back button below. New skill, Edit and Duplicate open `SkillEditor`; only user and project skills are editable by default (`isEditable`); removal is confirmed in a dialog. Selection can be controlled with `selectedId`. Give the panel a height.",
      },
      {
        type: "example",
        title: "Full page",
        previewId: "SkillsSettingsPanel/wide",
        code: `<SkillsSettingsPanel skills={skills} availableTools={tools} onToggle={toggle} onCreate={create} onUpdate={update} onRemove={remove} style={{ height: 620 }} />`,
      },
      {
        type: "example",
        title: "Narrow widget",
        previewId: "SkillsSettingsPanel/narrow",
        code: `<div style={{ width: 360, height: 620 }}>
  <SkillsSettingsPanel skills={skills} onToggle={toggle} onCreate={create} style={{ height: "100%" }} />
</div>`,
      },
    ],
  },
  {
    name: "SkillCatalog",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SkillCatalog } from "@sinups/ai-kit";

export function Example() {
  return (
    <SkillCatalog
      skills={skills}
      selectedId={selectedId}
      onSelect={(skill) => setSelectedId(skill.id)}
      onToggle={(skill, enabled) => api.setSkillEnabled(skill.id, enabled)}
      onCreate={openEditor}
      onEdit={editSkill}
      onDuplicate={duplicateSkill}
      onRemove={removeSkill}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Browse skills with search and a source filter. The `list` variant shows rows grouped by source, `grid` shows cards whose column count follows the component width. Every skill has an enable switch that shows a loader until `onToggle` settles, and an actions menu with Edit, Duplicate and Remove when those callbacks are set (`isEditable` limits Edit and Remove). Handles loading, error and empty states.",
      },
      {
        type: "example",
        title: "List",
        previewId: "SkillCatalog/list",
        code: `<SkillCatalog skills={skills} selectedId={selectedId} onSelect={select} onToggle={toggle} onCreate={create} onEdit={edit} onRemove={remove} />`,
      },
      {
        type: "example",
        title: "Grid",
        previewId: "SkillCatalog/grid",
        code: `<SkillCatalog variant="grid" skills={skills} onToggle={toggle} onEdit={edit} />`,
      },
      {
        type: "example",
        title: "Loading, error and empty",
        previewId: "SkillCatalog/states",
        code: `<>
  <SkillCatalog skills={[]} loading />
  <SkillCatalog skills={[]} error="Could not load skills" onRetry={reload} />
  <SkillCatalog skills={[]} onCreate={create} />
</>`,
      },
    ],
  },
  {
    name: "SkillDetail",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SkillDetail } from "@sinups/ai-kit";

export function Example() {
  return (
    <SkillDetail
      skill={skill}
      onEdit={openEditor}
      onToggle={(skill, enabled) => api.setSkillEnabled(skill.id, enabled)}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Show one skill: status, description, source, version, author, path, update date and usage count, the tools it may use without asking, and its Markdown instructions. Edit and Enable/Disable buttons render when their callbacks are set; `actions` adds your own buttons.",
      },
      {
        type: "example",
        title: "Skill",
        previewId: "SkillDetail/basic",
        code: `<SkillDetail skill={pdf} onEdit={edit} onToggle={toggle} />`,
      },
      {
        type: "example",
        title: "Disabled skill",
        previewId: "SkillDetail/disabled",
        code: `<SkillDetail skill={{ ...incidentRunbook, enabled: false }} onToggle={toggle} />`,
      },
    ],
  },
  {
    name: "SkillEditor",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `import { SkillEditor } from "@sinups/ai-kit";

export function Example() {
  return (
    <SkillEditor
      skill={skill}
      availableTools={["Read", "Grep", "Bash"]}
      existingNames={otherSkillNames}
      onSave={(draft) => api.updateSkill(skill.id, draft)}
      onCancel={closeEditor}
    />
  );
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Create or edit a skill: a slug name checked against `existingNames`, description, tags, allowed tools and Markdown instructions with Write and Preview tabs. A rejected `onSave` keeps the form open with the message; leaving with unsaved changes asks for confirmation. Omit `skill` to create one, pass `initialDraft` to start from a duplicate.",
      },
      {
        type: "example",
        title: "Edit a skill",
        previewId: "SkillEditor/edit",
        code: `<SkillEditor skill={codeReview} availableTools={tools} existingNames={names} onSave={save} onCancel={close} />`,
      },
      {
        type: "example",
        title: "New skill",
        previewId: "SkillEditor/create",
        code: `<SkillEditor availableTools={tools} existingNames={names} onSave={create} onCancel={close} />`,
      },
    ],
  },
  {
    name: "SkillPicker",
    blocks: [
      {
        type: "code",
        title: "Code",
        content: `"use client";

import { useState } from "react";
import { SkillPicker, type Skill } from "@sinups/ai-kit";

export function Example({ skills }: { skills: Skill[] }) {
  const [value, setValue] = useState<string[]>([]);
  return <SkillPicker skills={skills} value={value} onChange={setValue} label="Skills" />;
}`,
      },
      {
        type: "usage",
        title: "Usage",
        content:
          "Pick several skills by id in a form, for example the skills loaded for an agent. The combobox searches skill names and tags, shows picked skills as pills and marks disabled skills.",
      },
      {
        type: "example",
        title: "Pick skills",
        previewId: "SkillPicker/basic",
        code: `<SkillPicker skills={skills} value={value} onChange={setValue} label="Skills" description="Loaded for this agent" />`,
      },
    ],
  },
];
