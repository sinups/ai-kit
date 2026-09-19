import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Button, Code, Stack, Text } from '@mantine/core';
import { prepareFlow } from '../_stories/flow-helpers';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ExportDialog, type ExportDialogProps } from './ExportDialog';
import { sessionConversation } from './fixtures';

export default { title: 'Sessions & tasks/ExportDialog' };

function Demo({ width, ...props }: Partial<ExportDialogProps> & { width: number }) {
  const [opened, setOpened] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <WidthFrame width={width}>
      <Stack gap="xs" align="flex-start">
        <Button variant="default" onClick={() => setOpened(true)}>
          Export conversation
        </Button>
        {saved && (
          <Text size="sm">
            Saved <Code>{saved}</Code>
          </Text>
        )}
      </Stack>
      <ExportDialog
        opened={opened}
        onClose={() => setOpened(false)}
        messages={sessionConversation}
        title="Add retry to token refresh"
        onDownload={(filename, _content, mimeType) => {
          setSaved(`${filename} (${mimeType})`);
          setOpened(false);
        }}
        {...props}
      />
    </WidthFrame>
  );
}

export function Usage() {
  return <Demo width={WIDE_WIDTH} />;
}

export function Narrow() {
  return <Demo width={NARROW_WIDTH} defaultFormat="text" />;
}

export function Wide() {
  return (
    <Demo
      width={WIDE_WIDTH}
      defaultFormat="json"
      defaultOptions={{ includeThinking: true }}
      previewHeight={480}
    />
  );
}

type ExportFlowArgs = Required<Pick<ExportDialogProps, 'onDownload' | 'onClose'>>;

function ExportFlowDemo(args: ExportFlowArgs) {
  const [opened, setOpened] = useState(true);
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Button variant="default" onClick={() => setOpened(true)}>
        Export conversation
      </Button>
      <ExportDialog
        opened={opened}
        onClose={() => {
          args.onClose();
          setOpened(false);
        }}
        messages={sessionConversation}
        title="Add retry to token refresh"
        onDownload={args.onDownload}
      />
    </WidthFrame>
  );
}

function previewText(dialog: HTMLElement) {
  return within(dialog).getByLabelText('Preview').textContent ?? '';
}

export const FormatsFlow = {
  args: { onDownload: fn(), onClose: fn() },
  render: (args: ExportFlowArgs) => <ExportFlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ExportFlowArgs }) => {
    prepareFlow();
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole('dialog', { name: 'Export conversation' });
    const scope = within(dialog);

    await waitFor(() => expect(previewText(dialog)).toContain('# Add retry to token refresh'));
    await expect(previewText(dialog)).toContain('## User');

    await userEvent.click(scope.getByRole('radio', { name: 'JSON' }));
    await waitFor(() => expect(previewText(dialog)).toContain('"messages"'));

    await userEvent.click(scope.getByRole('radio', { name: 'Plain text' }));
    await waitFor(() => expect(previewText(dialog)).toContain('User:'));
    await expect(previewText(dialog)).toContain('[Tool');

    await userEvent.click(scope.getByRole('switch', { name: 'Include tool calls' }));
    await waitFor(() => expect(previewText(dialog)).not.toContain('[Tool'));

    await waitFor(() => expect(scope.getByRole('button', { name: 'Download' })).toBeVisible());
    await userEvent.click(scope.getByRole('button', { name: 'Download' }));
    await expect(args.onDownload).toHaveBeenCalledWith(
      'add-retry-to-token-refresh.txt',
      expect.not.stringContaining('[Tool'),
      'text/plain'
    );
  },
};

export const CopyFlow = {
  args: { onDownload: fn(), onClose: fn() },
  render: (args: ExportFlowArgs) => <ExportFlowDemo {...args} />,
  play: async ({ canvasElement, args }: { canvasElement: HTMLElement; args: ExportFlowArgs }) => {
    prepareFlow();
    const body = within(canvasElement.ownerDocument.body);
    const writeText = fn(async (_text: string) => {});
    Object.defineProperty(canvasElement.ownerDocument.defaultView!.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });

    const dialog = await body.findByRole('dialog', { name: 'Export conversation' });
    const scope = within(dialog);
    await userEvent.click(scope.getByRole('switch', { name: 'Include thinking' }));
    await waitFor(() => expect(scope.getByRole('button', { name: 'Copy' })).toBeVisible());
    await userEvent.click(scope.getByRole('button', { name: 'Copy' }));
    await expect(writeText).toHaveBeenCalledWith(previewText(dialog));
    await expect(await scope.findByRole('button', { name: 'Copied' })).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await expect(args.onClose).toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onDownload).not.toHaveBeenCalled();
  },
};
