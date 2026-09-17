import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { QuestionConfig } from './QuestionPrompt';
import { QuestionTool, type QuestionToolPart } from './QuestionTool';

const QUESTIONS: QuestionConfig[] = [
  {
    kind: 'single',
    title: 'Pick a database',
    options: [
      { id: 'postgres', label: 'PostgreSQL' },
      { id: 'sqlite', label: 'SQLite' },
    ],
  },
  { kind: 'text', title: 'Anything else?' },
];

function createPart(input: Partial<NonNullable<QuestionToolPart['input']>>): QuestionToolPart {
  return {
    type: 'tool-Question',
    toolCallId: 'q1',
    state: 'input-available',
    input: { questions: QUESTIONS, ...input },
  };
}

describe('QuestionTool', () => {
  it('hides the question navigation unless progress or review is enabled', () => {
    render(<QuestionTool part={createPart({})} />);
    expect(screen.queryByRole('navigation', { name: 'Questions' })).not.toBeInTheDocument();
  });

  it('marks answered questions and lets the user return to them', async () => {
    render(<QuestionTool part={createPart({ showProgress: true })} />);

    const nav = screen.getByRole('navigation', { name: 'Questions' });
    expect(screen.getByRole('button', { name: 'Question 1' })).toHaveAttribute(
      'aria-current',
      'step'
    );
    expect(screen.getByRole('button', { name: 'Question 2' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /PostgreSQL/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Anything else?')).toBeInTheDocument();
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Question 1, answered' }));

    await userEvent.click(screen.getByRole('button', { name: 'Question 1, answered' }));
    expect(screen.getByText('Pick a database')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PostgreSQL/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('shows a review step, allows changing an answer and submits all answers', async () => {
    const onSubmitAnswers = jest.fn();
    render(<QuestionTool part={createPart({ review: true, onSubmitAnswers })} />);

    await userEvent.click(screen.getByRole('button', { name: /PostgreSQL/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    await userEvent.type(screen.getByPlaceholderText('Type your answer'), 'No');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByText('Check your answers')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(onSubmitAnswers).not.toHaveBeenCalled();

    await userEvent.click(screen.getAllByRole('button', { name: 'Change' })[0]);
    await userEvent.click(screen.getByRole('button', { name: /SQLite/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('SQLite')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Send answers' }));
    expect(onSubmitAnswers).toHaveBeenCalledWith({
      1: { kind: 'single', selectedIds: ['sqlite'], text: undefined },
      2: { kind: 'text', text: 'No' },
    });
    expect(screen.queryByText('Check your answers')).not.toBeInTheDocument();
    expect(screen.getByText('1: SQLite • 2: No')).toBeInTheDocument();
  });
});
