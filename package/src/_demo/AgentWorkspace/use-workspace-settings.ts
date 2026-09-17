import { useState } from 'react';
import { AGENTS } from '../../agents/fixtures';
import type { AgentDefinition } from '../../agents/types';
import { HOOKS_FIXTURE } from '../../hooks-config/fixtures';
import type { HookConfig } from '../../hooks-config/types';
import { MCP_SERVERS } from '../../mcp/fixtures';
import type { McpServer, McpServerDraft } from '../../mcp/types';
import { MODELS } from '../../model-settings/fixtures';
import type { EffortLevelValue, UsagePeriod } from '../../model-settings/types';
import {
  PERMISSION_DENIALS_FIXTURE,
  PERMISSION_RULES_FIXTURE,
  WORKSPACE_DIRECTORIES_FIXTURE,
} from '../../permissions/fixtures';
import { parseRule } from '../../permissions/permission-rule';
import type { PermissionMode, PermissionRule, WorkspaceDirectory } from '../../permissions/types';
import { skills as SKILLS_FIXTURE } from '../../skills/fixtures';
import type { Skill } from '../../skills/types';

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function serverFromDraft(draft: McpServerDraft, previous?: McpServer): McpServer {
  return {
    ...previous,
    id: draft.id ?? draft.name,
    name: draft.name,
    scope: draft.scope,
    transport: draft.transport,
    status: previous?.status ?? 'connecting',
    command: draft.command || undefined,
    args: draft.args,
    url: draft.url || undefined,
    env: draft.env,
    headers: draft.headers,
  };
}

function replaceById<T extends { id: string }>(items: T[], next: T): T[] {
  return items.some((item) => item.id === next.id)
    ? items.map((item) => (item.id === next.id ? next : item))
    : [...items, next];
}

export function useWorkspaceSettings() {
  const [model, setModel] = useState(MODELS[0].id);
  const [effort, setEffort] = useState<EffortLevelValue>('high');
  const [thinking, setThinking] = useState(true);
  const [outputStyle, setOutputStyle] = useState('default');
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>('week');
  const [servers, setServers] = useState<McpServer[]>(MCP_SERVERS);
  const [agents, setAgents] = useState<AgentDefinition[]>(AGENTS);
  const [skills, setSkills] = useState<Skill[]>(SKILLS_FIXTURE);
  const [rules, setRules] = useState<PermissionRule[]>(PERMISSION_RULES_FIXTURE);
  const [directories, setDirectories] = useState<WorkspaceDirectory[]>(
    WORKSPACE_DIRECTORIES_FIXTURE
  );
  const [permissionMode, setPermissionMode] = useState<PermissionMode>('default');
  const [hooks, setHooks] = useState<HookConfig[]>(HOOKS_FIXTURE);

  const setServerPatch = (id: string, patch: Partial<McpServer>) =>
    setServers((current) =>
      current.map((server) => (server.id === id ? { ...server, ...patch } : server))
    );

  const addAllowRule = (text: string) => {
    const parsed = parseRule(text);
    if (!parsed) {
      return;
    }
    setRules((current) =>
      current.some(
        (rule) =>
          rule.behavior === 'allow' &&
          rule.toolName === parsed.toolName &&
          rule.specifier === parsed.specifier
      )
        ? current
        : [
            ...current,
            {
              id: `rule-${Date.now().toString(36)}`,
              behavior: 'allow',
              scope: 'local',
              createdAt: new Date().toISOString(),
              ...parsed,
            },
          ]
    );
  };

  return {
    model: { value: model, onChange: setModel },
    effort: { value: effort, onChange: setEffort, thinking, onThinkingChange: setThinking },
    outputStyle: { value: outputStyle, onChange: setOutputStyle },
    usage: { period: usagePeriod, onPeriodChange: setUsagePeriod },
    mcp: {
      servers,
      onAdd: async (draft: McpServerDraft) => {
        await wait(700);
        setServers((current) => [...current, serverFromDraft(draft)]);
      },
      onUpdate: async (draft: McpServerDraft) => {
        await wait(700);
        setServers((current) =>
          current.map((server) =>
            server.id === draft.id ? serverFromDraft(draft, server) : server
          )
        );
      },
      onReconnect: async (server: McpServer) => {
        setServerPatch(server.id, { status: 'connecting' });
        await wait(1200);
        setServerPatch(server.id, { status: 'connected' });
      },
      onAuthenticate: async (server: McpServer) => {
        await wait(1000);
        setServerPatch(server.id, { status: 'connected' });
      },
      onEnable: async (server: McpServer) => {
        await wait(500);
        setServerPatch(server.id, { status: 'connected' });
      },
      onDisable: async (server: McpServer) => {
        await wait(500);
        setServerPatch(server.id, { status: 'disabled' });
      },
      onRemove: async (server: McpServer) => {
        await wait(500);
        setServers((current) => current.filter((item) => item.id !== server.id));
      },
    },
    agents: { agents, setAgents },
    skills: { skills, setSkills },
    permissions: {
      rules,
      directories,
      mode: permissionMode,
      onModeChange: setPermissionMode,
      denials: PERMISSION_DENIALS_FIXTURE,
      onSaveRule: async (rule: PermissionRule) => {
        await wait(400);
        setRules((current) => replaceById(current, rule));
      },
      onDeleteRule: async (rule: PermissionRule) => {
        await wait(500);
        setRules((current) => current.filter((item) => item.id !== rule.id));
      },
      onMoveRule: async (rule: PermissionRule, scope: PermissionRule['scope']) => {
        await wait(500);
        setRules((current) =>
          current.map((item) => (item.id === rule.id ? { ...item, scope } : item))
        );
      },
      onAddDirectory: async (directory: WorkspaceDirectory) => {
        await wait(400);
        setDirectories((current) => [...current, directory]);
      },
      onRemoveDirectory: async (directory: WorkspaceDirectory) => {
        await wait(400);
        setDirectories((current) => current.filter((item) => item.path !== directory.path));
      },
      addAllowRule,
    },
    hooks: {
      hooks,
      onSave: async (hook: HookConfig) => {
        await wait(400);
        setHooks((current) => replaceById(current, hook));
      },
      onDelete: async (hook: HookConfig) => {
        await wait(500);
        setHooks((current) => current.filter((item) => item.id !== hook.id));
      },
      onToggle: async (hook: HookConfig, enabled: boolean) => {
        await wait(400);
        setHooks((current) =>
          current.map((item) => (item.id === hook.id ? { ...item, enabled } : item))
        );
      },
    },
  };
}

export type WorkspaceSettingsState = ReturnType<typeof useWorkspaceSettings>;
