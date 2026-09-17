import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { waitFor, within } from '@testing-library/react';
import { setElementWidth } from '../primitives/_testing/element-width';
import { MEMORY_FILES_FIXTURE, MEMORY_NOW } from './fixtures';
import { MemoryPanel, type MemoryPanelProps } from './MemoryPanel';
import type { MemoryFile } from './types';

function Stateful(props: Partial<MemoryPanelProps>) {
  const [files, setFiles] = useState<MemoryFile[]>(MEMORY_FILES_FIXTURE);
  return (
    <MemoryPanel
      files={files}
      now={MEMORY_NOW}
      locale="en"
      onSave={(file, content) =>
        setFiles((items) =>
          items.map((item) => (item.id === file.id ? { ...item, content } : item))
        )
      }
      {...props}
    />
  );
}

const renderWide = async (ui: React.ReactElement) => {
  const result = render(ui);
  await waitFor(() =>
    expect(result.container.querySelector('[data-layout="wide"]')).toBeInTheDocument()
  );
  return result;
};

describe('MemoryPanel', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = setElementWidth(1000);
  });
  afterEach(() => restore());

  it('groups files by scope and shows agent names', async () => {
    await renderWide(<Stateful />);

    const list = await screen.findByRole('listbox', { name: 'Memory files' });
    expect(within(list).getByRole('group', { name: 'User' })).toHaveTextContent('AGENTS.md');
    expect(within(list).getByRole('group', { name: 'Project' })).toHaveTextContent(
      'site/AGENTS.md'
    );
    expect(within(list).getByRole('group', { name: 'Local' })).toHaveTextContent('AGENTS.local.md');
    expect(within(list).getByRole('group', { name: 'Agent' })).toHaveTextContent(
      'code-reviewer · .agent/agent-memory/code-reviewer/MEMORY.md'
    );
    expect(within(list).getByText('12 minutes ago')).toBeInTheDocument();
  });

  it('opens a file and renders its Markdown, searching by content', async () => {
    await renderWide(<Stateful />);

    await userEvent.type(await screen.findByRole('textbox', { name: 'Search memory' }), 'tunnel');
    expect(screen.queryByText('site/AGENTS.md')).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByText('AGENTS.local.md')[0]);

    expect(screen.getByRole('heading', { name: 'AGENTS.local.md' })).toBeInTheDocument();
    expect(screen.getByText('Local', { selector: '.mantine-Badge-label' })).toBeInTheDocument();
    expect(screen.getByText(/Local Ollama tunnel/)).toBeInTheDocument();
  });

  it('edits and saves a file', async () => {
    await renderWide(<Stateful selectedId="local" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    const editor = screen.getByRole('textbox', { name: 'Content' });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.clear(editor);
    await userEvent.type(editor, 'Tunnel moved to port 11500');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Tunnel moved to port 11500')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Content' })).not.toBeInTheDocument();
  });

  it('keeps the editor open with the error when saving fails', async () => {
    await renderWide(
      <Stateful
        selectedId="project"
        onSave={() => Promise.reject(new Error('AGENTS.md is read-only'))}
      />
    );

    await userEvent.click(await screen.findByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Content' }), '!');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('AGENTS.md is read-only')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Content' })).toBeInTheDocument();
  });

  it('asks before discarding unsaved edits when switching files', async () => {
    const onSelectedIdChange = jest.fn();
    await renderWide(<Stateful onSelectedIdChange={onSelectedIdChange} />);

    await userEvent.click(screen.getAllByText('AGENTS.local.md')[0]);
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.type(screen.getByRole('textbox', { name: 'Content' }), ' draft');
    await userEvent.click(screen.getByText('site/AGENTS.md'));

    const dialog = await screen.findByRole('dialog', { name: 'Discard changes?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
    expect(screen.getByRole('textbox', { name: 'Content' })).toHaveValue(
      'Local Ollama tunnel: `ssh -N -L 11434:127.0.0.1:11434 gpu` draft'
    );

    await userEvent.click(screen.getByText('site/AGENTS.md'));
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Discard changes?' })).getByRole('button', {
        name: 'Discard',
      })
    );
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'AGENTS.md' })).toBeInTheDocument()
    );
    expect(onSelectedIdChange).toHaveBeenLastCalledWith('project-site');
  });

  it('follows a controlled selection and opens the file location', async () => {
    const onOpenLocation = jest.fn();
    const { rerender } = await renderWide(
      <MemoryPanel files={MEMORY_FILES_FIXTURE} selectedId={null} onOpenLocation={onOpenLocation} />
    );
    await screen.findByRole('listbox', { name: 'Memory files' });
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();

    rerender(
      <MemoryPanel
        files={MEMORY_FILES_FIXTURE}
        selectedId="agent-empty"
        onOpenLocation={onOpenLocation}
      />
    );
    await waitFor(() => expect(document.querySelector('[data-layout="wide"]')).toBeInTheDocument());
    expect(await screen.findByText('This file is empty.')).toBeInTheDocument();
    expect(screen.getByText('Agent · test-runner')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Open location' }));
    expect(onOpenLocation).toHaveBeenCalledWith(expect.objectContaining({ id: 'agent-empty' }));
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('renders loading, error and empty states', async () => {
    const onRetry = jest.fn();
    const onCreate = jest.fn();
    const waitWide = () =>
      waitFor(() => expect(document.querySelector('[data-layout="wide"]')).toBeInTheDocument());

    const { rerender } = render(<MemoryPanel files={[]} loading />);
    await waitWide();
    expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

    rerender(<MemoryPanel files={[]} error="Cannot read memory" onRetry={onRetry} />);
    await waitWide();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<MemoryPanel files={[]} onCreate={onCreate} />);
    await waitWide();
    expect(screen.getByText('No memory files')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New file' }));
    expect(onCreate).toHaveBeenCalled();
  });
});
