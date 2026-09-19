import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { ActionIcon, Divider, EmptyState, Group, ScrollArea, Stack, Text } from '@mantine/core';
import { IconLayoutSidebar, IconMessagePlus, IconMessages } from '@tabler/icons-react';
import { prepareFlow } from '../_stories/flow-helpers';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ExportDialog } from './ExportDialog';
import { createSessionFixtures, sessionConversation } from './fixtures';
import { SessionList, type SessionListProps } from './SessionList';
import type { SessionSummary } from './types';

export default { title: 'Sessions & tasks/SessionList' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo(props: Partial<SessionListProps>) {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => createSessionFixtures());
  const [selectedId, setSelectedId] = useState<string | null>('auth-retry');
  const [exporting, setExporting] = useState<SessionSummary | null>(null);

  const update = (id: string, patch: Partial<SessionSummary>) =>
    setSessions((current) =>
      current.map((session) => (session.id === id ? { ...session, ...patch } : session))
    );

  return (
    <>
      <SessionList
        sessions={sessions}
        selectedId={selectedId}
        onSelect={(session) => setSelectedId(session.id)}
        onRename={async (session, title) => {
          await wait(600);
          update(session.id, { title });
        }}
        onPin={(session, pinned) => update(session.id, { pinned })}
        onArchive={(session, archived) => update(session.id, { archived })}
        onDelete={async (session) => {
          await wait(600);
          setSessions((current) => current.filter((item) => item.id !== session.id));
        }}
        onExport={setExporting}
        {...props}
      />
      <ExportDialog
        opened={exporting !== null}
        onClose={() => setExporting(null)}
        title={exporting?.title}
        messages={sessionConversation}
        onDownload={() => setExporting(null)}
      />
    </>
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

export function Loading() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo loading />
    </WidthFrame>
  );
}

export const Error = {
  name: 'Error',
  render: () => (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo
        error="Could not load sessions: the history service is unavailable."
        onRetry={() => {}}
      />
    </WidthFrame>
  ),
};

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo sessions={[]} />
    </WidthFrame>
  );
}

export function Sidebar() {
  return (
    <Group gap={0} wrap="nowrap" align="stretch" h="100vh">
      <Stack gap={0} w={NARROW_WIDTH} miw={NARROW_WIDTH} h="100%">
        <Group gap="xs" px="md" py="sm">
          <IconLayoutSidebar size={18} />
          <Text fw={600} size="sm">
            History
          </Text>
        </Group>
        <Divider />
        <ScrollArea
          p="xs"
          flex={1}
          mih={0}
          type="hover"
          scrollbarSize={6}
          styles={{ thumb: { backgroundColor: 'var(--ae-border)' } }}
        >
          <Demo
            withSearch="on-demand"
            toolbar={
              <ActionIcon variant="subtle" color="gray" aria-label="New chat">
                <IconMessagePlus size={16} />
              </ActionIcon>
            }
          />
        </ScrollArea>
      </Stack>
      <Divider orientation="vertical" />
      <Stack flex={1} justify="center">
        <EmptyState
          icon={<IconMessages size={28} />}
          title="Pick a conversation"
          description="Or start a new one from the sidebar."
        />
      </Stack>
    </Group>
  );
}

type FlowArgs = Required<
  Pick<
    SessionListProps,
    'onSelect' | 'onRename' | 'onPin' | 'onArchive' | 'onDelete' | 'onExport' | 'onFilterChange'
  >
>;

const flowArgs = (): FlowArgs => ({
  onSelect: fn(),
  onRename: fn(),
  onPin: fn(),
  onArchive: fn(),
  onDelete: fn(),
  onExport: fn(),
  onFilterChange: fn(),
});

function FlowDemo(args: FlowArgs) {
  const [sessions, setSessions] = useState<SessionSummary[]>(() => createSessionFixtures());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<SessionSummary | null>(null);

  const update = (id: string, patch: Partial<SessionSummary>) =>
    setSessions((current) =>
      current.map((session) => (session.id === id ? { ...session, ...patch } : session))
    );

  return (
    <WidthFrame width={480}>
      <SessionList
        sessions={sessions}
        selectedId={selectedId}
        onFilterChange={args.onFilterChange}
        onSelect={(session) => {
          args.onSelect(session);
          setSelectedId(session.id);
        }}
        onRename={async (session, title) => {
          await args.onRename(session, title);
          await wait(150);
          update(session.id, { title });
        }}
        onPin={(session, pinned) => {
          args.onPin(session, pinned);
          update(session.id, { pinned });
        }}
        onArchive={(session, archived) => {
          args.onArchive(session, archived);
          update(session.id, { archived });
        }}
        onDelete={async (session) => {
          await args.onDelete(session);
          await wait(150);
          setSessions((current) => current.filter((item) => item.id !== session.id));
        }}
        onExport={(session) => {
          args.onExport(session);
          setExporting(session);
        }}
      />
      <ExportDialog
        opened={exporting !== null}
        onClose={() => setExporting(null)}
        title={exporting?.title}
        messages={sessionConversation}
        onDownload={() => setExporting(null)}
      />
    </WidthFrame>
  );
}

function option(canvasElement: HTMLElement, title: string | RegExp) {
  return within(canvasElement).getByRole('option', { name: title });
}

async function openAction(canvasElement: HTMLElement, title: string | RegExp, action: string) {
  const row = option(canvasElement, title);
  await userEvent.click(within(row).getByRole('button', { name: 'Session actions' }));
  const body = within(canvasElement.ownerDocument.body);
  await userEvent.click(await body.findByRole('menuitem', { name: action }));
}

export const SearchFilterFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const search = canvas.getByRole('textbox', { name: 'Search sessions' });

    await userEvent.type(search, 'kubernetes');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
    await expect(canvas.getByRole('option')).toHaveTextContent('Tune Kubernetes memory limits');

    await userEvent.clear(search);
    await userEvent.type(search, 'zzzz');
    await expect(await canvas.findByText('No sessions found')).toBeInTheDocument();
    await userEvent.clear(search);

    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole('button', { name: 'Filter sessions: All' }));
    await userEvent.click(await body.findByRole('menuitem', { name: /Archived/ }));
    await expect(args.onFilterChange).toHaveBeenCalledWith('archived');
    await waitFor(() => expect(canvas.getAllByRole('option')).toHaveLength(1));
    await expect(canvas.getByRole('option')).toHaveTextContent('Spike: websocket transport');

    await userEvent.click(canvas.getByRole('option'));
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'old-spike' }));
    await expect(canvas.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  },
};

export const RenameFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);

    await openAction(canvasElement, /Rewrite onboarding copy/, 'Rename');
    let input = await canvas.findByRole('textbox', { name: 'Session title' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Onboarding copy v2');
    await userEvent.click(canvas.getByRole('textbox', { name: 'Search sessions' }));
    await waitFor(() =>
      expect(args.onRename).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'onboarding-copy' }),
        'Onboarding copy v2'
      )
    );
    await expect(await canvas.findByRole('option', { name: /Onboarding copy v2/ })).toBeVisible();

    await openAction(canvasElement, /Add retry to token refresh/, 'Rename');
    input = await canvas.findByRole('textbox', { name: 'Session title' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Retry token refresh{Enter}');
    await waitFor(() =>
      expect(args.onRename).toHaveBeenLastCalledWith(
        expect.objectContaining({ id: 'auth-retry' }),
        'Retry token refresh'
      )
    );
    await expect(await canvas.findByRole('option', { name: /Retry token refresh/ })).toBeVisible();

    await openAction(canvasElement, /Speed up the monthly report query/, 'Rename');
    input = await canvas.findByRole('textbox', { name: 'Session title' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Should not be saved{Escape}');
    await waitFor(() =>
      expect(canvas.queryByRole('textbox', { name: 'Session title' })).not.toBeInTheDocument()
    );
    await expect(args.onRename).toHaveBeenCalledTimes(2);
    await expect(
      canvas.getByRole('option', { name: /Speed up the monthly report query/ })
    ).toBeVisible();
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const PinArchiveFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);

    await openAction(canvasElement, /Rewrite onboarding copy/, 'Pin');
    await expect(args.onPin).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'onboarding-copy' }),
      true
    );
    const pinned = canvas.getByRole('group', { name: 'Pinned' });
    await waitFor(() => expect(pinned).toHaveTextContent('Rewrite onboarding copy'));

    await openAction(canvasElement, /Rewrite onboarding copy/, 'Archive');
    await expect(args.onArchive).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'onboarding-copy' }),
      true
    );
    await waitFor(() =>
      expect(
        canvas.queryByRole('option', { name: /Rewrite onboarding copy/ })
      ).not.toBeInTheDocument()
    );
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const DeleteFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await openAction(canvasElement, /Investigate flaky checkout/, 'Delete');
    let dialog = await body.findByRole('dialog', { name: 'Delete session?' });
    await expect(dialog).toHaveTextContent('Investigate flaky checkout e2e test');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onDelete).not.toHaveBeenCalled();

    await openAction(canvasElement, /Investigate flaky checkout/, 'Delete');
    dialog = await body.findByRole('dialog', { name: 'Delete session?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await expect(args.onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'flaky-e2e' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() =>
      expect(
        canvas.queryByRole('option', { name: /Investigate flaky checkout/ })
      ).not.toBeInTheDocument()
    );
  },
};

export const ExportFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => <FlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: FlowArgs }) => {
    prepareFlow();
    const body = within(canvasElement.ownerDocument.body);

    await openAction(canvasElement, /Add retry to token refresh/, 'Export');
    await expect(args.onExport).toHaveBeenCalledWith(expect.objectContaining({ id: 'auth-retry' }));
    const dialog = await body.findByRole('dialog', { name: 'Export conversation' });
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Download' })).toBeVisible()
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
