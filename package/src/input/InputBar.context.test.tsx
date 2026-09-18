import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentChat } from '../AgentChat/AgentChat';
import { InputBar } from './InputBar';
import type { InputContextItem } from './InputContext';

const noop = () => {};
const DOC: InputContextItem = { id: 'doc', label: 'Project Documentation' };

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

function Controlled({
  onRemove,
  onRestore,
}: {
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  const [removed, setRemoved] = useState(false);
  return (
    <InputBar
      status="ready"
      onSend={noop}
      onStop={noop}
      contextItems={[{ ...DOC, removed }]}
      onRemoveContext={(id) => {
        onRemove(id);
        setRemoved(true);
      }}
      onRestoreContext={(id) => {
        onRestore(id);
        setRemoved(false);
      }}
    />
  );
}

describe('input/InputBar context', () => {
  it('renders a chip with the label and a labelled remove button', () => {
    render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contextItems={[DOC]}
        onRemoveContext={noop}
      />,
      { wrapper }
    );
    expect(screen.getByText('Project Documentation')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove Project Documentation' })
    ).toBeInTheDocument();
  });

  it('removes and restores the context and moves the focus between the two buttons', async () => {
    const onRemove = jest.fn();
    const onRestore = jest.fn();
    render(<Controlled onRemove={onRemove} onRestore={onRestore} />, { wrapper });

    await userEvent.click(screen.getByRole('button', { name: 'Remove Project Documentation' }));
    expect(onRemove).toHaveBeenCalledWith('doc');
    const restore = screen.getByRole('button', { name: 'Add back: Project Documentation' });
    expect(restore).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Remove Project Documentation' })).toBeNull();

    await userEvent.click(restore);
    expect(onRestore).toHaveBeenCalledWith('doc');
    expect(screen.getByRole('button', { name: 'Remove Project Documentation' })).toHaveFocus();
  });

  it('hides a removed item without onRestoreContext', () => {
    render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contextItems={[{ ...DOC, removed: true }]}
        onRemoveContext={noop}
      />,
      { wrapper }
    );
    expect(screen.queryByText('Project Documentation')).toBeNull();
    expect(screen.queryByText(/Add back/)).toBeNull();
  });

  it('moves the focus to the field when a removed item cannot come back', async () => {
    render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contextItems={[DOC]}
        onRemoveContext={noop}
      />,
      { wrapper }
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Project Documentation' }));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('takes the labels and passes through AgentChat inputBarProps', () => {
    render(
      <AgentChat
        messages={[]}
        status="ready"
        onSend={noop}
        onStop={noop}
        inputBarProps={{
          contextItems: [DOC, { id: 'old', label: 'Old page', removed: true }],
          onRemoveContext: noop,
          onRestoreContext: noop,
          labels: { removeContext: 'Убрать {label}', restoreContext: 'Вернуть контекст: {label}' },
        }}
      />,
      { wrapper }
    );
    expect(
      screen.getByRole('button', { name: 'Убрать Project Documentation' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуть контекст: Old page' })).toBeInTheDocument();
  });

  it('gives the focus to the field when the host does not answer, and keeps it there later', async () => {
    const view = (removed: boolean) => (
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contextItems={[{ ...DOC, removed }]}
        onRemoveContext={noop}
        onRestoreContext={noop}
      />
    );
    const { rerender } = render(view(false), { wrapper });
    await userEvent.click(screen.getByRole('button', { name: 'Remove Project Documentation' }));
    expect(screen.getByRole('textbox')).toHaveFocus();

    rerender(view(true));
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  it('describes the chip to keyboard and screen reader users', () => {
    render(
      <InputBar
        status="ready"
        onSend={noop}
        onStop={noop}
        contextItems={[{ ...DOC, description: 'The page open next to the chat' }]}
        onRemoveContext={noop}
      />,
      { wrapper }
    );
    expect(
      screen.getByRole('button', { name: 'Remove Project Documentation' })
    ).toHaveAccessibleDescription('The page open next to the chat');
  });
});
