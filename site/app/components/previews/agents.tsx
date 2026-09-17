"use client";

import React, { useState } from "react";
import { Button, Group, Stack, Text } from "@mantine/core";
import {
  AgentAvatar,
  AgentCreateWizard,
  AgentDetail,
  AgentEditor,
  AgentList,
  AgentsSettingsPanel,
  ToolSelector,
  type AgentDefinition,
  type AgentDraft,
  type AgentToolSelection,
  type ModelOption,
  type ToolCatalogItem,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, noop, wait } from "./frames";

const MODELS: ModelOption[] = [
  { id: "qwen-2.5-coder-32b", name: "Qwen 2.5 Coder", version: "32B" },
  { id: "llama-3.3-70b", name: "Llama 3.3", version: "70B" },
  { id: "mistral-small-24b", name: "Mistral Small", version: "24B" },
];

const SKILLS = ["code-review", "testing", "docs-style", "release-notes"];

const CATALOG: ToolCatalogItem[] = [
  { name: "Read", group: "Built-in", description: "Read a file from the workspace", readOnly: true },
  { name: "Edit", group: "Built-in", description: "Replace an exact string in a file" },
  { name: "Write", group: "Built-in", description: "Create or overwrite a file", destructive: true },
  { name: "Bash", group: "Built-in", description: "Run a shell command in the workspace", destructive: true },
  { name: "Grep", group: "Built-in", description: "Search file contents with a regex", readOnly: true },
  { name: "Glob", group: "Built-in", description: "Find files by a glob pattern", readOnly: true },
  { name: "WebFetch", group: "Built-in", description: "Fetch a URL and read it", readOnly: true },
  {
    name: "mcp__git__get_pull_request",
    title: "Get pull request",
    group: "MCP: git",
    description: "Read a pull request with its diff and review comments",
    readOnly: true,
  },
  {
    name: "mcp__git__create_review_comment",
    title: "Create review comment",
    group: "MCP: git",
    description: "Comment on a line of a pull request",
  },
  {
    name: "mcp__git__merge_pull_request",
    title: "Merge pull request",
    group: "MCP: git",
    description: "Merge a pull request into its base branch",
    destructive: true,
  },
  {
    name: "mcp__issues__list_issues",
    title: "List issues",
    group: "MCP: issues",
    description: "List issues of a team or project",
    readOnly: true,
  },
];

const AGENTS: AgentDefinition[] = [
  {
    id: "agent-code-reviewer",
    name: "code-reviewer",
    displayName: "Code reviewer",
    description:
      "Use after writing or changing code to review the diff for bugs, security issues and missing tests.",
    systemPrompt:
      "You are a senior engineer reviewing a change.\n\n## Process\n1. Read the diff with `git diff`.\n2. Look for **correctness** bugs first, then security.\n3. Report findings ordered by severity.",
    model: "qwen-2.5-coder-32b",
    tools: ["Read", "Grep", "Glob", "Bash", "mcp__git__get_pull_request", "mcp__git__create_review_comment"],
    skills: ["code-review"],
    color: "violet",
    source: "project",
    maxTurns: 30,
    updatedAt: "2026-09-12T10:24:00Z",
  },
  {
    id: "agent-test-runner",
    name: "test-runner",
    displayName: "Test runner",
    description: "Use proactively after code changes to run the affected test suites and fix failures.",
    systemPrompt: "Run the tests related to the change and make them pass. Never skip a failing test.",
    model: "llama-3.3-70b",
    tools: ["Read", "Edit", "Bash", "Grep", "Glob"],
    skills: ["testing"],
    color: "green",
    source: "project",
    maxTurns: 40,
    updatedAt: "2026-09-10T16:02:00Z",
  },
  {
    id: "agent-docs-writer",
    name: "docs-writer",
    displayName: "Docs writer",
    description: "Use when a feature needs user documentation or release notes written in the house style.",
    systemPrompt: "Write documentation for developers. Keep sentences short and show a working example first.",
    model: "inherit",
    tools: ["Read", "Write", "Edit", "Glob", "WebFetch"],
    skills: ["docs-style", "release-notes"],
    color: "blue",
    icon: "📝",
    source: "user",
    updatedAt: "2026-08-28T09:15:00Z",
  },
  {
    id: "agent-researcher",
    name: "researcher",
    displayName: "Researcher",
    description: "Use for open questions that need reading many files or the web, without changing anything.",
    systemPrompt: "Investigate the question and answer with sources. Do not modify files.",
    model: "mistral-small-24b",
    tools: "all",
    disallowedTools: ["Write", "Edit", "Bash", "mcp__git__merge_pull_request"],
    color: "orange",
    source: "plugin",
    readOnly: true,
    maxTurns: 25,
  },
  {
    id: "agent-general-purpose",
    name: "general-purpose",
    displayName: "General purpose",
    description: "General-purpose agent for researching complex questions and executing multi-step tasks.",
    systemPrompt: "You are a general-purpose agent. Complete the task fully and report what you did.",
    model: "inherit",
    tools: "all",
    source: "builtin",
    readOnly: true,
  },
];

async function generateDraft(task: string): Promise<Partial<AgentDraft>> {
  await wait(1000);
  return {
    displayName: "Release helper",
    description: `Use before a release to prepare notes and check the milestone. ${task}`,
    systemPrompt: "Collect merged pull requests since the last tag and draft release notes.",
    tools: ["Read", "mcp__git__get_pull_request", "mcp__issues__list_issues"],
    color: "teal",
  };
}

function SettingsPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const [agents, setAgents] = useState(AGENTS);
  const panel = (
    <AgentsSettingsPanel
      agents={agents}
      catalog={CATALOG}
      models={MODELS}
      skills={SKILLS}
      defaultSelectedId={narrow ? null : "agent-code-reviewer"}
      onCreate={async (draft) => {
        await wait(500);
        const agent: AgentDefinition = {
          ...draft,
          id: `agent-${draft.name}-${Date.now()}`,
          source: "user",
          updatedAt: new Date().toISOString(),
        };
        setAgents((prev) => [...prev, agent]);
        return agent;
      }}
      onUpdate={async (agent, draft) => {
        await wait(500);
        setAgents((prev) =>
          prev.map((item) => (item.id === agent.id ? { ...item, ...draft, updatedAt: new Date().toISOString() } : item)),
        );
      }}
      onDelete={async (agent) => {
        await wait(500);
        setAgents((prev) => prev.filter((item) => item.id !== agent.id));
      }}
      onGenerate={generateDraft}
      onUseInChat={noop}
    />
  );
  return narrow ? <NarrowFrame height={620}>{panel}</NarrowFrame> : <WideFrame height={620}>{panel}</WideFrame>;
}

function AgentListPreview({ states = false }: { states?: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>("agent-code-reviewer");
  if (states) {
    return (
      <div className="grid w-full gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border p-3">
          <AgentList agents={[]} loading />
        </div>
        <div className="rounded-lg border border-border p-3">
          <AgentList agents={[]} error="Could not read .agent/agents" onRetry={noop} />
        </div>
        <div className="rounded-lg border border-border p-3">
          <AgentList agents={[]} onCreate={noop} />
        </div>
      </div>
    );
  }
  return (
    <NarrowFrame className="p-3">
      <AgentList
        agents={AGENTS}
        models={MODELS}
        selectedId={selectedId}
        onSelect={(agent) => setSelectedId(agent.id)}
        onCreate={noop}
        onEdit={noop}
        onDuplicate={noop}
        onDelete={noop}
      />
    </NarrowFrame>
  );
}

function AgentDetailPreview({ readOnly = false }: { readOnly?: boolean }) {
  const agent = readOnly ? AGENTS[3] : AGENTS[0];
  return (
    <WideFrame className="p-4">
      <AgentDetail
        agent={agent}
        catalog={CATALOG}
        models={MODELS}
        onUseInChat={noop}
        onEdit={noop}
        onDuplicate={noop}
        onDelete={noop}
      />
    </WideFrame>
  );
}

function AgentEditorPreview({ create = false, narrow = false }: { create?: boolean; narrow?: boolean }) {
  const [saved, setSaved] = useState<AgentDraft | null>(null);
  const editor = (
    <div className="p-4">
      <AgentEditor
        agent={create ? undefined : AGENTS[1]}
        catalog={CATALOG}
        models={MODELS}
        skills={SKILLS}
        existingNames={AGENTS.map((agent) => agent.name)}
        onSave={async (draft) => {
          await wait(500);
          setSaved(draft);
        }}
        onCancel={() => setSaved(null)}
      />
      <ResultBlock value={saved} />
    </div>
  );
  return narrow ? <NarrowFrame>{editor}</NarrowFrame> : <WideFrame>{editor}</WideFrame>;
}

function AgentCreateWizardPreview({ generate = false }: { generate?: boolean }) {
  const [opened, setOpened] = useState(false);
  const [created, setCreated] = useState<AgentDraft | null>(null);
  return (
    <div className="flex w-full flex-col items-center">
      <Button onClick={() => setOpened(true)}>New agent</Button>
      <ResultBlock value={created} />
      <AgentCreateWizard
        opened={opened}
        onClose={() => setOpened(false)}
        catalog={CATALOG}
        models={MODELS}
        skills={SKILLS}
        existingNames={AGENTS.map((agent) => agent.name)}
        onGenerate={generate ? generateDraft : undefined}
        onCreate={async (draft) => {
          await wait(500);
          setCreated(draft);
        }}
      />
    </div>
  );
}

function ToolSelectorPreview({ narrow = false }: { narrow?: boolean }) {
  const [value, setValue] = useState<AgentToolSelection>(["Read", "Grep", "mcp__git__get_pull_request"]);
  const selector = (
    <div className="p-4">
      <ToolSelector
        catalog={CATALOG}
        value={value}
        onChange={setValue}
        label="Tools"
        description="Give the agent only what the task needs"
        defaultCollapsedGroups={narrow ? ["MCP: issues"] : undefined}
      />
      <ResultBlock value={value} />
    </div>
  );
  return narrow ? <NarrowFrame>{selector}</NarrowFrame> : <WideFrame>{selector}</WideFrame>;
}

function AgentAvatarPreview() {
  return (
    <Stack gap="md" align="center">
      <Group gap="md">
        {AGENTS.map((agent) => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}
      </Group>
      <Group gap="md" align="center">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <AgentAvatar key={size} agent={AGENTS[0]} size={size} />
        ))}
      </Group>
      <Text size="xs" c="dimmed">
        Initials, icon and color come from the agent definition
      </Text>
    </Stack>
  );
}

export function renderAgentsPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "AgentsSettingsPanel":
    case "AgentsSettingsPanel/wide":
      return <SettingsPanelPreview />;
    case "AgentsSettingsPanel/narrow":
      return <SettingsPanelPreview narrow />;
    case "AgentList":
    case "AgentList/basic":
      return <AgentListPreview />;
    case "AgentList/states":
      return <AgentListPreview states />;
    case "AgentDetail":
    case "AgentDetail/basic":
      return <AgentDetailPreview />;
    case "AgentDetail/read-only":
      return <AgentDetailPreview readOnly />;
    case "AgentEditor":
    case "AgentEditor/edit":
      return <AgentEditorPreview />;
    case "AgentEditor/create":
      return <AgentEditorPreview create />;
    case "AgentEditor/narrow":
      return <AgentEditorPreview narrow />;
    case "AgentCreateWizard":
    case "AgentCreateWizard/generate":
      return <AgentCreateWizardPreview generate />;
    case "AgentCreateWizard/manual":
      return <AgentCreateWizardPreview />;
    case "ToolSelector":
    case "ToolSelector/wide":
      return <ToolSelectorPreview />;
    case "ToolSelector/narrow":
      return <ToolSelectorPreview narrow />;
    case "AgentAvatar":
    case "AgentAvatar/basic":
      return <AgentAvatarPreview />;
    default:
      return undefined;
  }
}
