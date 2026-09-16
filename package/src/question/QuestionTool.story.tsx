import React, { useState } from 'react';
import { Code, Stack } from '@mantine/core';
import type { QuestionAnswer } from './QuestionPrompt';
import { QuestionTool, QuestionToolPart } from './QuestionTool';

export default { title: 'QuestionTool' };

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Stack p="xl" maw={420} gap="xl">
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
