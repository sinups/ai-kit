import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Code, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import type { QuestionAnswer, QuestionConfig } from './QuestionPrompt';
import { QuestionTool, QuestionToolPart } from './QuestionTool';

export default { title: 'QuestionTool' };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Stack p={32} maw={420} gap={32}>
      {children}
    </Stack>
  );
}

function useAnswers() {
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const onSubmitAnswer = (answer: QuestionAnswer) => setAnswers((prev) => [...prev, answer]);
  return { answers, onSubmitAnswer };
}

export function Single() {
  const { answers, onSubmitAnswer } = useAnswers();
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: 'call_q1',
    state: 'input-available',
    input: {
      questions: [
        {
          kind: 'single',
          title: 'Which database should the service use?',
          options: [
            { id: 'postgres', label: 'PostgreSQL', description: '(recommended)' },
            { id: 'sqlite', label: 'SQLite' },
            { id: 'mysql', label: 'MySQL' },
          ],
          allowCustom: true,
          customPlaceholder: 'Something else…',
        },
      ],
      onSubmitAnswer,
    },
  };
  return (
    <Frame>
      <QuestionTool part={part} />
      <Code block>{JSON.stringify(answers, null, 2)}</Code>
    </Frame>
  );
}

export function Multi() {
  const { answers, onSubmitAnswer } = useAnswers();
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: 'call_q2',
    state: 'input-available',
    input: {
      questions: [
        {
          kind: 'multi',
          title: 'Which environments should get the migration?',
          options: [
            { id: 'dev', label: 'Development' },
            { id: 'staging', label: 'Staging' },
            { id: 'prod', label: 'Production', description: 'requires approval' },
          ],
          minSelections: 1,
          maxSelections: 2,
        },
      ],
      submitLabel: 'Apply',
      allowSkip: false,
      onSubmitAnswer,
    },
  };
  return (
    <Frame>
      <QuestionTool part={part} />
      <Code block>{JSON.stringify(answers, null, 2)}</Code>
    </Frame>
  );
}

export function Text() {
  const { answers, onSubmitAnswer } = useAnswers();
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: 'call_q3',
    state: 'input-available',
    input: {
      questions: [
        {
          kind: 'text',
          title: 'Describe the expected behaviour of the retry logic',
          placeholder: 'For example: retry 3 times with exponential backoff…',
        },
      ],
      onSubmitAnswer,
    },
  };
  return (
    <Frame>
      <QuestionTool part={part} />
      <Code block>{JSON.stringify(answers, null, 2)}</Code>
    </Frame>
  );
}

export function MultipleQuestions() {
  const { answers, onSubmitAnswer } = useAnswers();
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: 'call_q4',
    state: 'input-available',
    input: {
      questions: [
        {
          kind: 'single',
          title: 'Which package manager should I use?',
          options: [
            { id: 'yarn', label: 'yarn', description: '(already in repo)' },
            { id: 'pnpm', label: 'pnpm' },
          ],
        },
        {
          kind: 'multi',
          title: 'Which checks should run in CI?',
          options: [
            { id: 'tsc', label: 'Typecheck' },
            { id: 'lint', label: 'Lint' },
            { id: 'jest', label: 'Unit tests' },
          ],
        },
        {
          kind: 'text',
          title: 'Anything else I should know?',
        },
      ],
      onSubmitAnswer,
    },
  };
  return (
    <Frame>
      <QuestionTool part={part} />
      <Code block>{JSON.stringify(answers, null, 2)}</Code>
    </Frame>
  );
}

export function Answered() {
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: 'call_q5',
    state: 'output-available',
    input: {
      questions: [
        {
          kind: 'single',
          title: 'Which database should the service use?',
          options: [
            { id: 'postgres', label: 'PostgreSQL' },
            { id: 'sqlite', label: 'SQLite' },
          ],
        },
      ],
    },
    output: { answer: { kind: 'single', selectedIds: ['postgres'] } },
  };
  return (
    <Frame>
      <QuestionTool part={part} />
    </Frame>
  );
}

const LAYOUT_QUESTION: QuestionConfig = {
  kind: 'single',
  title: 'How should the settings page lay out sections?',
  options: [
    {
      id: 'tabs',
      label: 'Tabs',
      description: 'one section at a time',
      preview: {
        kind: 'code',
        language: 'tsx',
        content:
          '<Tabs defaultValue="general">\n  <Tabs.List>\n    <Tabs.Tab value="general">General</Tabs.Tab>\n    <Tabs.Tab value="models">Models</Tabs.Tab>\n  </Tabs.List>\n</Tabs>',
      },
    },
    {
      id: 'sidebar',
      label: 'Sidebar navigation',
      preview: {
        kind: 'markdown',
        content:
          '**Sidebar navigation**\n\n- Sections listed on the left\n- Content on the right\n- Collapses into a select on narrow screens',
      },
    },
    {
      id: 'single-page',
      label: 'Single long page',
      preview: {
        kind: 'markdown',
        content:
          'All sections stacked with anchors. Simple, but hard to scan with **20+ settings**.',
      },
    },
  ],
  allowNotes: true,
};

function BothWidths({ render }: { render: () => React.ReactNode }) {
  return (
    <Stack gap={0}>
      <WidthFrame width={NARROW_WIDTH}>{render()}</WidthFrame>
      <WidthFrame width={WIDE_WIDTH}>{render()}</WidthFrame>
    </Stack>
  );
}

function ToolDemo({ questions, review }: { questions: QuestionConfig[]; review?: boolean }) {
  const [result, setResult] = useState<unknown>(null);
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId: `call_${questions.length}_${review ? 'review' : 'plain'}`,
    state: 'input-available',
    input: {
      questions,
      review,
      onSubmitAnswer: (answer) => setResult(answer),
      onSubmitAnswers: (answers) => setResult(answers),
    },
  };
  return (
    <Stack gap={12}>
      <QuestionTool part={part} />
      {result !== null && <Code block>{JSON.stringify(result, null, 2)}</Code>}
    </Stack>
  );
}

export function WithPreview() {
  return (
    <BothWidths
      render={() => <ToolDemo questions={[{ ...LAYOUT_QUESTION, allowNotes: false }]} />}
    />
  );
}

export function WithNotes() {
  return (
    <BothWidths
      render={() => (
        <ToolDemo
          questions={[
            {
              kind: 'multi',
              title: 'Which checks should run before merge?',
              options: [
                { id: 'lint', label: 'Lint' },
                { id: 'types', label: 'Type check' },
                { id: 'e2e', label: 'End-to-end tests', description: 'slow' },
              ],
              allowNotes: true,
              notesPlaceholder: 'Anything the agent should know?',
            },
          ]}
        />
      )}
    />
  );
}

export function ReviewStep() {
  return (
    <BothWidths
      render={() => (
        <ToolDemo
          review
          questions={[
            LAYOUT_QUESTION,
            {
              kind: 'single',
              title: 'Where should secrets be stored?',
              options: [
                { id: 'env', label: 'Environment variables' },
                { id: 'vault', label: 'Vault', description: '(recommended)' },
              ],
            },
            { kind: 'text', title: 'Anything else to keep in mind?', allowNotes: false },
          ]}
        />
      )}
    />
  );
}

type FlowArgs = {
  onSubmitAnswer: (answer: QuestionAnswer) => void;
  onSubmitAnswers: (answers: Record<number, QuestionAnswer>) => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

const DATABASE_QUESTION: QuestionConfig = {
  kind: 'single',
  title: 'Which database should the service use?',
  options: [
    { id: 'postgres', label: 'PostgreSQL', description: '(recommended)' },
    { id: 'sqlite', label: 'SQLite' },
  ],
  allowCustom: true,
};

function FlowTool({
  args,
  questions,
  review,
  toolCallId,
}: {
  args: FlowArgs;
  questions: QuestionConfig[];
  review?: boolean;
  toolCallId: string;
}) {
  const part: QuestionToolPart = {
    type: 'tool-AskUserQuestion',
    toolCallId,
    state: 'input-available',
    input: {
      questions,
      review,
      onSubmitAnswer: args.onSubmitAnswer,
      onSubmitAnswers: args.onSubmitAnswers,
    },
  };
  return <QuestionTool part={part} />;
}

const flowArgs = () => ({ onSubmitAnswer: fn(), onSubmitAnswers: fn() });

export const SelectFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Frame>
      <FlowTool args={args} questions={[DATABASE_QUESTION]} toolCallId="flow-select" />
    </Frame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const send = canvas.getByRole('button', { name: 'Send' });
    await expect(send).toBeDisabled();
    await userEvent.click(canvas.getByRole('button', { name: /SQLite/ }));
    await userEvent.click(send);
    await expect(args.onSubmitAnswer).toHaveBeenCalledWith({
      kind: 'single',
      selectedIds: ['sqlite'],
      text: undefined,
    });
    await expect(await canvas.findByText('SQLite')).toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Send' })).not.toBeInTheDocument();
  },
};

export const CustomAnswerFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Frame>
      <FlowTool args={args} questions={[DATABASE_QUESTION]} toolCallId="flow-custom" />
    </Frame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByPlaceholderText('Type your answer'), 'MongoDB');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSubmitAnswer).toHaveBeenCalledWith({
      kind: 'single',
      selectedIds: [],
      text: 'MongoDB',
    });
    await expect(await canvas.findByText('MongoDB')).toBeInTheDocument();
  },
};

export const NotesFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Frame>
      <FlowTool
        args={args}
        questions={[{ ...DATABASE_QUESTION, allowCustom: false, allowNotes: true }]}
        toolCallId="flow-notes"
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /PostgreSQL/ }));
    await userEvent.type(canvas.getByLabelText('Add a note (optional)'), ' only for local dev ');
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }));
    await expect(args.onSubmitAnswer).toHaveBeenCalledWith({
      kind: 'single',
      selectedIds: ['postgres'],
      text: undefined,
      notes: 'only for local dev',
    });
    await expect(await canvas.findByText(/only for local dev/)).toBeInTheDocument();
  },
};

const PREVIEW_QUESTION: QuestionConfig = { ...LAYOUT_QUESTION, allowNotes: false };

export const PreviewFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Stack gap={0}>
      <WidthFrame width={NARROW_WIDTH}>
        <div data-frame="narrow">
          <FlowTool args={args} questions={[PREVIEW_QUESTION]} toolCallId="flow-preview-narrow" />
        </div>
      </WidthFrame>
      <WidthFrame width={WIDE_WIDTH}>
        <div data-frame="wide">
          <FlowTool args={args} questions={[PREVIEW_QUESTION]} toolCallId="flow-preview-wide" />
        </div>
      </WidthFrame>
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext) => {
    const wideFrame = canvasElement.querySelector('[data-frame="wide"]') as HTMLElement;
    const narrowFrame = canvasElement.querySelector('[data-frame="narrow"]') as HTMLElement;
    const wide = within(wideFrame);
    const narrow = within(narrowFrame);

    await waitFor(() => expect(wideFrame.querySelector('[data-wide-preview]')).not.toBeNull());
    await expect(wideFrame.querySelector('[data-preview]')).toHaveAttribute('data-preview', 'tabs');
    await userEvent.hover(wide.getByRole('button', { name: /Sidebar navigation/ }));
    await waitFor(() =>
      expect(wideFrame.querySelector('[data-preview]')).toHaveAttribute('data-preview', 'sidebar')
    );
    await userEvent.click(wide.getByRole('button', { name: /Single long page/ }));
    await waitFor(() =>
      expect(wideFrame.querySelector('[data-preview]')).toHaveAttribute(
        'data-preview',
        'single-page'
      )
    );

    await expect(narrowFrame.querySelector('[data-wide-preview]')).toBeNull();
    const option = narrow.getByRole('button', { name: /Sidebar navigation/ });
    await userEvent.click(option);
    await waitFor(() =>
      expect(option.nextElementSibling).toHaveAttribute('data-preview', 'sidebar')
    );
  },
};

export const ReviewFlow = {
  args: flowArgs(),
  render: (args: FlowArgs) => (
    <Frame>
      <FlowTool
        args={args}
        review
        questions={[
          { ...DATABASE_QUESTION, allowCustom: false },
          { kind: 'text', title: 'Anything else I should know?' },
        ]}
        toolCallId="flow-review"
      />
    </Frame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /PostgreSQL/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByRole('button', { name: 'Question 1, answered' })).toBeInTheDocument();
    await userEvent.type(canvas.getByPlaceholderText('Type your answer'), 'Keep migrations');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));

    await expect(await canvas.findByText('Check your answers')).toBeInTheDocument();
    await expect(args.onSubmitAnswers).not.toHaveBeenCalled();

    await userEvent.click(canvas.getAllByRole('button', { name: 'Change' })[0]);
    await userEvent.click(canvas.getByRole('button', { name: /SQLite/ }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('SQLite')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Send answers' }));
    await expect(args.onSubmitAnswers).toHaveBeenCalledWith({
      1: { kind: 'single', selectedIds: ['sqlite'], text: undefined },
      2: { kind: 'text', text: 'Keep migrations' },
    });
    await expect(canvas.queryByText('Check your answers')).not.toBeInTheDocument();
  },
};
