import React, { useState } from 'react';
import { Button, Code, Stack } from '@mantine/core';
import { IconBolt, IconBug, IconFileText } from '@tabler/icons-react';
import { AgentModeIcon, PlanModeIcon } from '../icons/mode-icons';
import type { AttachedFile, AttachedImage, ChatStatus, ModelOption } from '../types';
import type { QuestionConfig } from '../question/QuestionPrompt';
import { InputBar } from './InputBar';
import { ModelPicker } from './ModelPicker';
import { ModeSelector, ModeOption } from './ModeSelector';

export default { title: 'InputBar' };

const IMAGE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="steelblue"/><circle cx="100" cy="100" r="60" fill="white"/></svg>';
const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(IMAGE_SVG)}`;

const MODELS: ModelOption[] = [
  { id: 'claude-fable-5-1', name: 'Fable', version: '5.1' },
  { id: 'claude-opus-5', name: 'Opus', version: '5' },
  { id: 'claude-sonnet-5', name: 'Sonnet', version: '5' },
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
    <Stack p="xl" maw={520} gap="xl">
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

export function Idle() {
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
  const [model, setModel] = useState('claude-fable-5-1');
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
