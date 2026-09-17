import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AgentMessage } from './AgentMessage';

describe('tasks/AgentMessage', () => {
  it('shows sender, recipient, time and expands the content', async () => {
    render(
      <AgentMessage
        message={{
          id: 'm1',
          from: { name: 'tests', color: 'teal' },
          to: { name: 'reviewer', color: 'grape' },
          summary: '2 tests fail',
          content: 'Expected 129.6, received 132',
          timestamp: new Date(2026, 8, 17, 14, 5),
        }}
        formatTime={(date) => `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`}
      />
    );

    expect(screen.getByText('tests')).toBeInTheDocument();
    expect(screen.getByText('reviewer')).toBeInTheDocument();
    expect(screen.getByText('14:05')).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show message' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Hide message' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('renders a broadcast without a toggle when there is no extra content', () => {
    render(
      <AgentMessage
        message={{ id: 'm2', from: { name: 'lead' }, summary: 'Wrap up in 5 minutes' }}
        labels={{ broadcast: 'all agents' }}
      />
    );
    expect(screen.getByText('all agents')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
