import React, { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { setElementWidth } from '../_testing/element-width';
import { ChatInspectorLayout } from './ChatInspectorLayout';

const PANELS = [
  { id: 'changes', label: 'Changes', content: <div>diff review</div> },
  { id: 'tasks', label: 'Tasks', content: <div>task list</div> },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const mounts = jest.fn();
const unmounts = jest.fn();

function Chat() {
  useEffect(() => {
    mounts();
    return unmounts;
  }, []);
  return <div>chat</div>;
}

function inspectorPane(container: HTMLElement) {
  return container.querySelector('section[aria-label]')?.parentElement ?? null;
}

describe('primitives/ChatInspectorLayout review', () => {
  let restore: () => void;
  afterEach(() => restore());
  beforeEach(() => {
    mounts.mockClear();
    unmounts.mockClear();
  });

  it('keeps the chat mounted when the layout switches between split and drawer', () => {
    restore = setElementWidth(1200);
    const { rerender } = render(
      <ChatInspectorLayout compact={false} panels={PANELS}>
        <Chat />
      </ChatInspectorLayout>,
      { wrapper }
    );
    rerender(
      <ChatInspectorLayout compact panels={PANELS}>
        <Chat />
      </ChatInspectorLayout>
    );
    rerender(
      <ChatInspectorLayout compact={false} panels={PANELS}>
        <Chat />
      </ChatInspectorLayout>
    );
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).not.toHaveBeenCalled();
  });

  it('mounts the chat once in a narrow container', async () => {
    restore = setElementWidth(600);
    const { container } = render(
      <ChatInspectorLayout defaultOpened={false} panels={PANELS}>
        <Chat />
      </ChatInspectorLayout>,
      { wrapper }
    );
    await waitFor(() => expect(container.querySelector('[data-compact]')).not.toBeNull());
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).not.toHaveBeenCalled();
  });

  it('falls back to the first panel when the active one is missing', async () => {
    restore = setElementWidth(1200);
    const { rerender } = render(
      <ChatInspectorLayout panels={[]}>
        <div>chat</div>
      </ChatInspectorLayout>,
      { wrapper }
    );
    rerender(
      <ChatInspectorLayout panels={PANELS}>
        <div>chat</div>
      </ChatInspectorLayout>
    );
    expect(await screen.findByText('diff review')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Changes' })).toHaveAttribute('aria-selected', 'true');

    rerender(
      <ChatInspectorLayout panels={[PANELS[1], { ...PANELS[0], id: 'renamed' }]}>
        <div>chat</div>
      </ChatInspectorLayout>
    );
    expect(screen.getByText('task list')).toBeInTheDocument();
  });

  it('opens the pane again when the host keeps a controlled inspector open', async () => {
    restore = setElementWidth(1200);
    const onOpenedChange = jest.fn();
    const { container } = render(
      <ChatInspectorLayout opened onOpenedChange={onOpenedChange} panels={PANELS}>
        <div>chat</div>
      </ChatInspectorLayout>,
      { wrapper }
    );
    await screen.findByText('diff review');
    expect(inspectorPane(container)).not.toHaveAttribute('data-collapsed');

    fireEvent.keyDown(screen.getByRole('separator'), { key: 'Enter' });
    expect(onOpenedChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(inspectorPane(container)).not.toHaveAttribute('data-collapsed'));
  });
});
