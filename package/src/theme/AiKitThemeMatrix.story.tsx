import React from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Chip,
  Group,
  NavLink,
  Radio,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Switch,
  Tabs,
  Text,
} from '@mantine/core';
import { IconAlertCircle, IconAlertTriangle, IconServer } from '@tabler/icons-react';
import { InputBar } from '../input/InputBar';
import { bashPart } from '../tools/_story-helpers';
import { BashTool } from '../tools/BashTool';
import {
  AI_KIT_ACCENTS,
  AI_KIT_RADII,
  type AiKitAccent,
  type AiKitRadius,
} from './ai-kit-settings';
import { AiKitProvider } from './AiKitProvider';
import classes from './AiKitThemeMatrix.module.css';

export default { title: 'Theme/Matrix', parameters: { layout: 'fullscreen' } };

function Cell({ accent, radius }: { accent?: AiKitAccent; radius: AiKitRadius }) {
  return (
    <AiKitProvider accent={accent} radius={radius}>
      <Stack gap="xs" data-accent={accent ?? 'default'} data-radius={radius}>
        <Text size="xs" c="dimmed">
          {accent ?? 'default'} · {radius}
        </Text>
        <Group gap={6}>
          <Button size="xs">Approve</Button>
          <Button size="xs" variant="subtle" color="gray">
            Skip
          </Button>
          <Button size="sm">Save</Button>
          <Button size="sm" variant="default">
            Cancel
          </Button>
        </Group>
        <Group gap={6}>
          <Badge variant="light" color="gray">
            12 tools
          </Badge>
          <Badge>New</Badge>
          <Chip size="xs" checked>
            Selected
          </Chip>
          <Chip size="xs" checked={false}>
            Option
          </Chip>
        </Group>
        <SegmentedControl size="xs" data={['All', 'Connected', 'Disabled']} defaultValue="All" />
        <NavLink
          active
          label="git"
          description="npx @mcp/git"
          leftSection={<IconServer size={16} />}
        />
        <Tabs defaultValue="tools">
          <Tabs.List>
            <Tabs.Tab value="tools">Tools</Tabs.Tab>
            <Tabs.Tab value="resources">Resources</Tabs.Tab>
          </Tabs.List>
        </Tabs>
        <Group gap="md">
          <Checkbox size="xs" label="Checked" defaultChecked />
          <Checkbox size="xs" label="Off" />
          <Radio size="xs" label="On" defaultChecked />
          <Radio size="xs" label="Off" />
        </Group>
        <Group gap="md">
          <Switch size="xs" label="On" defaultChecked />
          <Switch size="xs" label="Off" />
        </Group>
        <Alert
          color="red"
          variant="light"
          icon={<IconAlertCircle size={16} />}
          title="Connection failed"
        >
          spawn npx ENOENT
        </Alert>
        <Alert color="yellow" variant="light" icon={<IconAlertTriangle size={16} />}>
          Sign in to this server to use its tools
        </Alert>
        <BashTool
          part={bashPart('input-available', {
            input: {
              command: 'yarn build',
              approval: { onApprove: () => {}, onReject: () => {} },
            },
          })}
        />
        <Box className={classes.composer}>
          <InputBar
            status="ready"
            value="Ship it"
            onChange={() => {}}
            onSend={() => {}}
            onStop={() => {}}
          />
        </Box>
      </Stack>
    </AiKitProvider>
  );
}

function Matrix({ accents }: { accents: (AiKitAccent | undefined)[] }) {
  return (
    <Box p="lg" w={3 * 380 + 2 * 24 + 32}>
      <Stack gap="xl">
        {accents.map((accent) => (
          <SimpleGrid key={accent ?? 'default'} cols={AI_KIT_RADII.length} spacing="lg">
            {AI_KIT_RADII.map((radius) => (
              <Cell key={radius} accent={accent} radius={radius} />
            ))}
          </SimpleGrid>
        ))}
      </Stack>
    </Box>
  );
}

export function AllAccents() {
  return <Matrix accents={[undefined, ...AI_KIT_ACCENTS]} />;
}

export function DefaultAccent() {
  return <Matrix accents={[undefined]} />;
}
