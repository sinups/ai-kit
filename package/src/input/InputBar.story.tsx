import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Box, Button, Code, Stack, Text } from '@mantine/core';
import {
  IconBolt,
  IconBug,
  IconFileText,
  IconListCheck,
  IconMessage2,
  IconUser,
} from '@tabler/icons-react';
import { AgentModeIcon, PlanModeIcon } from '../icons/mode-icons';
import type { AttachedFile, AttachedImage, ChatStatus, ModelOption } from '../types';
import type { QuestionConfig } from '../question/QuestionPrompt';
import { InputBar, QueuedMessage } from './InputBar';
import { ModelPicker } from './ModelPicker';
import { ModeSelector, ModeOption } from './ModeSelector';
import type { CompletionItem, CompletionSource } from './use-completion-items';

export default { title: 'Input/InputBar' };

const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="steelblue"/><circle cx="100" cy="100" r="60" fill="white"/></svg>';
const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(IMAGE_SVG)}`;

const MODELS: ModelOption[] = [
  { id: 'deepseek-v3', name: 'DeepSeek', version: 'V3' },
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', version: '32B' },
  { id: 'llama-3.3-70b', name: 'Llama 3.3', version: '70B' },
];

const MODES: ModeOption[] = [
  { id: 'agent', label: 'Agent', icon: AgentModeIcon, description: 'Edit files and run commands' },
  { id: 'plan', label: 'Plan', icon: PlanModeIcon, description: 'Read-only, produce a plan first' },
];

const QUESTIONS: QuestionConfig[] = [
  {
    kind: 'single',
    title: 'Which package manager should I use?',
    options: [
      { id: 'yarn', label: 'yarn', description: '(already in repo)' },
      { id: 'pnpm', label: 'pnpm' },
      { id: 'npm', label: 'npm' },
    ],
    allowCustom: true,
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
];

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Stack p={32} maw={520} gap={32}>
      {children}
    </Stack>
  );
}

function Log({ lines }: { lines: string[] }) {
  return <Code block>{lines.join('\n') || 'events…'}</Code>;
}

function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const onLog = (line: string) => setLines((prev) => [...prev.slice(-5), line]);
  return { lines, onLog };
}

export function Usage() {
  const { lines, onLog } = useLog();
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={(m) => onLog(`send: ${m.content}`)}
        onStop={() => onLog('stop')}
        onAttach={() => onLog('attach')}
        autoFocus
      />
      <Log lines={lines} />
    </Frame>
  );
}

export function WithAttachments() {
  const [images, setImages] = useState<AttachedImage[]>([
    { id: 'img-1', filename: 'screenshot.png', url: IMAGE_URL, size: 24_512 },
    { id: 'img-2', filename: 'diagram.png', url: IMAGE_URL, size: 118_004 },
  ]);
  const [files, setFiles] = useState<AttachedFile[]>([
    { id: 'f-1', filename: 'package.json', size: 1_204 },
    { id: 'f-2', filename: 'tool-registry.ts', size: 8_930 },
    { id: 'f-3', filename: 'README.md' },
  ]);
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        onAttach={() => {}}
        attachedImages={images}
        attachedFiles={files}
        onRemoveImage={(id) => setImages((prev) => prev.filter((i) => i.id !== id))}
        onRemoveFile={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
      />
      <InputBar status="ready" onSend={() => {}} onStop={() => {}} onAttach={() => {}} isDragOver />
    </Frame>
  );
}

export function WithInfoBar() {
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        infoBar={{
          title: 'Free plan',
          description: '3 of 10 messages left today.',
          onClose: () => {},
          action: { label: 'Upgrade', onClick: () => {} },
        }}
      />
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        infoBar={{
          description: 'Context is 80% full. Older messages will be summarized.',
          position: 'bottom',
          onClose: () => {},
        }}
      />
    </Frame>
  );
}

export function WithQuestionBar() {
  const { lines, onLog } = useLog();
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={(m) => onLog(`send: ${m.content}`)}
        onStop={() => {}}
        questionBar={{
          id: 'q-1',
          questions: QUESTIONS,
          onSubmit: (answer) => onLog(`answer: ${JSON.stringify(answer)}`),
          onSkip: () => onLog('skip'),
        }}
      />
      <Log lines={lines} />
    </Frame>
  );
}

export function Streaming() {
  const [status, setStatus] = useState<ChatStatus>('streaming');
  return (
    <Frame>
      <InputBar
        status={status}
        onSend={() => setStatus('streaming')}
        onStop={() => setStatus('ready')}
        onAttach={() => {}}
        value="Refactor the tool registry to support MCP prefixes"
        onChange={() => {}}
      />
      <InputBar status="ready" onSend={() => {}} onStop={() => {}} disabled />
    </Frame>
  );
}

export function WithPickers() {
  const [model, setModel] = useState('deepseek-v3');
  const [mode, setMode] = useState('agent');
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        onAttach={() => {}}
        leftActions={
          <>
            <ModeSelector modes={MODES} value={mode} onChange={setMode} />
            <ModelPicker models={MODELS} value={model} onChange={setModel} />
          </>
        }
      />
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        rightActions={<ModeSelector modes={[MODES[0]]} />}
      />
    </Frame>
  );
}

export function WithSuggestions() {
  const { lines, onLog } = useLog();
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={(m) => onLog(`send: ${m.content}`)}
        onStop={() => {}}
        suggestions={[
          { id: 's-1', label: 'Explain this repo', icon: <IconFileText size={14} /> },
          { id: 's-2', label: 'Find flaky tests', icon: <IconBug size={14} /> },
          {
            id: 's-3',
            label: 'Speed up CI',
            value: 'Analyze the CI pipeline and propose ways to make it faster',
            icon: <IconBolt size={14} />,
          },
        ]}
      />
      <Log lines={lines} />
    </Frame>
  );
}

export function TypingAnimation() {
  const [active, setActive] = useState(true);
  return (
    <Frame>
      <InputBar
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        typingAnimation={{
          text: 'Add a dark mode toggle to the settings page',
          duration: 3000,
          image: IMAGE_URL,
          isActive: active,
          onComplete: () => setActive(false),
        }}
      />
      <Button
        variant="default"
        size="xs"
        onClick={() => setActive(true)}
        style={{ alignSelf: 'flex-start' }}
      >
        Replay
      </Button>
    </Frame>
  );
}

TypingAnimation.tags = ['skip-visual'];

const COMMANDS: CompletionItem[] = [
  {
    value: 'review',
    label: '/review',
    description: 'Review the current diff',
    icon: <IconListCheck size={14} />,
    group: 'Commands',
  },
  {
    value: 'compact',
    label: '/compact',
    description: 'Summarize the conversation to free context',
    icon: <IconMessage2 size={14} />,
    group: 'Commands',
  },
  {
    value: 'bug',
    label: '/bug',
    description: 'Report a problem with the last answer',
    icon: <IconBug size={14} />,
    group: 'Feedback',
  },
];

const PEOPLE = ['alice', 'bob', 'carol', 'dmitry'];

function searchPeople(query: string): Promise<CompletionItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        PEOPLE.filter((name) => name.startsWith(query.toLowerCase())).map((name) => ({
          value: name,
          label: name,
          icon: <IconUser size={14} />,
        }))
      );
    }, 150);
  });
}

function WidthFrame({ width, children }: { width: number; children: React.ReactNode }) {
  return (
    <Stack p={32} gap={10}>
      <Text size="xs" c="dimmed">
        {width}px
      </Text>
      <Box w={width} maw="100%" style={{ '--ae-max-width': '100%' } as React.CSSProperties}>
        {children}
      </Box>
    </Stack>
  );
}

function CompletionsDemo({ width }: { width: number }) {
  const { lines, onLog } = useLog();
  const completions: CompletionSource[] = [
    { trigger: '/', items: COMMANDS, onSelect: (item) => onLog(`command: ${item.value}`) },
    { trigger: '@', items: searchPeople, onSelect: (item) => onLog(`mention: ${item.value}`) },
  ];
  return (
    <WidthFrame width={width}>
      <Stack gap={16}>
        <InputBar
          status="ready"
          placeholder="Type / for commands or @ to mention"
          onSend={(m) => onLog(`send: ${m.content}`)}
          onStop={() => onLog('stop')}
          completions={completions}
          autoFocus
        />
        <Log lines={lines} />
      </Stack>
    </WidthFrame>
  );
}

export function CompletionsNarrow() {
  return <CompletionsDemo width={360} />;
}

export function CompletionsWide() {
  return <CompletionsDemo width={900} />;
}

export function CompletionsFlow() {
  return <CompletionsDemo width={900} />;
}

CompletionsFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const textarea = canvas.getByPlaceholderText('Type / for commands or @ to mention');
  await userEvent.type(textarea, '/rev');
  const page = within(canvasElement.ownerDocument.body);
  await userEvent.click(await page.findByText('Review the current diff'));
  await waitFor(() => expect(textarea).toHaveValue('/review '));
  await expect(canvas.getByText('command: review')).toBeInTheDocument();
};

function QueueDemo({ width }: { width: number }) {
  const [status, setStatus] = useState<ChatStatus>('streaming');
  const [queue, setQueue] = useState<QueuedMessage[]>([
    { id: 'q-1', content: 'Then run the full test suite and fix anything that fails' },
    {
      id: 'q-2',
      content:
        'After that open a pull request with a short description of the change and link the related issue so reviewers have context',
    },
  ]);
  return (
    <WidthFrame width={width}>
      <Stack gap={16}>
        <InputBar
          status={status}
          onSend={() => {}}
          onStop={() => setStatus('ready')}
          onQueue={(m) =>
            setQueue((prev) => [...prev, { id: `q-${Date.now()}`, content: m.content }])
          }
          queuedMessages={queue}
          onRemoveQueued={(id) => setQueue((prev) => prev.filter((item) => item.id !== id))}
        />
        <Button size="xs" variant="default" onClick={() => setStatus('streaming')}>
          Restart streaming
        </Button>
      </Stack>
    </WidthFrame>
  );
}

export function QueueNarrow() {
  return <QueueDemo width={360} />;
}

export function QueueWide() {
  return <QueueDemo width={900} />;
}

const SAMPLE_LOG = Array.from(
  { length: 240 },
  (_, index) =>
    `2026-09-17T10:${String(Math.floor(index / 60)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}Z INFO request ${index + 1} handled in ${20 + (index % 17)}ms`
).join('\n');

const PROMPT_HISTORY = [
  'Explain how the retry policy in api/client.ts works',
  'Write tests for the date formatting helpers',
  'Why does the build fail on CI but not locally?\nThe error mentions a missing peer dependency.',
  'Refactor the settings page to use the SettingsLayout primitive',
  'Summarize the open pull requests that touch the input bar',
];

function ComposerDemo({ width }: { width: number }) {
  const [history, setHistory] = useState(PROMPT_HISTORY);
  const [sent, setSent] = useState('');
  const [copied, setCopied] = useState(false);
  return (
    <WidthFrame width={width}>
      <Stack gap={12}>
        <Text size="xs" c="dimmed">
          Paste 50+ lines to collapse them. ArrowUp in the empty field browses history, mod+R
          searches it.
        </Text>
        <Button
          size="xs"
          variant="default"
          onClick={() => {
            navigator.clipboard?.writeText(SAMPLE_LOG).then(() => setCopied(true));
          }}
        >
          {copied ? 'Copied 240 log lines, paste them into the field' : 'Copy a 240-line log'}
        </Button>
        <InputBar
          status="ready"
          onStop={() => {}}
          contentWidth="100%"
          history={history}
          onSend={(message) => {
            setSent(message.content);
            setHistory((prev) => [...prev, message.content]);
          }}
        />
        {sent && (
          <Code block mah={200}>
            {sent.length > 600 ? `${sent.slice(0, 600)}…` : sent}
          </Code>
        )}
      </Stack>
    </WidthFrame>
  );
}

export function ComposerNarrow() {
  return <ComposerDemo width={360} />;
}

export function ComposerWide() {
  return <ComposerDemo width={900} />;
}

type FlowArgs = {
  onSend: (message: { role: 'user'; content: string }) => void;
  onStop: () => void;
  onQueue: (message: { role: 'user'; content: string }) => void;
  onRemoveQueued: (id: string) => void;
  onSelect: (item: CompletionItem) => void;
  onRemoveContext: (id: string) => void;
  onRestoreContext: (id: string) => void;
};

type FlowContext = { canvasElement: HTMLElement; args: FlowArgs };

const PLACEHOLDER = 'Send a message...';

export const MentionFlow = {
  args: { onSend: fn(), onStop: fn(), onSelect: fn() },
  render: (args: FlowArgs) => (
    <WidthFrame width={600}>
      <InputBar
        status="ready"
        onSend={args.onSend}
        onStop={args.onStop}
        completions={[{ trigger: '@', items: searchPeople, onSelect: args.onSelect }]}
      />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(PLACEHOLDER);
    await userEvent.type(textarea, 'ask @b');
    const page = within(canvasElement.ownerDocument.body);
    await userEvent.click(await page.findByText('bob'));
    await waitFor(() => expect(textarea).toHaveValue('ask @bob '));
    await expect(args.onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: 'bob' }));
    await expect(args.onSend).not.toHaveBeenCalled();
  },
};

function QueueFlowDemo(args: FlowArgs) {
  const [queued, setQueued] = useState<QueuedMessage[]>([]);
  return (
    <WidthFrame width={600}>
      <InputBar
        status="streaming"
        onSend={args.onSend}
        onStop={args.onStop}
        onQueue={(message) => {
          args.onQueue(message);
          setQueued((current) => [
            ...current,
            { id: `q${current.length + 1}`, content: message.content },
          ]);
        }}
        queuedMessages={queued}
        onRemoveQueued={(id) => {
          args.onRemoveQueued(id);
          setQueued((current) => current.filter((item) => item.id !== id));
        }}
      />
    </WidthFrame>
  );
}

export const QueueFlow = {
  args: { onSend: fn(), onStop: fn(), onQueue: fn(), onRemoveQueued: fn() },
  render: (args: FlowArgs) => <QueueFlowDemo {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(PLACEHOLDER);
    await userEvent.type(textarea, 'Run the tests{Enter}');
    await expect(args.onQueue).toHaveBeenCalledWith({ role: 'user', content: 'Run the tests' });
    await expect(args.onSend).not.toHaveBeenCalled();
    await expect(textarea).toHaveValue('');
    await expect(await canvas.findByText('Run the tests')).toBeInTheDocument();
    await userEvent.click(canvas.getByLabelText('Remove queued message'));
    await expect(args.onRemoveQueued).toHaveBeenCalledWith('q1');
    await waitFor(() => expect(canvas.queryByText('Run the tests')).not.toBeInTheDocument());
  },
};

const CONTEXT_DOCUMENT = {
  id: 'doc-1',
  label: 'Project Documentation (Test)',
  icon: <IconFileText size={16} />,
  description: 'The page open next to the chat',
};

function ContextDemo(args: FlowArgs) {
  const [removed, setRemoved] = useState(false);
  return (
    <WidthFrame width={600}>
      <InputBar
        status="ready"
        onSend={args.onSend}
        onStop={args.onStop}
        contextItems={[{ ...CONTEXT_DOCUMENT, removed }]}
        onRemoveContext={(id) => {
          args.onRemoveContext(id);
          setRemoved(true);
        }}
        onRestoreContext={(id) => {
          args.onRestoreContext(id);
          setRemoved(false);
        }}
      />
    </WidthFrame>
  );
}

export const ContextFlow = {
  args: { onSend: fn(), onStop: fn(), onRemoveContext: fn(), onRestoreContext: fn() },
  render: (args: FlowArgs) => <ContextDemo {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Project Documentation (Test)' })
    );
    await expect(args.onRemoveContext).toHaveBeenCalledWith('doc-1');
    const restore = await canvas.findByRole('button', {
      name: 'Add back: Project Documentation (Test)',
    });
    await waitFor(() => expect(restore).toHaveFocus());
    await userEvent.click(restore);
    await expect(args.onRestoreContext).toHaveBeenCalledWith('doc-1');
    const remove = await canvas.findByRole('button', {
      name: 'Remove Project Documentation (Test)',
    });
    await waitFor(() => expect(remove).toHaveFocus());
  },
};

const LONG_PASTE = Array.from({ length: 60 }, (_, index) => `line ${index + 1}`).join('\n');

export const PasteFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: (args: FlowArgs) => (
    <WidthFrame width={600}>
      <InputBar status="ready" onSend={args.onSend} onStop={args.onStop} />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(PLACEHOLDER);
    await userEvent.click(textarea);
    await userEvent.paste('Explain this log: ');
    await userEvent.paste(LONG_PASTE);
    await waitFor(() => expect(textarea).toHaveValue('Explain this log: [Pasted text #1]'));
    await expect(canvas.getByText('60 lines')).toBeInTheDocument();
    await userEvent.type(textarea, '{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: `Explain this log: ${LONG_PASTE}`,
    });
    await waitFor(() => expect(canvas.queryByText(/Pasted text #/)).not.toBeInTheDocument());
  },
};

export const HistoryFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: (args: FlowArgs) => (
    <WidthFrame width={600}>
      <InputBar
        status="ready"
        onSend={args.onSend}
        onStop={args.onStop}
        history={['first prompt', 'second prompt']}
      />
    </WidthFrame>
  ),
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(PLACEHOLDER) as HTMLTextAreaElement;
    await userEvent.click(textarea);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(textarea).toHaveValue('second prompt'));
    textarea.setSelectionRange(0, 0);
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(textarea).toHaveValue('first prompt'));
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(textarea).toHaveValue('second prompt'));
    await userEvent.clear(textarea);

    await userEvent.keyboard('{Control>}r{/Control}');
    const page = within(canvasElement.ownerDocument.body);
    const search = await page.findByRole('combobox', { name: 'Find a previous prompt' });
    await userEvent.type(search, 'first');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(textarea).toHaveValue('first prompt'));
    await userEvent.type(textarea, '{Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({ role: 'user', content: 'first prompt' });
  },
};

function SendStopDemo(args: FlowArgs) {
  const [status, setStatus] = useState<ChatStatus>('ready');
  return (
    <WidthFrame width={600}>
      <InputBar
        status={status}
        onSend={(message) => {
          args.onSend(message);
          setStatus('streaming');
        }}
        onStop={() => {
          args.onStop();
          setStatus('ready');
        }}
      />
    </WidthFrame>
  );
}

export const SendStopFlow = {
  args: { onSend: fn(), onStop: fn() },
  render: (args: FlowArgs) => <SendStopDemo {...args} />,
  play: async ({ canvasElement, args }: FlowContext) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText(PLACEHOLDER);
    await userEvent.type(textarea, '{Enter}');
    await expect(args.onSend).not.toHaveBeenCalled();
    await userEvent.type(textarea, '  Refactor the auth module  {Enter}');
    await expect(args.onSend).toHaveBeenCalledWith({
      role: 'user',
      content: 'Refactor the auth module',
    });
    await expect(textarea).toHaveValue('');
    await userEvent.click(await canvas.findByLabelText('Stop'));
    await expect(args.onStop).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(canvas.queryByLabelText('Stop')).not.toBeInTheDocument());
  },
};
