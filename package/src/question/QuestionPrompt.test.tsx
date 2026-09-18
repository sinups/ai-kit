import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../primitives/_testing/element-width';
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

describe('question/QuestionPrompt previews and notes', () => {
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
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('reports skip through onSubmit when no onSkip handler is given', async () => {
    const onSubmit = jest.fn();
    render(
      <QuestionPrompt questions={[{ kind: 'text', title: 'Anything else?' }]} onSubmit={onSubmit} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Skip' }));
    expect(onSubmit).toHaveBeenCalledWith({ kind: 'skip' });
  });

  it('allows submitting a multi question with minSelections 0', () => {
    render(
      <QuestionPrompt
        questions={[{ ...MULTI, minSelections: 0 }]}
        onSubmit={() => {}}
        submitLabel="Send"
      />
    );
    expect(screen.getByRole('button', { name: 'Send' })).not.toBeDisabled();
  });

  it('shows Next instead of Send when more questions follow', () => {
    render(<QuestionPrompt questions={[SINGLE, MULTI]} questionIndex={1} onSubmit={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send' })).toBeNull();
  });
});

const PREVIEW: QuestionConfig = {
  kind: 'single',
  title: 'Pick a layout',
  options: [
    { id: 'grid', label: 'Grid', preview: { kind: 'markdown', content: 'Grid preview' } },
    { id: 'list', label: 'List', preview: { kind: 'markdown', content: 'List preview' } },
  ],
};

describe('question/QuestionPrompt', () => {
  let restore: () => void = () => {};
  afterEach(() => restore());

  it('shows the preview beside the options when wide', async () => {
    restore = setElementWidth(900);
    const { container } = render(<QuestionPrompt questions={[PREVIEW]} onSubmit={() => {}} />);

    expect(await screen.findByText('Grid preview')).toBeInTheDocument();
    expect(container.querySelector('[data-wide-preview]')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /List/ }));
    expect(screen.getByText('List preview')).toBeInTheDocument();
    expect(screen.queryByText('Grid preview')).not.toBeInTheDocument();
  });

  it('shows the preview under the chosen option when narrow', async () => {
    restore = setElementWidth(360);
    const { container } = render(<QuestionPrompt questions={[PREVIEW]} onSubmit={() => {}} />);

    expect(container.querySelector('[data-wide-preview]')).toBeNull();
    expect(screen.queryByText('Grid preview')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /List/ }));
    const preview = (await screen.findByText('List preview')).closest('[data-preview]');
    expect(preview).toHaveAttribute('data-preview', 'list');
    expect(screen.getByRole('button', { name: /List/ }).nextElementSibling).toBe(preview);
  });

  it('sends notes with the answer', async () => {
    const onSubmit = jest.fn();
    render(<QuestionPrompt questions={[{ ...SINGLE, allowNotes: true }]} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole('button', { name: /SQLite/ }));
    await userEvent.type(screen.getByLabelText('Add a note (optional)'), ' local only ');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledWith({
      kind: 'single',
      selectedIds: ['sqlite'],
      text: undefined,
      notes: 'local only',
    });
  });

  it('takes the actions and placeholders from labels', () => {
    render(
      <QuestionPrompt
        questions={[{ kind: 'text', title: 'Anything else?', allowNotes: true }]}
        onSubmit={() => {}}
        labels={{
          submit: 'Senden',
          skip: 'Überspringen',
          answerPlaceholder: 'Antwort eingeben',
          notesPlaceholder: 'Notiz',
        }}
      />
    );
    expect(screen.getByText('Senden')).toBeInTheDocument();
    expect(screen.getByText('Überspringen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Antwort eingeben')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Notiz')).toBeInTheDocument();
  });
});
