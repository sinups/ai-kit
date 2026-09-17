import React, { useState } from 'react';
import { Box, Select, Stack, Switch, Text } from '@mantine/core';
import { IconAdjustments, IconChartBar, IconPlug } from '@tabler/icons-react';
import { MCP_SERVERS } from '../mcp/fixtures';
import { McpSettingsPanel } from '../mcp/McpSettingsPanel';
import { DAILY_USAGE, LIMITS, MODEL_USAGE } from '../model-settings/fixtures';
import type { UsagePeriod } from '../model-settings/types';
import { UsagePanel } from '../model-settings/UsagePanel/UsagePanel';
import { SettingRow } from '../primitives/SettingsLayout/SettingRow';
import { SettingsLayout } from '../primitives/SettingsLayout/SettingsLayout';
import type { SettingsNavItem } from '../primitives/SettingsLayout/settings-nav';
import classes from './layouts.module.css';

const SECTIONS: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: <IconAdjustments size={16} /> },
  { id: 'mcp', label: 'MCP servers', icon: <IconPlug size={16} />, fill: true },
  { id: 'usage', label: 'Usage', icon: <IconChartBar size={16} /> },
];

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section" className={classes.settingsGroup}>
      <Box className={classes.settingsGroupHeading}>
        <Text component="h2" className={classes.settingsGroupTitle}>
          {title}
        </Text>
        {description && (
          <Text component="p" className={classes.settingsGroupDescription}>
            {description}
          </Text>
        )}
      </Box>
      <Stack gap="md">{children}</Stack>
    </Box>
  );
}

function General() {
  return (
    <Box className={classes.settingsStack}>
      <Group title="Appearance" description="How the assistant looks in this workspace">
        <SettingRow
          label="Theme"
          htmlFor="layout-theme"
          control={
            <Select
              id="layout-theme"
              data={['System', 'Light', 'Dark']}
              defaultValue="System"
              allowDeselect={false}
              className={classes.settingsSelect}
            />
          }
        />
        <SettingRow
          label="Compact messages"
          description="Less space between turns"
          control={<Switch aria-label="Compact messages" />}
        />
      </Group>
      <Group title="Chat">
        <SettingRow
          label="Send with Enter"
          description="Use Shift+Enter for a new line"
          control={<Switch aria-label="Send with Enter" defaultChecked />}
        />
        <SettingRow
          label="Collapse read and search tools"
          description="Show runs of tool calls as one summary line"
          control={<Switch aria-label="Collapse read and search tools" defaultChecked />}
        />
      </Group>
      <Group title="Privacy" description="Conversations stay in this workspace">
        <SettingRow
          label="Keep history for"
          htmlFor="layout-retention"
          control={
            <Select
              id="layout-retention"
              data={['30 days', '90 days', 'Forever']}
              defaultValue="90 days"
              allowDeselect={false}
              className={classes.settingsSelect}
            />
          }
        />
      </Group>
    </Box>
  );
}

/** Settings page with airy navigation and sections separated by space and typography */
export function SettingsPage() {
  const [activeId, setActiveId] = useState('general');
  const [period, setPeriod] = useState<UsagePeriod>('week');

  return (
    <SettingsLayout
      title="Settings"
      sections={SECTIONS}
      activeId={activeId}
      onActiveChange={setActiveId}
      className={classes.settingsPage}
    >
      {activeId === 'general' && <General />}
      {activeId === 'mcp' && <McpSettingsPanel servers={MCP_SERVERS} />}
      {activeId === 'usage' && (
        <UsagePanel
          period={period}
          onPeriodChange={setPeriod}
          summary={{ tokens: 6_200_000, cost: 67.54, requests: 1_284 }}
          limits={LIMITS}
          models={MODEL_USAGE}
          daily={DAILY_USAGE}
        />
      )}
    </SettingsLayout>
  );
}
