import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { ExportDialog } from './ExportDialog';

const MESSAGES: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    createdAt: '2026-09-17T09:00:00.000Z',
    parts: [{ type: 'text', text: 'Hello there' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'reasoning', text: 'Greet back' },
      { type: 'tool-Read', state: 'output-available', input: { file: 'a.ts' }, output: 'ok' },
      { type: 'text', text: 'Hi!' },
    ],
  },
];

async function preview() {
  return (await screen.findByLabelText('Preview')).textContent ?? '';
}

describe('ExportDialog', () => {
  it('previews markdown with default options and switches formats', async () => {
    render(<ExportDialog opened onClose={() => {}} messages={MESSAGES} title="Greeting" />);

    const markdown = await preview();
    expect(markdown).toContain('# Greeting');
    expect(markdown).toContain('## User · 2026-09-17T09:00:00.000Z');
    expect(markdown).toContain('**Tool: Read**');
    expect(markdown).not.toContain('Thinking');

    await userEvent.click(screen.getByRole('radio', { name: 'JSON' }));
    expect(JSON.parse(await preview()).title).toBe('Greeting');

    await userEvent.click(screen.getByRole('radio', { name: 'Plain text' }));
    expect(await preview()).toContain('Assistant:\n[Tool Read] output-available');
  });

  it('applies options to the preview and the download', async () => {
    const onDownload = jest.fn();
    render(
      <ExportDialog
        opened
        onClose={() => {}}
        messages={MESSAGES}
        title="Greeting"
        onDownload={onDownload}
      />
    );

    await userEvent.click(await screen.findByRole('switch', { name: 'Include tool calls' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Include thinking' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Include timestamps' }));
    const content = await preview();
    expect(content).not.toContain('Tool');
    expect(content).toContain('**Thinking**');
    expect(content).toContain('## User\n');

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(onDownload).toHaveBeenCalledWith('greeting.md', content, 'text/markdown');
  });

  it('resets choices when reopened', async () => {
    const { rerender } = render(
      <ExportDialog opened onClose={() => {}} messages={MESSAGES} defaultFormat="text" />
    );
    await userEvent.click(await screen.findByRole('radio', { name: 'JSON' }));

    rerender(
      <ExportDialog opened={false} onClose={() => {}} messages={MESSAGES} defaultFormat="text" />
    );
    rerender(<ExportDialog opened onClose={() => {}} messages={MESSAGES} defaultFormat="text" />);
    expect(await screen.findByRole('radio', { name: 'Plain text' })).toBeChecked();
  });
});
