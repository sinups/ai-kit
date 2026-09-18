import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { AgentChat } from './AgentChat';
import { ChatWelcome } from './ChatWelcome';
import { DEFAULT_STARTER_CATEGORIES_LABELS, StarterCategories } from './StarterCategories';

const categories = [
  {
    id: 'code',
    label: 'Code',
    starters: [
      { id: 'tests', label: 'Write tests for a file' },
      { id: 'review', label: 'Review my branch', value: 'Review the changes in my branch.' },
    ],
  },
  { id: 'docs', label: 'Docs', starters: [{ id: 'readme', label: 'Draft a README' }] },
];

describe('AgentChat/StarterCategories', () => {
  it('starts on the first category and switches the starters', async () => {
    const user = userEvent.setup({ delay: null });
    const onSelect = jest.fn();
    render(<StarterCategories categories={categories} onSelect={onSelect} />);

    expect(screen.getByRole('group', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Code' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Write tests for a file' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Docs' }));
    expect(screen.getByRole('button', { name: 'Docs' })).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.queryByRole('button', { name: 'Write tests for a file' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Draft a README' }));
    expect(onSelect).toHaveBeenCalledWith(categories[1].starters[0]);
  });

  it('works controlled and clears the pick on a second click', async () => {
    const user = userEvent.setup({ delay: null });
    const onChange = jest.fn();
    render(
      <StarterCategories
        categories={categories}
        value="code"
        onChange={onChange}
        onSelect={() => {}}
      />
    );
    const code = screen.getByRole('button', { name: 'Code' });
    expect(code).toHaveAttribute('aria-controls', expect.any(String));
    await user.click(code);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('keeps the English default and takes labels', () => {
    expect(DEFAULT_STARTER_CATEGORIES_LABELS.categories).toBe('Categories');
    render(
      <StarterCategories
        categories={categories}
        defaultValue={null}
        onSelect={() => {}}
        labels={{ categories: 'Темы' }}
      />
    );
    expect(screen.getByRole('group', { name: 'Темы' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Write tests for a file' })
    ).not.toBeInTheDocument();
  });
});

describe('AgentChat/ChatWelcome content', () => {
  it('renders host content under the greeting', () => {
    render(<ChatWelcome title="Hello" content={<p>Pick a topic</p>} />);
    expect(screen.getByText('Pick a topic')).toBeInTheDocument();
  });
});

describe('AgentChat emptyState.content spacing', () => {
  it('puts host content in a spaced container in both layouts', () => {
    const chat = (layout: 'center' | 'welcome') => (
      <AgentChat
        messages={[]}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        emptyState={{ layout, title: 'Hi', content: <p>Pick a topic</p> }}
      />
    );
    const { rerender } = render(chat('center'));
    expect(screen.getByText('Pick a topic').parentElement).toHaveClass('emptyStateContent');
    rerender(chat('welcome'));
    expect(screen.getByText('Pick a topic').parentElement).toHaveClass('hostContent');
  });
});
