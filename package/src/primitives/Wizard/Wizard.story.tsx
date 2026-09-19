import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import {
  Button,
  Code,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core';
import { IconPlugConnected, IconServer, IconSettings } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import type { WizardStep } from './wizard-state';
import { Wizard } from './Wizard';
import { WizardModal } from './WizardModal';

export default { title: 'Primitives/Wizard' };

type ServerValues = {
  name: string;
  transport: 'stdio' | 'http';
  command: string;
  url: string;
  token: string;
  autoStart: boolean;
};

const INITIAL: ServerValues = {
  name: '',
  transport: 'stdio',
  command: '',
  url: '',
  token: '',
  autoStart: true,
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const STEPS: WizardStep<ServerValues>[] = [
  {
    id: 'basics',
    label: 'Basics',
    description: 'Name and transport',
    icon: <IconServer size={16} />,
    validate: (values) => (values.name.trim() ? null : { name: 'Enter a server name' }),
    render: ({ values, setValue, errors }) => (
      <Stack gap="sm">
        <TextInput
          label="Server name"
          placeholder="files"
          withAsterisk
          value={values.name}
          error={errors.name}
          onChange={(event) => setValue('name', event.currentTarget.value)}
        />
        <SegmentedControl
          value={values.transport}
          onChange={(value) => setValue('transport', value as ServerValues['transport'])}
          data={[
            { value: 'stdio', label: 'Local command' },
            { value: 'http', label: 'Remote URL' },
          ]}
        />
      </Stack>
    ),
  },
  {
    id: 'command',
    label: 'Command',
    description: 'How to start the server',
    icon: <IconPlugConnected size={16} />,
    when: (values) => values.transport === 'stdio',
    validate: (values) => (values.command.trim() ? null : { command: 'Enter a command' }),
    render: ({ values, setValue, errors }) => (
      <TextInput
        label="Command"
        placeholder="npx -y server-files"
        value={values.command}
        error={errors.command}
        onChange={(event) => setValue('command', event.currentTarget.value)}
      />
    ),
  },
  {
    id: 'connection',
    label: 'Connection',
    description: 'Endpoint and credentials',
    icon: <IconPlugConnected size={16} />,
    when: (values) => values.transport === 'http',
    validate: (values) =>
      /^https?:\/\//.test(values.url) ? null : { url: 'Enter an http(s) URL' },
    render: ({ values, setValue, errors }) => (
      <Stack gap="sm">
        <TextInput
          label="URL"
          placeholder="https://mcp.example.com/mcp"
          value={values.url}
          error={errors.url}
          onChange={(event) => setValue('url', event.currentTarget.value)}
        />
        <PasswordInput
          label="Token"
          value={values.token}
          onChange={(event) => setValue('token', event.currentTarget.value)}
        />
      </Stack>
    ),
  },
  {
    id: 'options',
    label: 'Options',
    icon: <IconSettings size={16} />,
    optional: true,
    render: ({ values, setValue }) => (
      <Switch
        label="Start automatically"
        description="Connect when a new session starts"
        checked={values.autoStart}
        onChange={(event) => setValue('autoStart', event.currentTarget.checked)}
      />
    ),
  },
];

function Review({ values }: { values: ServerValues }) {
  const rows: [string, string][] = [
    ['Name', values.name],
    ['Transport', values.transport],
    values.transport === 'stdio' ? ['Command', values.command] : ['URL', values.url],
    ['Start automatically', values.autoStart ? 'Yes' : 'No'],
  ];
  return (
    <Table variant="vertical" withTableBorder fz="sm">
      <Table.Tbody>
        {rows.map(([label, value]) => (
          <Table.Tr key={label}>
            <Table.Th w="40%">{label}</Table.Th>
            <Table.Td>{value || '—'}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function Demo({ orientation }: { orientation?: 'auto' | 'horizontal' | 'vertical' }) {
  const [result, setResult] = useState<ServerValues | null>(null);
  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Wizard
          steps={STEPS}
          initialValues={INITIAL}
          orientation={orientation}
          review={(values) => <Review values={values} />}
          onCancel={() => setResult(null)}
          onComplete={async (values) => {
            await wait(600);
            setResult(values);
          }}
        />
      </Paper>
      {result && <Code block>{JSON.stringify(result, null, 2)}</Code>}
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={720}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Horizontal() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo orientation="horizontal" />
    </WidthFrame>
  );
}

export function InModal() {
  const [opened, setOpened] = useState(true);
  return (
    <Stack p="xl" align="flex-start">
      <Button onClick={() => setOpened(true)}>Add MCP server</Button>
      <WizardModal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Add MCP server"
        steps={STEPS}
        initialValues={INITIAL}
        review={(values) => <Review values={values} />}
        labels={{ finish: 'Add server' }}
        onComplete={async () => {
          await wait(600);
          setOpened(false);
        }}
      />
    </Stack>
  );
}

type TokenValues = { token: string };

const TOKEN_STEPS: WizardStep<TokenValues>[] = [
  {
    id: 'token',
    label: 'API token',
    description: 'Checked against the server, use "valid"',
    validate: async (values) => {
      await wait(800);
      return values.token === 'valid' ? null : { token: 'The server rejected this token' };
    },
    render: ({ values, setValue, errors }) => (
      <PasswordInput
        label="Token"
        value={values.token}
        error={errors.token}
        onChange={(event) => setValue('token', event.currentTarget.value)}
      />
    ),
  },
  {
    id: 'done',
    label: 'Connected',
    render: () => (
      <Text size="sm">The token is valid. Finishing fails to show the error alert.</Text>
    ),
  },
];

export function AsyncValidation() {
  return (
    <WidthFrame width={480}>
      <Paper withBorder p="md" radius="md">
        <Wizard
          steps={TOKEN_STEPS}
          initialValues={{ token: '' }}
          onComplete={async () => {
            await wait(600);
            throw new Error('Could not save the connection, try again');
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

export function ConditionalSteps() {
  const [values, setValues] = useState<ServerValues>({ ...INITIAL, name: 'files' });
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Switch the transport: the Command and Connection steps swap. Values are controlled.
        </Text>
        <Paper withBorder p="md" radius="md">
          <Wizard
            steps={STEPS}
            initialValues={INITIAL}
            values={values}
            onValuesChange={setValues}
            onComplete={() => {}}
          />
        </Paper>
        <Code block>{JSON.stringify(values, null, 2)}</Code>
      </Stack>
    </WidthFrame>
  );
}

type FlowValues = {
  name: string;
  kind: 'local' | 'remote';
  command: string;
  url: string;
  notes: string;
};

const FLOW_INITIAL: FlowValues = { name: '', kind: 'local', command: '', url: '', notes: '' };

function createFlowSteps(asyncValidation = false): WizardStep<FlowValues>[] {
  return [
    {
      id: 'name',
      label: 'Name',
      validate: async (values) => {
        if (asyncValidation) {
          await wait(500);
        }
        return values.name.trim() ? null : { name: 'Enter a server name' };
      },
      render: ({ values, setValue, errors }) => (
        <Stack gap="sm">
          <TextInput
            label="Server name"
            value={values.name}
            error={errors.name}
            onChange={(event) => setValue('name', event.currentTarget.value)}
          />
          <SegmentedControl
            value={values.kind}
            onChange={(value) => setValue('kind', value as FlowValues['kind'])}
            data={[
              { value: 'local', label: 'Local' },
              { value: 'remote', label: 'Remote' },
            ]}
          />
        </Stack>
      ),
    },
    {
      id: 'command',
      label: 'Command',
      when: (values) => values.kind === 'local',
      validate: (values) => (values.command.trim() ? null : { command: 'Enter a command' }),
      render: ({ values, setValue, errors }) => (
        <TextInput
          label="Command"
          value={values.command}
          error={errors.command}
          onChange={(event) => setValue('command', event.currentTarget.value)}
        />
      ),
    },
    {
      id: 'url',
      label: 'URL',
      when: (values) => values.kind === 'remote',
      render: ({ values, setValue }) => (
        <TextInput
          label="Server URL"
          value={values.url}
          onChange={(event) => setValue('url', event.currentTarget.value)}
        />
      ),
    },
    {
      id: 'notes',
      label: 'Notes',
      optional: true,
      validate: (values) =>
        values.notes.trim() ? null : { notes: 'Add a note or skip this step' },
      render: ({ values, setValue, errors }) => (
        <TextInput
          label="Notes"
          value={values.notes}
          error={errors.notes}
          onChange={(event) => setValue('notes', event.currentTarget.value)}
        />
      ),
    },
  ];
}

const FLOW_STEPS = createFlowSteps();
const ASYNC_FLOW_STEPS = createFlowSteps(true);

type FlowArgs = {
  onComplete: (values: FlowValues) => void;
  onCancel: () => void;
  onValuesChange: (values: FlowValues) => void;
  initialValues?: FlowValues;
  asyncValidation?: boolean;
  nonLinear?: boolean;
  busy?: boolean;
};

function FlowWizard(args: FlowArgs) {
  return (
    <Stack p="xl" maw={760}>
      <Paper withBorder p="md" radius="md">
        <Wizard
          orientation="horizontal"
          steps={args.asyncValidation ? ASYNC_FLOW_STEPS : FLOW_STEPS}
          initialValues={args.initialValues ?? FLOW_INITIAL}
          nonLinear={args.nonLinear}
          busy={args.busy}
          review={(values) => (
            <Text size="sm">
              Review: {values.name} runs {values.kind === 'local' ? values.command : values.url}
            </Text>
          )}
          onComplete={args.onComplete}
          onCancel={args.onCancel}
          onValuesChange={args.onValuesChange}
        />
      </Paper>
    </Stack>
  );
}

const flowArgs = (): FlowArgs => ({ onComplete: fn(), onCancel: fn(), onValuesChange: fn() });

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

export const ValidationFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Enter a server name')).toBeInTheDocument();

    await userEvent.type(canvas.getByRole('textbox', { name: 'Server name' }), 'files');
    await expect(canvas.queryByText('Enter a server name')).not.toBeInTheDocument();
    await expect(args.onValuesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: 'files' })
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByRole('textbox', { name: 'Command' })).toBeInTheDocument();
  },
};

export const AsyncValidationFlow = {
  args: { ...flowArgs(), asyncValidation: true, initialValues: { ...FLOW_INITIAL, name: 'files' } },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: 'Next' });
    await userEvent.click(next);
    await waitFor(() => expect(next).toHaveAttribute('data-loading', 'true'));
    await expect(canvas.getByRole('textbox', { name: 'Server name' })).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Command' }, { timeout: 3000 })
    ).toBeInTheDocument();
  },
};

export const ConditionalStepsFlow = {
  args: { ...flowArgs(), initialValues: { ...FLOW_INITIAL, name: 'files' } },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: /Command/ })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /URL/ })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByText('Remote'));
    await expect(args.onValuesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ kind: 'remote' })
    );
    await expect(await canvas.findByRole('button', { name: /URL/ })).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: /Command/ })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByRole('textbox', { name: 'Server URL' })).toBeInTheDocument();
  },
};

export const SkipFlow = {
  args: {
    ...flowArgs(),
    initialValues: { ...FLOW_INITIAL, name: 'files', command: 'npx server-files' },
  },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Next' }));
    await expect(await canvas.findByRole('textbox', { name: 'Notes' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(
      await canvas.findByText('Review: files runs npx server-files')
    ).toBeInTheDocument();
    await expect(canvas.queryByText('Add a note or skip this step')).not.toBeInTheDocument();
  },
};

export const NonLinearFlow = {
  args: { ...flowArgs(), nonLinear: true, initialValues: { ...FLOW_INITIAL, name: 'files' } },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Notes/ }));
    await expect(await canvas.findByRole('textbox', { name: 'Notes' })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));
    await expect(await canvas.findByText('Enter a command')).toBeInTheDocument();
    await expect(args.onComplete).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByRole('textbox', { name: 'Command' }), 'npx server');
    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));
    await expect(await canvas.findByText('Add a note or skip this step')).toBeInTheDocument();
    await expect(args.onComplete).not.toHaveBeenCalled();

    await userEvent.type(canvas.getByRole('textbox', { name: 'Notes' }), 'team server');
    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));
    await waitFor(() =>
      expect(args.onComplete).toHaveBeenCalledWith({
        name: 'files',
        kind: 'local',
        command: 'npx server',
        url: '',
        notes: 'team server',
      })
    );
  },
};

export const BusyFlow = {
  args: { ...flowArgs(), busy: true, initialValues: { ...FLOW_INITIAL, name: 'files' } },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    await expect(canvas.getByRole('textbox', { name: 'Server name' })).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: /Command/ }), {
      pointerEventsCheck: 0,
    });
    await expect(canvas.getByRole('textbox', { name: 'Server name' })).toBeInTheDocument();
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};

export const FocusFlow = {
  args: { ...flowArgs(), initialValues: { ...FLOW_INITIAL, name: 'files' } },
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('textbox', { name: 'Server name' })).not.toHaveFocus();
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    const command = await canvas.findByRole('textbox', { name: 'Command' });
    await waitFor(() => expect(command).toHaveFocus());
  },
};

export const CompleteFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowWizard {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('textbox', { name: 'Server name' }), 'files');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Command' }),
      'npx server-files'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.type(await canvas.findByRole('textbox', { name: 'Notes' }), 'team server');
    await userEvent.click(canvas.getByRole('button', { name: 'Skip' }));
    await expect(
      await canvas.findByText('Review: files runs npx server-files')
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));
    await waitFor(() =>
      expect(args.onComplete).toHaveBeenCalledWith({
        name: 'files',
        kind: 'local',
        command: 'npx server-files',
        url: '',
        notes: 'team server',
      })
    );
    await expect(args.onCancel).not.toHaveBeenCalled();
  },
};

type ModalFlowArgs = {
  onCancel: () => void;
  onClose: () => void;
  onComplete: (values: FlowValues) => void;
};

export const ModalFlow = {
  args: { onCancel: fn(), onClose: fn(), onComplete: fn() },
  render: (args: ModalFlowArgs) => (
    <WizardModal
      opened
      title="Add MCP server"
      steps={FLOW_STEPS}
      initialValues={FLOW_INITIAL}
      onCancel={args.onCancel}
      onClose={args.onClose}
      onComplete={args.onComplete}
    />
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ModalFlowArgs }) => {
    const page = within(canvasElement.ownerDocument.body);
    const dialog = await page.findByRole('dialog', { name: 'Add MCP server' });
    await waitFor(() => expect(dialog).toBeVisible());
    const scoped = within(dialog);
    await expect(scoped.getByRole('textbox', { name: 'Server name' })).toBeInTheDocument();

    await userEvent.click(scoped.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(args.onClose).toHaveBeenCalledTimes(1));

    await userEvent.click(dialog.querySelector('.mantine-Modal-close') as HTMLElement);
    await waitFor(() => expect(args.onCancel).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(args.onClose).toHaveBeenCalledTimes(2));
    await expect(args.onComplete).not.toHaveBeenCalled();
  },
};
