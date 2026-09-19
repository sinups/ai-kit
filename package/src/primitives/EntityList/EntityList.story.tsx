import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Avatar, Badge, Button } from '@mantine/core';
import { IconPlug, IconPlus, IconServer, IconTrash } from '@tabler/icons-react';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../../_stories/WidthFrame';
import { EntityList, type EntityListProps } from './EntityList';
import { EntityListItem } from './EntityListItem';

export default { title: 'Primitives/EntityList' };

interface Server {
  id: string;
  name: string;
  description: string;
  transport: 'stdio' | 'http';
  tools: number;
  disabled?: boolean;
}

const SERVERS: Server[] = [
  {
    id: 'repo',
    name: 'Repository',
    description: 'Issues, pull requests and repository contents for the connected organization.',
    transport: 'http',
    tools: 42,
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write files inside the allowed project directories.',
    transport: 'stdio',
    tools: 11,
  },
  {
    id: 'postgres',
    name: 'Postgres',
    description:
      'Run read-only SQL queries against the analytics replica. Long descriptions are clamped to two lines so rows keep the same rhythm.',
    transport: 'stdio',
    tools: 3,
  },
  {
    id: 'tracker',
    name: 'Tracker',
    description: 'Disabled by the workspace administrator.',
    transport: 'http',
    tools: 18,
    disabled: true,
  },
  {
    id: 'errors',
    name: 'Errors',
    description: 'Recent errors and releases.',
    transport: 'http',
    tools: 7,
  },
];

function renderServer(server: Server, { selected }: { selected: boolean }) {
  return (
    <EntityListItem
      title={server.name}
      description={server.description}
      icon={
        <Avatar size="sm" radius="sm" color="gray">
          {server.transport === 'http' ? <IconPlug size={16} /> : <IconServer size={16} />}
        </Avatar>
      }
      badges={
        <Badge size="xs" variant="light" color="gray">
          {server.transport}
        </Badge>
      }
      meta={`${server.tools} tools`}
      selected={selected}
      disabled={server.disabled}
      actions={[
        { label: 'Reconnect', onClick: () => {} },
        { label: 'Remove', icon: <IconTrash size={14} />, color: 'red', onClick: () => {} },
      ]}
    />
  );
}

function Demo(props: Partial<EntityListProps<Server>>) {
  const [selectedId, setSelectedId] = useState<string | null>('filesystem');
  const [query, setQuery] = useState('');
  return (
    <EntityList<Server>
      items={SERVERS}
      getId={(server) => server.id}
      isItemDisabled={(server) => !!server.disabled}
      renderItem={renderServer}
      selectedId={selectedId}
      onSelect={(server) => setSelectedId(server.id)}
      ariaLabel="MCP servers"
      search={{
        value: query,
        onChange: setQuery,
        placeholder: 'Search servers',
        filter: (server, q) => server.name.toLowerCase().includes(q.toLowerCase()),
      }}
      toolbar={
        <Button size="md" variant="light" leftSection={<IconPlus size={14} />}>
          Add
        </Button>
      }
      empty={{
        title: 'No servers',
        description: 'Connect an MCP server to give the agent new tools.',
        icon: <IconServer size={28} />,
        action: <Button size="xs">Add server</Button>,
      }}
      {...props}
    />
  );
}

export function Usage() {
  return (
    <WidthFrame width={480}>
      <Demo />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo groupBy={(server) => server.transport} />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo groupBy={(server) => server.transport} />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={480}>
      <Demo loading />
    </WidthFrame>
  );
}

export const Error = {
  name: 'Error',
  render: () => (
    <WidthFrame width={480}>
      <Demo error="Could not load MCP servers: connection timed out." onRetry={() => {}} />
    </WidthFrame>
  ),
};

export function Empty() {
  return (
    <WidthFrame width={480}>
      <Demo items={[]} />
    </WidthFrame>
  );
}

export function Grouped() {
  return (
    <WidthFrame width={480}>
      <Demo groupBy={(server) => server.transport} groupOrder={['stdio', 'http']} />
    </WidthFrame>
  );
}

function FiltersDemo({ width }: { width: number }) {
  const [filter, setFilter] = useState('all');
  const count = (transport: string) =>
    SERVERS.filter((server) => server.transport === transport).length;
  return (
    <WidthFrame width={width}>
      <Demo
        filters={{
          value: filter,
          onChange: setFilter,
          filter: (server, value) => value === 'all' || server.transport === value,
          options: [
            { value: 'all', label: 'All', count: SERVERS.length },
            { value: 'stdio', label: 'Local', count: count('stdio') },
            { value: 'http', label: 'Remote', count: count('http') },
          ],
        }}
      />
    </WidthFrame>
  );
}

export function WithFilters() {
  return <FiltersDemo width={WIDE_WIDTH} />;
}

export function WithFiltersNarrow() {
  return <FiltersDemo width={NARROW_WIDTH} />;
}

type FlowArgs = {
  onSelect: (server: Server) => void;
  onAction: (action: string, server: Server) => void;
  onRetry: () => void;
  onEmptyAction: () => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

const flowArgs = (): FlowArgs => ({
  onSelect: fn(),
  onAction: fn(),
  onRetry: fn(),
  onEmptyAction: fn(),
});

function FlowList({ args, ...props }: Partial<EntityListProps<Server>> & { args: FlowArgs }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <EntityList<Server>
        items={SERVERS}
        getId={(server) => server.id}
        isItemDisabled={(server) => !!server.disabled}
        renderItem={(server, { selected }) => (
          <EntityListItem
            title={server.name}
            meta={`${server.tools} tools`}
            selected={selected}
            disabled={server.disabled}
            actions={[
              { label: 'Reconnect', onClick: () => args.onAction('reconnect', server) },
              { label: 'Remove', color: 'red', onClick: () => args.onAction('remove', server) },
            ]}
          />
        )}
        selectedId={selectedId}
        onSelect={(server) => {
          setSelectedId(server.id);
          args.onSelect(server);
        }}
        ariaLabel="MCP servers"
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Search servers',
          filter: (server, value) => server.name.toLowerCase().includes(value.toLowerCase()),
        }}
        filters={{
          value: filter,
          onChange: setFilter,
          filter: (server, value) => value === 'all' || server.transport === value,
          options: [
            { value: 'all', label: 'All' },
            { value: 'stdio', label: 'Local' },
            { value: 'http', label: 'Remote' },
          ],
        }}
        labels={{ noResults: 'No servers match' }}
        onRetry={args.onRetry}
        empty={{
          title: 'No servers',
          description: 'Connect an MCP server to give the agent new tools.',
          action: (
            <Button size="xs" onClick={args.onEmptyAction}>
              Add server
            </Button>
          ),
        }}
        {...props}
      />
    </WidthFrame>
  );
}

const optionNames = (canvas: ReturnType<typeof within>) =>
  canvas.queryAllByRole('option').map((option: HTMLElement) => option.textContent ?? '');

export const SearchFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowList args={args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Search servers');
    await userEvent.type(input, 'repo');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
    await expect(canvas.getByRole('option')).toHaveTextContent('Repository');
    await userEvent.type(input, 'zzz');
    await expect(await canvas.findByText('No servers match')).toBeInTheDocument();
    await userEvent.clear(input);
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(SERVERS.length));
  },
};

export const FilterFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowList args={args} />,
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByText('Local'));
    await waitFor(() =>
      expect(optionNames(canvas).map((name: string) => name.replace(/\d+ tools/, ''))).toEqual([
        'Filesystem',
        'Postgres',
      ])
    );
    await userEvent.click(canvas.getByText('Remote'));
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(3));
    await userEvent.click(canvas.getByText('All'));
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(SERVERS.length));
  },
};

export const KeyboardFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowList args={args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const options = canvas.getAllByRole('option');
    options[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(options[1]).toHaveFocus();
    await userEvent.keyboard('{End}');
    await expect(options[4]).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(options[2]).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(options[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'filesystem' }));
    await waitFor(() => expect(options[1]).toHaveAttribute('aria-selected', 'true'));
  },
};

export const ActionsFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowList args={args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getAllByRole('button', { name: 'Actions' })[2]);
    await userEvent.click(await page.findByRole('menuitem', { name: 'Remove' }));
    await expect(args.onAction).toHaveBeenCalledWith(
      'remove',
      expect.objectContaining({ id: 'postgres' })
    );
    await expect(args.onSelect).not.toHaveBeenCalled();
    await expect(canvas.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'false');
  },
};

export const EmptyFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowList args={args} items={[]} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('No servers')).toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Add server' }));
    await expect(args.onEmptyAction).toHaveBeenCalledTimes(1);
  },
};

export const RetryFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <FlowList args={args} error="Could not load MCP servers: connection timed out." />
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText(/connection timed out/)).toBeInTheDocument();
    await expect(canvas.queryByRole('option')).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
