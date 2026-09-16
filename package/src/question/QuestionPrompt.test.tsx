import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { QuestionConfig, QuestionPrompt } from './QuestionPrompt';

const SINGLE: QuestionConfig = {
  kind: 'single',
  title: 'Pick a database',
  options: [
    { id: 'postgres', label: 'PostgreSQL' },
    { id: 'sqlite', label: 'SQLite' },
  ],
};

const MULTI: QuestionConfig = {
  kind: 'multi',
  title: 'Pick environments',
  options: [
    { id: 'dev', label: 'Development' },
    { id: 'staging', label: 'Staging' },
    { id: 'prod', label: 'Production' },
  ],
  maxSelections: 2,
};

describe('QuestionPrompt', () => {
  it('disables Send until an option is chosen, then submits the selection', async () => {
    const onSubmit = jest.fn();
    render(<QuestionPrompt questions={[SINGLE]} onSubmit={onSubmit} />);

    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /SQLite/ }));
    expect(send).toBeEnabled();

    await userEvent.click(send);
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'single',
      selectedIds: ['sqlite'],
      text: undefined,
    });
  });

  it('toggles options in multi mode and respects maxSelections', async () => {
    const onSubmit = jest.fn();
    render(<QuestionPrompt questions={[MULTI]} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /Development/ }));
    await userEvent.click(screen.getByRole('button', { name: /Staging/ }));
    await userEvent.click(screen.getByRole('button', { name: /Production/ }));
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Production/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'multi',
      selectedIds: ['dev', 'staging'],
      text: undefined,
    });
  });

  it('submits custom text for allowCustom questions', async () => {
    const onSubmit = jest.fn();
    render(<QuestionPrompt questions={[{ ...SINGLE, allowCustom: true }]} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByPlaceholderText('Type your answer'), 'MongoDB');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'single', selectedIds: [], text: 'MongoDB' });
  });

  it('submits trimmed free text and reports skip', async () => {
    const onSubmit = jest.fn();
    const onSkip = jest.fn();
    render(
      <QuestionPrompt
        questions={[{ kind: 'text', title: 'Anything else?' }]}
        onSubmit={onSubmit}
        onSkip={onSkip}
      />
    );

    await userEvent.type(screen.getByPlaceholderText('Type your answer'), '  nope  ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'text', text: 'nope' });

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onSkip).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenLastCalledWith({ kind: 'skip' });
  });

  it('shows Next instead of Send when more questions follow', () => {
    render(<QuestionPrompt questions={[SINGLE, MULTI]} questionIndex={1} onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });
});
