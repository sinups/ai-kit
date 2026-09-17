import React, { useRef, useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { prepareFlow } from '../_stories/flow-helpers';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { MemoryNotice } from '../message-actions/MemoryNotice/MemoryNotice';
import { MEMORY_FILES_FIXTURE, MEMORY_NOW } from './fixtures';
import { MemoryPanel, type MemoryPanelProps } from './MemoryPanel';
import type { MemoryFile } from './types';

export default { title: 'memory/MemoryPanel' };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Demo({
  initialSelectedId = 'project',
  ...props
}: Partial<MemoryPanelProps> & { initialSelectedId?: string | null }) {
  const [files, setFiles] = useState<MemoryFile[]>(MEMORY_FILES_FIXTURE);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  return (
    <Paper withBorder radius="md" h={640} style={{ overflow: 'hidden' }}>
      <MemoryPanel
        files={files}
        now={MEMORY_NOW}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
        onSave={async (file, content) => {
          await wait(600);
          setFiles((items) =>
            items.map((item) =>
              item.id === file.id
                ? { ...item, content, updatedAt: new Date(MEMORY_NOW).toISOString() }
                : item
            )
          );
        }}
        onOpenLocation={() => {}}
        onCreate={() => {}}
        {...props}
      />
    </Paper>
  );
}

export function Usage() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo initialSelectedId={null} />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={1200}>
      <Demo listWidth={380} />
    </WidthFrame>
  );
}

export function SaveError() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        onSave={async () => {
          await wait(600);
          throw new Error('AGENTS.md is read-only');
        }}
      />
    </WidthFrame>
  );
}

export function Loading() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo files={[]} loading initialSelectedId={null} />
    </WidthFrame>
  );
}

export function LoadError() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo
        files={[]}
        error="Could not read ~/.agent/AGENTS.md: permission denied"
        onRetry={() => {}}
        initialSelectedId={null}
      />
    </WidthFrame>
  );
}

export function Empty() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo files={[]} initialSelectedId={null} />
    </WidthFrame>
  );
}

export function OpenedFromNotice() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Stack gap="md">
        <MemoryNotice
          content="Use **yarn**, not npm, in this repository."
          target="AGENTS.md"
          onOpen={() => setSelectedId('project')}
        />
        <Paper withBorder radius="md" h={560} style={{ overflow: 'hidden' }}>
          <MemoryPanel
            files={MEMORY_FILES_FIXTURE}
            now={MEMORY_NOW}
            selectedId={selectedId}
            onSelectedIdChange={setSelectedId}
          />
        </Paper>
      </Stack>
    </WidthFrame>
  );
}

type MemoryFlowArgs = Required<Pick<MemoryPanelProps, 'onSave' | 'onSelectedIdChange'>>;

function MemoryFlowDemo({
  failFirstSave = false,
  ...args
}: MemoryFlowArgs & { failFirstSave?: boolean }) {
  const attempts = useRef(0);
  const [files, setFiles] = useState<MemoryFile[]>(MEMORY_FILES_FIXTURE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Paper withBorder radius="md" h={640} style={{ overflow: 'hidden' }}>
        <MemoryPanel
          files={files}
          now={MEMORY_NOW}
          selectedId={selectedId}
          onSelectedIdChange={(id) => {
            args.onSelectedIdChange(id);
            setSelectedId(id);
          }}
          onSave={async (file, content) => {
            await args.onSave(file, content);
            await wait(150);
            attempts.current += 1;
            if (failFirstSave && attempts.current === 1) {
              throw new globalThis.Error('AGENTS.md is read-only');
            }
            setFiles((items) =>
              items.map((item) => (item.id === file.id ? { ...item, content } : item))
            );
          }}
        />
      </Paper>
    </WidthFrame>
  );
}

async function fileOption(canvasElement: HTMLElement, path: string) {
  const options = await within(canvasElement).findAllByRole('option');
  const match = options.find((option) => option.textContent?.includes(path));
  await expect(match).toBeDefined();
  return match!;
}

export const EditFlow = {
  args: { onSave: fn(), onSelectedIdChange: fn() },
  render: (args: MemoryFlowArgs) => <MemoryFlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: MemoryFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(await fileOption(canvasElement, 'AGENTS.local.md'));
    await expect(args.onSelectedIdChange).toHaveBeenCalledWith('local');
    await expect(await canvas.findByText(/Local Ollama tunnel/)).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }));
    const editor = await canvas.findByRole('textbox', { name: 'Content' });
    await userEvent.type(editor, '{Control>}{End}{/Control}\n\nRestart the tunnel after sleep.');

    await userEvent.click(await fileOption(canvasElement, 'site/AGENTS.md'));
    const dialog = await body.findByRole('dialog', { name: 'Discard changes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(
      (canvas.getByRole('textbox', { name: 'Content' }) as HTMLTextAreaElement).value
    ).toContain('Restart the tunnel after sleep.');

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(args.onSave).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'local' }),
        expect.stringContaining('Restart the tunnel after sleep.')
      )
    );
    await waitFor(() =>
      expect(canvas.queryByRole('textbox', { name: 'Content' })).not.toBeInTheDocument()
    );
    await expect(canvas.getByText('Restart the tunnel after sleep.')).toBeVisible();
  },
};

export const SaveErrorFlow = {
  args: { onSave: fn(), onSelectedIdChange: fn() },
  render: (args: MemoryFlowArgs) => <MemoryFlowDemo {...args} failFirstSave />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: MemoryFlowArgs }) => {
    prepareFlow();
    const canvas = within(canvasElement);

    await userEvent.click(await fileOption(canvasElement, '.agent/memory/agents/code-reviewer'));
    await userEvent.click(await canvas.findByRole('button', { name: 'Edit' }));
    const editor = await canvas.findByRole('textbox', { name: 'Content' });
    await userEvent.clear(editor);
    await userEvent.type(editor, '# Review notes{Enter}{Enter}- Prefer early returns');

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(await canvas.findByText('AGENTS.md is read-only')).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Content' })).toHaveValue(
      '# Review notes\n\n- Prefer early returns'
    );

    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(args.onSave).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(canvas.queryByRole('textbox', { name: 'Content' })).not.toBeInTheDocument()
    );
    await expect(canvas.getByText('Prefer early returns')).toBeVisible();
    await expect(canvas.queryByText('AGENTS.md is read-only')).not.toBeInTheDocument();
  },
};
