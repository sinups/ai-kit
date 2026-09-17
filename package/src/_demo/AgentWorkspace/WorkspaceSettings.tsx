import React from 'react';
import { Stack } from '@mantine/core';
import {
  IconAdjustments,
  IconChartBar,
  IconHelp,
  IconPalette,
  IconPlug,
  IconRobot,
  IconShieldLock,
  IconSparkles,
  IconWebhook,
} from '@tabler/icons-react';
import { AGENT_MODELS, AGENT_SKILLS, TOOL_CATALOG } from '../../agents/fixtures';
import { AgentsSettingsPanel } from '../../agents/AgentsSettingsPanel/AgentsSettingsPanel';
import { CommandsHelp } from '../../help/CommandsHelp/CommandsHelp';
import { HELP_COMMANDS, HELP_SHORTCUTS } from '../../help/fixtures';
import { HOOK_TOOLS } from '../../hooks-config/fixtures';
import { HooksPanel } from '../../hooks-config/HooksPanel';
import { McpSettingsPanel } from '../../mcp/McpSettingsPanel';
import {
  DAILY_USAGE,
  LIMITS,
  MCP_SERVERS as STATUS_MCP_SERVERS,
  MODEL_USAGE,
  MODELS,
  OUTPUT_STYLES,
} from '../../model-settings/fixtures';
import { ModelSettingsPanel } from '../../model-settings/ModelSettingsPanel/ModelSettingsPanel';
import { UsagePanel } from '../../model-settings/UsagePanel/UsagePanel';
import { PERMISSION_TOOLS_FIXTURE } from '../../permissions/fixtures';
import { PermissionModeSelector } from '../../permissions/PermissionModeSelector';
import { PermissionRulesPanel } from '../../permissions/PermissionRulesPanel';
import { SettingsModal } from '../../primitives/SettingsLayout/SettingsModal';
import type { SettingsNavItem } from '../../primitives/SettingsLayout/settings-nav';
import { AVAILABLE_TOOLS } from '../../skills/fixtures';
import { SkillsSettingsPanel } from '../../skills/SkillsSettingsPanel';
import { AiKitThemeCustomizer } from '../../theme/AiKitThemeCustomizer';
import type { Skill } from '../../skills/types';
import { wait, type WorkspaceSettingsState } from './use-workspace-settings';

export type WorkspaceSettingsSection =
  | 'general'
  | 'mcp'
  | 'agents'
  | 'skills'
  | 'permissions'
  | 'hooks'
  | 'usage'
  | 'appearance'
  | 'help';

export const WORKSPACE_SETTINGS_SECTIONS: (SettingsNavItem & { id: WorkspaceSettingsSection })[] = [
  {
    id: 'general',
    fill: true,
    label: 'General',
    description: 'Model, effort and output style',
    icon: <IconAdjustments size={16} />,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Accent, radius, density and mode',
    icon: <IconPalette size={16} />,
  },
  {
    id: 'mcp',
    fill: true,
    label: 'MCP servers',
    description: 'Connected tools and data',
    icon: <IconPlug size={16} />,
    group: 'Tools',
  },
  {
    id: 'agents',
    fill: true,
    label: 'Agents',
    description: 'Subagents and their tools',
    icon: <IconRobot size={16} />,
    group: 'Tools',
  },
  {
    id: 'skills',
    fill: true,
    label: 'Skills',
    description: 'Reusable instructions',
    icon: <IconSparkles size={16} />,
    group: 'Tools',
  },
  {
    id: 'permissions',
    label: 'Permissions',
    description: 'Allow, ask and deny rules',
    icon: <IconShieldLock size={16} />,
    group: 'Safety',
  },
  {
    id: 'hooks',
    label: 'Hooks',
    description: 'Commands on agent events',
    icon: <IconWebhook size={16} />,
    group: 'Safety',
  },
  {
    id: 'usage',
    label: 'Usage',
    description: 'Tokens, cost and limits',
    icon: <IconChartBar size={16} />,
    group: 'Account',
  },
  {
    id: 'help',
    label: 'Help',
    description: 'Commands and shortcuts',
    icon: <IconHelp size={16} />,
    group: 'Account',
  },
];

export interface WorkspaceSettingsProps {
  opened: boolean;
  onClose: () => void;
  section: WorkspaceSettingsSection;
  onSectionChange: (section: WorkspaceSettingsSection) => void;
  settings: WorkspaceSettingsState;
  onCommandSelect?: (command: string) => void;
}

export function WorkspaceSettings({
  opened,
  onClose,
  section,
  onSectionChange,
  settings,
  onCommandSelect,
}: WorkspaceSettingsProps) {
  const usage = {
    period: settings.usage.period,
    onPeriodChange: settings.usage.onPeriodChange,
    summary: { tokens: 6_200_000, cost: 67.54, requests: 1_284 },
    limits: LIMITS,
    models: MODEL_USAGE,
    daily: DAILY_USAGE,
  };

  let content: React.ReactNode;
  switch (section) {
    case 'general':
      content = (
        <ModelSettingsPanel
          models={MODELS}
          model={settings.model.value}
          onModelChange={settings.model.onChange}
          effort={settings.effort}
          outputStyle={{ styles: OUTPUT_STYLES, ...settings.outputStyle }}
          usage={{ ...usage, withoutTitle: true }}
          status={{
            withoutTitle: true,
            version: '2.1.4',
            model: MODELS.find((item) => item.id === settings.model.value)?.name,
            account: { email: 'dev@example.com', plan: 'Team' },
            cwd: '/Users/dev/projects/acme-web',
            mcpServers: STATUS_MCP_SERVERS,
            context: { used: 142_000, total: 200_000 },
          }}
        />
      );
      break;
    case 'appearance':
      content = <AiKitThemeCustomizer />;
      break;
    case 'mcp':
      content = <McpSettingsPanel {...settings.mcp} onTryTool={() => {}} />;
      break;
    case 'agents':
      content = (
        <AgentsSettingsPanel
          agents={settings.agents.agents}
          catalog={TOOL_CATALOG}
          models={AGENT_MODELS}
          skills={AGENT_SKILLS}
          onCreate={async (draft) => {
            await wait(600);
            const agent = {
              ...draft,
              id: `agent-${draft.name}`,
              source: 'user' as const,
              updatedAt: new Date().toISOString(),
            };
            settings.agents.setAgents((current) => [...current, agent]);
            return agent;
          }}
          onUpdate={async (agent, draft) => {
            await wait(600);
            settings.agents.setAgents((current) =>
              current.map((item) => (item.id === agent.id ? { ...item, ...draft } : item))
            );
          }}
          onDelete={async (agent) => {
            await wait(600);
            settings.agents.setAgents((current) => current.filter((item) => item.id !== agent.id));
          }}
        />
      );
      break;
    case 'skills':
      content = (
        <SkillsSettingsPanel
          skills={settings.skills.skills}
          availableTools={AVAILABLE_TOOLS}
          onToggle={async (skill, enabled) => {
            await wait(400);
            settings.skills.setSkills((current) =>
              current.map((item) => (item.id === skill.id ? { ...item, enabled } : item))
            );
          }}
          onCreate={async (draft) => {
            await wait(600);
            const created: Skill = { ...draft, id: draft.name, source: 'user', enabled: true };
            settings.skills.setSkills((current) => [...current, created]);
            return created;
          }}
          onUpdate={async (skill, draft) => {
            await wait(600);
            settings.skills.setSkills((current) =>
              current.map((item) => (item.id === skill.id ? { ...item, ...draft } : item))
            );
          }}
          onRemove={(skill) =>
            settings.skills.setSkills((current) => current.filter((item) => item.id !== skill.id))
          }
        />
      );
      break;
    case 'permissions':
      content = (
        <Stack gap="lg">
          <PermissionModeSelector
            value={settings.permissions.mode}
            onChange={settings.permissions.onModeChange}
          />
          <PermissionRulesPanel
            rules={settings.permissions.rules}
            denials={settings.permissions.denials}
            directories={settings.permissions.directories}
            knownTools={PERMISSION_TOOLS_FIXTURE}
            onSaveRule={settings.permissions.onSaveRule}
            onDeleteRule={settings.permissions.onDeleteRule}
            onChangeScope={settings.permissions.onChangeScope}
            onAddDirectory={settings.permissions.onAddDirectory}
            onRemoveDirectory={settings.permissions.onRemoveDirectory}
          />
        </Stack>
      );
      break;
    case 'hooks':
      content = <HooksPanel {...settings.hooks} knownTools={HOOK_TOOLS} />;
      break;
    case 'usage':
      content = <UsagePanel {...usage} />;
      break;
    case 'help':
      content = (
        <CommandsHelp
          commands={HELP_COMMANDS}
          shortcuts={HELP_SHORTCUTS}
          onCommandSelect={(command) => onCommandSelect?.(command.name)}
        />
      );
      break;
  }

  return (
    <SettingsModal
      opened={opened}
      onClose={onClose}
      size="90rem"
      sections={WORKSPACE_SETTINGS_SECTIONS}
      activeId={section}
      onActiveChange={(id) => onSectionChange(id as WorkspaceSettingsSection)}
      searchable
    >
      {content}
    </SettingsModal>
  );
}
