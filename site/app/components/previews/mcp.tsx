"use client";

import React, { useState } from "react";
import { Button } from "@mantine/core";
import {
  McpServerDetail,
  McpServerList,
  McpServerWizard,
  McpServerWizardModal,
  McpSettingsPanel,
  McpToolDetail,
  type McpServer,
  type McpServerDetailTab,
  type McpServerDraft,
  type McpServerStatus,
} from "@sinups/ai-kit";
import { NarrowFrame, ResultBlock, WideFrame, wait } from "./frames";

export const GIT_SERVER: McpServer = {
  id: "git",
  name: "git",
  transport: "http",
  status: "connected",
  scope: "user",
  url: "https://git.example.com/mcp/",
  headers: [
    { id: "git-auth", key: "Authorization", value: "Bearer git_example_token", secret: true },
    { id: "git-toolsets", key: "X-MCP-Toolsets", value: "repos,issues,pull_requests" },
  ],
  version: "0.13.0",
  instructions: "Use issue and pull request tools for repository work.",
  capabilities: { tools: true, resources: true, prompts: true },
  tools: [
    {
      name: "search_repositories",
      title: "Search repositories",
      description: "Find repositories by name, topic or owner using the search syntax of the git host.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "Search query, for example `topic:mcp`" },
          page: { type: "integer", minimum: 1, default: 1 },
          perPage: { type: "integer", minimum: 1, maximum: 100, default: 30 },
        },
      },
      outputSchema: {
        type: "object",
        properties: {
          totalCount: { type: "integer" },
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { fullName: { type: "string" }, stars: { type: "integer" } },
            },
          },
        },
      },
    },
    {
      name: "create_issue",
      title: "Create issue",
      description: "Open a new issue in a repository.",
      annotations: { openWorldHint: true },
      inputSchema: {
        type: "object",
        required: ["owner", "repo", "title"],
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          title: { type: "string" },
          body: { type: "string", description: "Markdown body" },
          labels: { type: "array", items: { type: "string" } },
        },
      },
    },
    {
      name: "merge_pull_request",
      title: "Merge pull request",
      description: "Merge a pull request into its base branch.",
      annotations: { destructiveHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        required: ["owner", "repo", "pullNumber"],
        properties: {
          owner: { type: "string" },
          repo: { type: "string" },
          pullNumber: { type: "integer", minimum: 1 },
          mergeMethod: { type: "string", enum: ["merge", "squash", "rebase"], default: "merge" },
        },
      },
    },
  ],
  resources: [
    { uri: "repo://sinups/ai-kit/contents/README.md", name: "README.md", mimeType: "text/markdown" },
  ],
  prompts: [
    {
      name: "review_pull_request",
      description: "Review a pull request and summarize risks",
      arguments: [
        { name: "owner", required: true },
        { name: "repo", required: true },
        { name: "pullNumber", required: true },
        { name: "focus", description: "Area to pay attention to" },
      ],
    },
  ],
};

export const MCP_SERVERS: McpServer[] = [
  GIT_SERVER,
  {
    id: "filesystem",
    name: "filesystem",
    transport: "stdio",
    status: "connected",
    scope: "project",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects/app"],
    toolCount: 14,
  },
  {
    id: "postgres",
    name: "postgres",
    transport: "stdio",
    status: "disabled",
    scope: "local",
    command: "uvx",
    args: ["postgres-mcp", "--access-mode=restricted"],
    env: [{ id: "pg-uri", key: "DATABASE_URI", value: "postgresql://app:secret@localhost/app", secret: true }],
    toolCount: 8,
  },
  {
    id: "issues",
    name: "issues",
    transport: "http",
    status: "needs-auth",
    scope: "user",
    url: "https://issues.example.com/mcp",
  },
  {
    id: "errors",
    name: "errors",
    transport: "sse",
    status: "error",
    scope: "project",
    url: "https://errors.example.com/sse",
    error: "Connection closed: 502 Bad Gateway",
    toolCount: 16,
  },
];

function fromDraft(draft: McpServerDraft, previous?: McpServer): McpServer {
  return {
    ...previous,
    id: draft.id ?? draft.name,
    name: draft.name,
    scope: draft.scope,
    transport: draft.transport,
    status: previous?.status ?? "connected",
    command: draft.command || undefined,
    args: draft.args,
    url: draft.url || undefined,
    env: draft.env,
    headers: draft.headers,
  };
}

function useServers() {
  const [servers, setServers] = useState(MCP_SERVERS);
  const setStatus = (id: string, status: McpServerStatus) =>
    setServers((prev) => prev.map((server) => (server.id === id ? { ...server, status } : server)));

  return {
    servers,
    onAdd: async (draft: McpServerDraft) => {
      await wait(600);
      setServers((prev) => [...prev, fromDraft(draft)]);
    },
    onUpdate: async (draft: McpServerDraft) => {
      await wait(600);
      setServers((prev) => prev.map((server) => (server.id === draft.id ? fromDraft(draft, server) : server)));
    },
    onReconnect: async (server: McpServer) => {
      setStatus(server.id, "connecting");
      await wait(1000);
      setStatus(server.id, server.id === "errors" ? "error" : "connected");
      if (server.id === "errors") throw new Error("Still unreachable: 502 Bad Gateway");
    },
    onAuthenticate: async (server: McpServer) => {
      await wait(800);
      setStatus(server.id, "connected");
    },
    onEnable: async (server: McpServer) => {
      await wait(400);
      setStatus(server.id, "connected");
    },
    onDisable: async (server: McpServer) => {
      await wait(400);
      setStatus(server.id, "disabled");
    },
    onRemove: async (server: McpServer) => {
      await wait(400);
      setServers((prev) => prev.filter((item) => item.id !== server.id));
    },
  };
}

function SettingsPanelPreview({ narrow = false }: { narrow?: boolean }) {
  const handlers = useServers();
  const panel = <McpSettingsPanel {...handlers} onTryTool={() => {}} />;
  return narrow ? <NarrowFrame height={600}>{panel}</NarrowFrame> : <WideFrame height={600}>{panel}</WideFrame>;
}

function ServerListPreview() {
  const handlers = useServers();
  const [selectedId, setSelectedId] = useState<string | null>("git");
  return (
    <NarrowFrame className="p-3">
      <McpServerList
        {...handlers}
        selectedId={selectedId}
        onSelect={(server) => setSelectedId(server.id)}
        onAdd={() => {}}
      />
    </NarrowFrame>
  );
}

function ServerListStatesPreview() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <div className="rounded-lg border border-border p-3">
        <McpServerList servers={[]} loading />
      </div>
      <div className="rounded-lg border border-border p-3">
        <McpServerList servers={[]} error="Could not read ~/.agent/config.json" onRetry={() => {}} />
      </div>
      <div className="rounded-lg border border-border p-3">
        <McpServerList servers={[]} onAdd={() => {}} />
      </div>
    </div>
  );
}

function ServerDetailPreview({ server, initialTab = "tools" }: { server: McpServer; initialTab?: McpServerDetailTab }) {
  const handlers = useServers();
  const [tab, setTab] = useState<McpServerDetailTab>(initialTab);
  const current = handlers.servers.find((item) => item.id === server.id) ?? server;
  return (
    <WideFrame className="p-4">
      <McpServerDetail
        server={current}
        tab={tab}
        onTabChange={setTab}
        onReconnect={handlers.onReconnect}
        onAuthenticate={handlers.onAuthenticate}
        onEnable={handlers.onEnable}
        onDisable={handlers.onDisable}
        onRemove={handlers.onRemove}
        onEdit={() => {}}
        onSelectTool={() => {}}
      />
    </WideFrame>
  );
}

function ToolDetailPreview({ narrow = false }: { narrow?: boolean }) {
  const tool = GIT_SERVER.tools![narrow ? 2 : 0];
  const detail = (
    <div className="p-4">
      <McpToolDetail tool={tool} serverName="git" onBack={() => {}} onTry={() => {}} />
    </div>
  );
  return narrow ? <NarrowFrame>{detail}</NarrowFrame> : <WideFrame>{detail}</WideFrame>;
}

function WizardPreview({ edit = false }: { edit?: boolean }) {
  const [result, setResult] = useState<McpServerDraft | null>(null);
  return (
    <WideFrame className="p-4">
      <McpServerWizard
        initialServer={edit ? GIT_SERVER : undefined}
        existingNames={MCP_SERVERS.map((server) => server.name)}
        onSubmit={async (draft) => {
          await wait(600);
          setResult(draft);
        }}
        onCancel={() => setResult(null)}
      />
      <ResultBlock value={result} />
    </WideFrame>
  );
}

function WizardModalPreview() {
  const [opened, setOpened] = useState(false);
  return (
    <div className="flex w-full justify-center">
      <Button onClick={() => setOpened(true)}>Add server</Button>
      <McpServerWizardModal
        opened={opened}
        onClose={() => setOpened(false)}
        defaultTransport="http"
        existingNames={MCP_SERVERS.map((server) => server.name)}
        onSubmit={() => wait(800)}
      />
    </div>
  );
}

export function renderMcpPreview(previewId: string): React.ReactNode | undefined {
  switch (previewId) {
    case "McpSettingsPanel":
    case "McpSettingsPanel/wide":
      return <SettingsPanelPreview />;
    case "McpSettingsPanel/narrow":
      return <SettingsPanelPreview narrow />;
    case "McpServerList":
    case "McpServerList/basic":
      return <ServerListPreview />;
    case "McpServerList/states":
      return <ServerListStatesPreview />;
    case "McpServerDetail":
    case "McpServerDetail/basic":
      return <ServerDetailPreview server={GIT_SERVER} />;
    case "McpServerDetail/needs-auth":
      return <ServerDetailPreview server={MCP_SERVERS[3]} />;
    case "McpServerDetail/error":
      return <ServerDetailPreview server={MCP_SERVERS[4]} />;
    case "McpServerDetail/configuration":
      return <ServerDetailPreview server={MCP_SERVERS[2]} initialTab="configuration" />;
    case "McpToolDetail":
    case "McpToolDetail/wide":
      return <ToolDetailPreview />;
    case "McpToolDetail/narrow":
      return <ToolDetailPreview narrow />;
    case "McpServerWizard":
    case "McpServerWizard/add":
      return <WizardPreview />;
    case "McpServerWizard/edit":
      return <WizardPreview edit />;
    case "McpServerWizard/modal":
      return <WizardModalPreview />;
    default:
      return undefined;
  }
}
