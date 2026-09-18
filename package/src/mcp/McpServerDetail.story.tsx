import React from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { failFirstCall, prepareFlow } from '../_stories/flow-helpers';
import type { McpServer, McpToolDefinition } from './types';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import {
  FILESYSTEM_SERVER,
  GIT_SERVER,
  ISSUES_SERVER,
  POSTGRES_SERVER,
  ERRORS_SERVER,
} from './fixtures';
import {
  McpServerDetail,
  type McpServerDetailProps,
  type McpServerDetailTab,
} from './McpServerDetail';

export default { title: 'mcp/McpServerDetail' };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<McpServerDetailProps>) {
  return (
    <McpServerDetail
      server={GIT_SERVER}
      onReconnect={() => wait(800)}
      onAuthenticate={() => wait(800)}
      onEnable={() => wait(500)}
      onDisable={() => wait(500)}
      onEdit={() => {}}
      onRemove={() => wait(500)}
      onSelectTool={() => {}}
      {...props}
    />
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={760}>
      <Demo />
    </Stack>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo server={FILESYSTEM_SERVER} tab="configuration" />
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

export function Configuration() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo server={POSTGRES_SERVER} tab="configuration" />
    </WidthFrame>
  );
}

export function NeedsAuth() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo server={ISSUES_SERVER} />
    </WidthFrame>
  );
}

export function Error() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo
        server={ERRORS_SERVER}
        onReconnect={() =>
          wait(800).then(() =>
            Promise.reject(new globalThis.Error('Still unreachable after 3 attempts'))
          )
        }
      />
    </WidthFrame>
  );
}

export function Disabled() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo server={POSTGRES_SERVER} />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo server={{ ...GIT_SERVER, tools: undefined, status: 'connecting' }} loading />
    </WidthFrame>
  );
}

const LONG_NAME_SERVER: McpServer = {
  ...GIT_SERVER,
  id: 'layers',
  name: 'layers',
  tools: [
    {
      name: 'workspace_context',
      title: 'Где я сейчас нахожусь и что открыто в рабочем пространстве',
      description: 'Возвращает текущее пространство, проект и открытые страницы.',
      annotations: { readOnlyHint: true },
    },
    {
      name: 'workspaces_list',
      title: 'Мои пространства со всеми участниками и правами доступа',
      description: 'Список пространств, доступных текущему пользователю.',
      annotations: { readOnlyHint: true },
    },
    {
      name: 'task_bulk_update',
      title: 'Массовое обновление задач по фильтру без подтверждения',
      description: 'Меняет статус, исполнителя и сроки сразу у нескольких задач.',
      annotations: { destructiveHint: true },
    },
  ],
};

export function LongToolNames() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo server={LONG_NAME_SERVER} />
    </WidthFrame>
  );
}

type DetailAction = (server: McpServer) => void | Promise<void>;

interface DetailFlowArgs {
  onReconnect: DetailAction;
  onAuthenticate: DetailAction;
  onDisable: DetailAction;
  onEnable: DetailAction;
  onEdit: (server: McpServer) => void;
  onRemove: DetailAction;
  onTabChange: (tab: McpServerDetailTab) => void;
  onSelectTool: (tool: McpToolDefinition) => void;
}

const detailArgs = (overrides: Partial<DetailFlowArgs> = {}): DetailFlowArgs => ({
  onReconnect: fn(),
  onAuthenticate: fn(),
  onDisable: fn(),
  onEnable: fn(),
  onEdit: fn(),
  onRemove: fn(),
  onTabChange: fn(),
  onSelectTool: fn(),
  ...overrides,
});

export const ReconnectFlow = {
  args: detailArgs({
    onReconnect: fn(async () => {
      await wait(400);
      throw new globalThis.Error('Still unreachable after 3 attempts');
    }),
  }),
  render: (args: DetailFlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <McpServerDetail server={ERRORS_SERVER} {...args} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: DetailFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await expect(await canvas.findByText('Connection failed')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Reconnect' }));
    await expect(args.onReconnect).toHaveBeenCalledWith(ERRORS_SERVER);
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Reconnect' })).toHaveAttribute(
        'data-loading',
        'true'
      )
    );
    await expect(canvas.getByRole('button', { name: 'Disable' })).toBeDisabled();

    await expect(
      await canvas.findByText('Still unreachable after 3 attempts', {}, { timeout: 5000 })
    ).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Disable' })).toBeEnabled());
    await expect(canvas.getByRole('button', { name: 'Reconnect' })).not.toHaveAttribute(
      'data-loading'
    );
  },
};

export const AuthenticateFlow = {
  args: detailArgs({
    onAuthenticate: failFirstCall('OAuth window was closed', 300),
  }),
  render: (args: DetailFlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <McpServerDetail server={ISSUES_SERVER} {...args} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: DetailFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByText('Sign in to this server to use its tools')
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Authenticate' }));
    await expect(
      await canvas.findByText('OAuth window was closed', {}, { timeout: 5000 })
    ).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Authenticate' }));
    await waitFor(() =>
      expect(canvas.getByRole('button', { name: 'Authenticate' })).toHaveAttribute(
        'data-loading',
        'true'
      )
    );
    await waitFor(
      () =>
        expect(canvas.getByRole('button', { name: 'Authenticate' })).not.toHaveAttribute(
          'data-loading'
        ),
      { timeout: 5000 }
    );
    await expect(args.onAuthenticate).toHaveBeenCalledTimes(2);
    await expect(args.onAuthenticate).toHaveBeenLastCalledWith(ISSUES_SERVER);
  },
};

export const TabsFlow = {
  args: detailArgs(),
  render: (args: DetailFlowArgs) => (
    <WidthFrame width={WIDE_WIDTH}>
      <McpServerDetail server={GIT_SERVER} {...args} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: DetailFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);

    await userEvent.click(await canvas.findByRole('tab', { name: /Resources/ }));
    await expect(args.onTabChange).toHaveBeenLastCalledWith('resources');
    await expect(await canvas.findByText('README.md')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: /Prompts/ }));
    await expect(args.onTabChange).toHaveBeenLastCalledWith('prompts');
    await expect(await canvas.findByText('review_pull_request')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('tab', { name: 'Configuration' }));
    await expect(args.onTabChange).toHaveBeenLastCalledWith('configuration');
    await userEvent.click(await canvas.findByRole('button', { name: 'Edit' }));
    await expect(args.onEdit).toHaveBeenCalledWith(GIT_SERVER);

    await userEvent.click(canvas.getByRole('tab', { name: /Tools/ }));
    await expect(args.onTabChange).toHaveBeenLastCalledWith('tools');
    await userEvent.click(await canvas.findByText('Merge pull request'));
    await expect(args.onSelectTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'merge_pull_request' })
    );
  },
};
