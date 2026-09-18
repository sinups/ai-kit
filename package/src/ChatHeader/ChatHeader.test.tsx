import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader', () => {
  it('renders the title as a heading with the sections around it', () => {
    render(
      <ChatHeader
        title="Release notes for 0.3"
        subtitle="claude-opus-5 · acme workspace"
        leftSection={<button type="button">Back</button>}
        secondarySection={<span>3 servers</span>}
        rightSection={<button type="button">Open panel</button>}
      />
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Release notes for 0.3' })).toBeVisible();
    expect(screen.getByText('claude-opus-5 · acme workspace')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Back' })).toBeVisible();
    expect(screen.getByText('3 servers')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Open panel' })).toBeVisible();
  });

  it('takes the heading level, the label and turns the collapse off', () => {
    render(
      <ChatHeader
        title="Support chat"
        titleOrder={1}
        collapseSecondary={false}
        withBorder={false}
        labels={{ header: 'Conversation' }}
      />
    );

    const header = screen.getByLabelText('Conversation');
    expect(screen.getByRole('heading', { level: 1, name: 'Support chat' })).toBeVisible();
    expect(header).not.toHaveAttribute('data-collapse-secondary');
    expect(header).not.toHaveAttribute('data-with-border');
  });

  it('collapses the secondary content by default and drops empty sections', () => {
    render(<ChatHeader title="Support chat" />);

    const header = screen.getByLabelText('Chat header');
    expect(header).toHaveAttribute('data-collapse-secondary', 'true');
    expect(header).toHaveAttribute('data-with-border', 'true');
    expect(header.querySelectorAll('div')).toHaveLength(1);
  });
});
