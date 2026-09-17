import React, { useState } from 'react';
import { Badge, Box, Button, Select, Stack, Switch, TextInput } from '@mantine/core';
import {
  IconBrain,
  IconKey,
  IconPlugConnected,
  IconSettings,
  IconShieldLock,
} from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { EntityListItem } from '../EntityList/EntityListItem';
import { MasterDetail } from '../MasterDetail/MasterDetail';
import type { SettingsNavItem } from './settings-nav';
import { SettingRow } from './SettingRow';
import { SettingsLayout, type SettingsLayoutProps } from './SettingsLayout';
import { SettingsModal } from './SettingsModal';
import { SettingsSection } from './SettingsSection';

export default { title: 'primitives/SettingsLayout' };

const SECTIONS: SettingsNavItem[] = [
  { id: 'general', label: 'General', icon: <IconSettings size={16} /> },
  {
    id: 'models',
    label: 'Models',
    description: 'Default model and limits',
    icon: <IconBrain size={16} />,
    group: 'Agent',
  },
  { id: 'permissions', label: 'Permissions', icon: <IconShieldLock size={16} />, group: 'Agent' },
  {
    id: 'mcp',
    label: 'MCP servers',
    description: 'Connected tools',
    icon: <IconPlugConnected size={16} />,
    badge: (
      <Badge size="xs" variant="light">
        3
      </Badge>
    ),
    group: 'Integrations',
  },
  {
    id: 'keys',
    label: 'API keys',
    icon: <IconKey size={16} />,
    group: 'Integrations',
    disabled: true,
  },
];

const SERVERS = Array.from({ length: 30 }, (_, index) => `server-${index + 1}`);

function ServersPane() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <MasterDetail
      list={
        <Stack gap={2} p="xs">
          {SERVERS.map((name) => (
            <EntityListItem
              key={name}
              title={name}
              description="Scrolls inside the list pane"
              selected={name === selected}
              onClick={() => setSelected(name)}
            />
          ))}
        </Stack>
      }
      detail={selected && <Box p="lg">{selected}</Box>}
      onBack={() => setSelected(null)}
    />
  );
}

function SectionContent({ id }: { id: string }) {
  if (id === 'mcp') {
    return <ServersPane />;
  }
  if (id === 'models') {
    return (
      <Stack gap="xl">
        <SettingsSection title="Default model" description="Used for new conversations">
          <SettingRow
            label="Model"
            htmlFor="story-model"
            control={
              <Select
                id="story-model"
                data={['qwen-2.5-coder-32b', 'llama-3.3-70b']}
                value="qwen-2.5-coder-32b"
              />
            }
          />
          <SettingRow
            label="Max output tokens"
            description="Longer answers cost more"
            htmlFor="story-tokens"
            error="Must be between 1 and 64000"
            control={<TextInput id="story-tokens" defaultValue="0" />}
          />
        </SettingsSection>
      </Stack>
    );
  }
  return (
    <Stack gap="xl">
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
        <SettingRow
          label="Language"
          layout="stacked"
          htmlFor="story-language"
          control={<Select id="story-language" data={['English', 'Русский']} value="English" />}
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

function Demo(props: Partial<SettingsLayoutProps>) {
  const [activeId, setActiveId] = useState('general');
  return (
    <SettingsLayout
      title="Settings"
      sections={SECTIONS}
      activeId={activeId}
      onActiveChange={setActiveId}
      {...props}
    >
      <SectionContent id={activeId} />
    </SettingsLayout>
  );
}

export function Usage() {
  return (
    <Box h="100vh">
      <Demo searchable />
    </Box>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Box h={560}>
        <Demo searchable />
      </Box>
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={560}>
        <Demo searchable />
      </Box>
    </WidthFrame>
  );
}

export function WithoutSearch() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={560}>
        <Demo title={undefined} />
      </Box>
    </WidthFrame>
  );
}

export function RowLayouts() {
  return (
    <Stack p="xl" gap="xl">
      {[NARROW_WIDTH, 600].map((width) => (
        <WidthFrame key={width} width={width}>
          <SettingsSection title="Row layouts">
            <SettingRow
              label="Auto"
              description="Inline from 480px of row width"
              control={<Switch aria-label="Auto" />}
            />
            <SettingRow
              label="Inline"
              description="Always beside the text"
              layout="inline"
              control={<Switch aria-label="Inline" />}
            />
            <SettingRow
              label="Stacked"
              description="Always under the text"
              layout="stacked"
              control={<TextInput aria-label="Stacked" placeholder="Value" />}
            />
          </SettingsSection>
        </WidthFrame>
      ))}
    </Stack>
  );
}

const FILL_SECTIONS = SECTIONS.map((section) =>
  section.id === 'mcp' ? { ...section, fill: true } : section
);

export function FillContent() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Box h={560}>
        <Demo searchable sections={FILL_SECTIONS} />
      </Box>
    </WidthFrame>
  );
}

export function InModal() {
  const [opened, setOpened] = useState(true);
  const [activeId, setActiveId] = useState('mcp');
  return (
    <Box p="xl">
      <Button onClick={() => setOpened(true)}>Open settings</Button>
      <SettingsModal
        opened={opened}
        onClose={() => setOpened(false)}
        sections={FILL_SECTIONS}
        activeId={activeId}
        onActiveChange={setActiveId}
        searchable
      >
        <SectionContent id={activeId} />
      </SettingsModal>
    </Box>
  );
}

InModal.parameters = { layout: 'fullscreen' };
