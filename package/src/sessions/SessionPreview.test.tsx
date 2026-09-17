import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { SessionPreview } from './SessionPreview';
import type { SessionSummary } from './types';

const NOW = new Date(2026, 8, 17, 12, 0);

const SESSION: SessionSummary = {
  id: 's1',
  title: 'Fix login retry',
  createdAt: new Date(2026, 8, 17, 9),
  updatedAt: new Date(2026, 8, 17, 10),
  messageCount: 3,
  model: 'qwen-2.5-coder-32b',
  branch: 'fix/login',
  tokenCount: 12_500,
  cost: 0.5,
};

const MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'First question' }] },
  { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'First answer' }] },
  { id: 'm3', role: 'user', parts: [{ type: 'text', text: 'Second question' }] },
];

describe('sessions/SessionPreview', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('renders metadata, the first messages and a hidden count', () => {
    render(<SessionPreview session={SESSION} messages={MESSAGES} maxMessages={2} now={NOW} />);

    expect(screen.getByRole('heading', { name: 'Fix login retry' })).toBeInTheDocument();
    expect(screen.getByText('Updated 2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('3 messages')).toBeInTheDocument();
    expect(screen.getByText('12,500 tokens')).toBeInTheDocument();
    expect(screen.getByText('$0.50')).toBeInTheDocument();
    expect(screen.getByText('fix/login')).toBeInTheDocument();
    expect(screen.getByText('First question')).toBeInTheDocument();
    expect(screen.getByText('First answer')).toBeInTheDocument();
    expect(screen.queryByText('Second question')).not.toBeInTheDocument();
    expect(screen.getByText('1 more message')).toBeInTheDocument();
  });

  it('calls resume and export with the session', async () => {
    const onResume = jest.fn();
    const onExport = jest.fn();
    render(
      <SessionPreview
        session={SESSION}
        messages={MESSAGES}
        now={NOW}
        onResume={onResume}
        onExport={onExport}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(onResume).toHaveBeenCalledWith(SESSION);
    expect(onExport).toHaveBeenCalledWith(SESSION);
  });

  it('shows the error with retry instead of messages', async () => {
    const onRetry = jest.fn();
    render(
      <SessionPreview
        session={SESSION}
        messages={MESSAGES}
        now={NOW}
        error="Failed"
        onRetry={onRetry}
      />
    );

    expect(screen.queryByText('First question')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
