import React from 'react';
import { expect, fn, userEvent, waitFor, within } from '@storybook/test';
import { Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { storyHighlighter } from '../_stories/shiki-highlighter';
import { CodeBlock } from './CodeBlock';

export default { title: 'CodeBlock' };

const TS = `import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`;

const LONG = Array.from(
  { length: 60 },
  (_, index) => `  { id: ${index + 1}, name: 'item-${index + 1}', enabled: ${index % 3 !== 0} },`
);
const LONG_CODE = `export const items = [\n${LONG.join('\n')}\n];`;

const WIDE_LINE = `curl -X POST https://api.example.com/v1/agents/sessions/3f2a9c/messages -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"role":"user","content":"hello"}'`;

function Demo() {
  return (
    <Stack gap="md">
      <CodeBlock code={TS} language="ts" highlighter={storyHighlighter} withLineNumbers />
      <CodeBlock
        code={LONG_CODE}
        language="ts"
        title="items.ts"
        collapsedLines={20}
        highlighter={storyHighlighter}
        withLineNumbers
      />
      <CodeBlock code={WIDE_LINE} language="bash" highlighter={storyHighlighter} />
      <CodeBlock code={WIDE_LINE} language="bash" highlighter={storyHighlighter} wrapLines />
      <CodeBlock code="plain text without a highlighter" />
    </Stack>
  );
}

export function Usage() {
  return (
    <WidthFrame width={600}>
      <Demo />
    </WidthFrame>
  );
}

export function Narrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

export function Wide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Demo />
    </WidthFrame>
  );
}

function mockClipboard(win: Window) {
  const writeText = fn(async () => {});
  Object.defineProperty(win.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

const FLOW_CODE = Array.from(
  { length: 40 },
  (_, index) => `const line${index + 1} = ${index + 1};`
).join('\n');

export function CopyFlow() {
  return (
    <Stack p="xl" maw={520}>
      <CodeBlock code="const answer = 42;" language="ts" />
    </Stack>
  );
}

CopyFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const writeText = mockClipboard(canvasElement.ownerDocument.defaultView!);
  await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));
  await expect(writeText).toHaveBeenCalledWith('const answer = 42;');
  await expect(await canvas.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
};

export function CollapseFlow() {
  return (
    <Stack p="xl" maw={520}>
      <CodeBlock code={FLOW_CODE} language="ts" collapsedLines={10} />
    </Stack>
  );
}

CollapseFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const code = () => canvasElement.querySelector('pre code')?.textContent ?? '';
  await expect(code()).not.toContain('line40');
  await userEvent.click(canvas.getByRole('button', { name: 'Show 30 more lines' }));
  await waitFor(() => expect(code()).toContain('line40'));
  await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
  await waitFor(() => expect(code()).not.toContain('line40'));
};
