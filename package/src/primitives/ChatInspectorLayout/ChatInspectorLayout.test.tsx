import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../_testing/element-width';
import { ChatInspectorLayout } from './ChatInspectorLayout';

const PANELS = [
  { id: 'changes', label: 'Changes', content: <div>diff review</div> },
  { id: 'tasks', label: 'Tasks', content: <div>task list</div> },
];

describe('primitives/ChatInspectorLayout', () => {
  let restore: () => void;
  beforeEach(() => {
    restore = setElementWidth(1200);
  });
  afterEach(() => restore());

  it('renders the chat next to the inspector and switches panels', async () => {
    render(
      <ChatInspectorLayout panels={PANELS}>
        <div>chat</div>
      </ChatInspectorLayout>
    );

    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Inspector' })).toBeInTheDocument();
    expect(screen.getByText('diff review')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Tasks' }));
    expect(screen.getByText('task list')).toBeInTheDocument();
    expect(screen.queryByText('diff review')).not.toBeInTheDocument();
  });

  it('renders a single inspector without tabs', async () => {
    render(
      <ChatInspectorLayout inspector={<div>diff review</div>} labels={{ inspector: 'Panel' }}>
        <div>chat</div>
      </ChatInspectorLayout>
    );

    expect(await screen.findByRole('region', { name: 'Panel' })).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('moves the inspector into a drawer in compact mode', () => {
    const { rerender } = render(
      <ChatInspectorLayout compact opened={false} inspector={<div>diff review</div>}>
        <div>chat</div>
      </ChatInspectorLayout>
    );

    expect(screen.getByText('chat')).toBeInTheDocument();
    expect(screen.queryByText('diff review')).not.toBeInTheDocument();

    rerender(
      <ChatInspectorLayout compact opened inspector={<div>diff review</div>}>
        <div>chat</div>
      </ChatInspectorLayout>
    );
    expect(screen.getByText('diff review')).toBeInTheDocument();
  });
});
