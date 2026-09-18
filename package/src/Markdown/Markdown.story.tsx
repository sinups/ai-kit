import React, { useEffect, useState } from 'react';
import { expect, fn, userEvent, within } from '@storybook/test';
import { Button, Group, Stack, Text } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { storyHighlighter } from '../_stories/shiki-highlighter';
import { Markdown } from './Markdown';

export default { title: 'Markdown' };

const SAMPLE = `# Heading 1

## Heading 2

### Heading 3

#### Heading 4

A paragraph with **bold text**, \`inline code\` and a [link to Mantine](https://mantine.dev) plus an [internal link](/docs).

- First bullet
- Second bullet with \`code\`
- Third bullet

1. Step one
2. Step two
3. Step three

> A quote about something important.

| Column | Type | Description |
| --- | --- | --- |
| id | string | Unique identifier |
| name | string | Display name |
| size | number | Size in bytes |

---

\`\`\`ts
export function greet(name: string) {
  return \`Hello, \${name}!\`;
}
\`\`\`

\`\`\`bash
yarn add @sinups/ai-kit
\`\`\`
`;

export function Usage() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={SAMPLE} />
    </div>
  );
}

export function NumberedListBreaks() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={'1.\n\nFirst item\n2.\n\nSecond item\n3. Third item'} />
    </div>
  );
}

export function UnknownLanguage() {
  return (
    <div style={{ padding: 40, maxWidth: 520 }}>
      <Markdown content={'```rust\nfn main() {}\n```\n\n```\nplain block\n```'} />
    </div>
  );
}

const TABLE = `| Tool | Calls | Errors | p50 | p95 | Owner |
| --- | ---: | ---: | ---: | ---: | --- |
| Read | 1 204 | 0 | 12 ms | 40 ms | core |
| Grep | 842 | 3 | 30 ms | 180 ms | search |
| Bash | 311 | 27 | 1.2 s | 9.8 s | runtime |`;

export function TableNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Markdown content={TABLE} />
    </WidthFrame>
  );
}

export function TableNarrowResponsive() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Markdown content={TABLE} responsiveTables />
    </WidthFrame>
  );
}

export function TableWide() {
  return (
    <WidthFrame width={WIDE_WIDTH}>
      <Markdown content={TABLE} responsiveTables />
    </WidthFrame>
  );
}

const HIGHLIGHTED = `Here is the hook with a test:

\`\`\`tsx
import { useEffect, useState } from 'react';

export function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}
\`\`\`

\`\`\`bash
yarn test --watch src/hooks/use-online.test.ts
\`\`\`

\`\`\`json
{ "compilerOptions": { "strict": true, "jsx": "react-jsx" } }
\`\`\`
`;

export function Highlighted() {
  return (
    <WidthFrame width={640}>
      <Markdown content={HIGHLIGHTED} highlighter={storyHighlighter} />
    </WidthFrame>
  );
}

const STREAM = `${SAMPLE}

## Migration plan

1. Extract the fetch logic into \`useSessions\`.
2. Replace the three copies of the list with \`SessionList\`.
3. Delete the old sidebar.

${HIGHLIGHTED}

${TABLE}

That is everything — the stable part above was parsed once while this paragraph kept growing.`;

function StreamDemo({ width }: { width: number }) {
  const [length, setLength] = useState(0);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = window.setInterval(() => {
      setLength((current) => {
        const next = Math.min(STREAM.length, current + 6 + Math.floor(Math.random() * 18));
        if (next >= STREAM.length) {
          setRunning(false);
        }
        return next;
      });
    }, 40);
    return () => window.clearInterval(timer);
  }, [running]);

  return (
    <WidthFrame width={width}>
      <Stack gap={12}>
        <Group gap={10}>
          <Button
            size="xs"
            variant="default"
            onClick={() => {
              setLength(0);
              setRunning(true);
            }}
          >
            Restart
          </Button>
          <Text size="xs" c="dimmed">
            {running ? 'Streaming…' : 'Done'} {length}/{STREAM.length}
          </Text>
        </Group>
        <Markdown
          content={STREAM.slice(0, length)}
          streaming={running}
          highlighter={storyHighlighter}
        />
      </Stack>
    </WidthFrame>
  );
}

export function Streaming() {
  return <StreamDemo width={640} />;
}

export function StreamingNarrow() {
  return <StreamDemo width={NARROW_WIDTH} />;
}

export function CodeCopyFlow() {
  return (
    <Stack p={32} maw={560}>
      <Markdown content={'Run it:\n\n```bash\nyarn test\n```'} />
    </Stack>
  );
}

CodeCopyFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const writeText = fn(async () => {});
  Object.defineProperty(canvasElement.ownerDocument.defaultView!.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  await expect(canvas.getByText('bash')).toBeInTheDocument();
  await userEvent.click(canvas.getByRole('button', { name: 'Copy code' }));
  await expect(writeText).toHaveBeenCalledWith('yarn test');
  await expect(await canvas.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
};

export function LinksFlow() {
  return (
    <Stack p={32} maw={560}>
      <Markdown content="See [docs](https://mantine.dev) or [local](/page)." />
    </Stack>
  );
}

LinksFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  const external = canvas.getByRole('link', { name: 'docs' });
  await expect(external).toHaveAttribute('target', '_blank');
  await expect(external).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(canvas.getByRole('link', { name: 'local' })).not.toHaveAttribute('target');
};

const LONG_CODE = `Run the request with the token from the previous step:

\`\`\`bash
curl -X POST https://api.example.com/v1/agents/sessions/3f2a9c/messages -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"role":"user","content":"hello"}'
\`\`\``;

export function CodeWrapNarrow() {
  return (
    <WidthFrame width={NARROW_WIDTH}>
      <Stack gap="lg">
        <Markdown content={LONG_CODE} />
        <Markdown content={LONG_CODE} wrapLines />
      </Stack>
    </WidthFrame>
  );
}

const CARET_TEXT = 'The caret follows the last word of the answer while it streams';

function StreamingCaretDemo() {
  const [shown, setShown] = useState(12);
  const streaming = shown < CARET_TEXT.length;
  useEffect(() => {
    if (!streaming) {
      return;
    }
    const timer = setTimeout(() => setShown((count) => count + 2), 60);
    return () => clearTimeout(timer);
  }, [shown, streaming]);
  return (
    <Stack p="xl" maw={560} gap="xs">
      <Button size="xs" w="fit-content" onClick={() => setShown(12)}>
        Replay
      </Button>
      <Markdown content={CARET_TEXT.slice(0, shown)} streaming={streaming} streamingCaret />
    </Stack>
  );
}

export function StreamingCaret() {
  return <StreamingCaretDemo />;
}

StreamingCaret.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await expect(canvasElement.querySelector('[data-caret]')).not.toBeNull();
};
