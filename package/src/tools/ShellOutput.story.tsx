import React, { useEffect, useState } from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { Paper, Stack } from '@mantine/core';
import { NARROW_WIDTH, WIDE_WIDTH, WidthFrame } from '../_stories/WidthFrame';
import { ShellOutput } from './ShellOutput';

export default { title: 'Tools/ShellOutput' };

const JEST = [
  '\x1b[1m\x1b[32m PASS \x1b[39m\x1b[22m src/billing/tax.test.ts (2.1 s)',
  '\x1b[1m\x1b[31m FAIL \x1b[39m\x1b[22m src/billing/invoice.test.ts',
  '  \x1b[1m● calculateTotals › applies a percent discount before tax\x1b[22m',
  '',
  '    expect(\x1b[31mreceived\x1b[39m).toEqual(\x1b[32mexpected\x1b[39m)',
  '',
  '    \x1b[32m- Expected  - 1\x1b[39m',
  '    \x1b[31m+ Received  + 1\x1b[39m',
  '',
  '    \x1b[2mat Object.<anonymous> (src/billing/invoice.test.ts:14:5)\x1b[22m',
  '',
  '\x1b[1mTests:\x1b[22m       \x1b[1m\x1b[31m1 failed\x1b[39m\x1b[22m, \x1b[1m\x1b[32m11 passed\x1b[39m\x1b[22m, 12 total',
  '\x1b[1mTime:\x1b[22m        4.52 s',
  'Docs: https://jestjs.io/docs/cli',
].join('\n');

const JSON_OUTPUT =
  '{"name":"@acme/billing","version":"2.4.0","dependencies":{"decimal.js":"^10.4.3"}}';

const DEV_LINES = [
  '\x1b[36minfo\x1b[39m  - Loaded env from .env.local',
  '\x1b[32mready\x1b[39m - started server on 0.0.0.0:3000, url: http://localhost:3000',
  '\x1b[35mevent\x1b[39m - compiled client and server successfully in 1.2s (412 modules)',
  '\x1b[33mwarn\x1b[39m  - Fast Refresh had to perform a full reload',
  'GET /api/invoices 200 in 38ms',
];

function Live() {
  const [lines, setLines] = useState(DEV_LINES.slice(0, 2));
  useEffect(() => {
    const id = window.setInterval(
      () => setLines((current) => [...current, DEV_LINES[current.length % DEV_LINES.length]]),
      900
    );
    return () => window.clearInterval(id);
  }, []);
  return (
    <ShellOutput
      output={lines.join('\n')}
      live
      startedAt={Date.now() - 42_000}
      timeoutMs={600_000}
      maxLines={6}
    />
  );
}

function Demo() {
  return (
    <Stack gap="md">
      <Paper withBorder radius="md" p="sm">
        <ShellOutput output={JEST} exitCode={1} durationMs={4520} maxLines={6} />
      </Paper>
      <Paper withBorder radius="md" p="sm">
        <ShellOutput output={JSON_OUTPUT} exitCode={0} durationMs={180} />
      </Paper>
      <Paper withBorder radius="md" p="sm">
        <Live />
      </Paper>
      <Paper withBorder radius="md" p="sm">
        <ShellOutput output="" exitCode={0} durationMs={40} />
      </Paper>
    </Stack>
  );
}

export function Usage() {
  return (
    <Stack p="xl" maw={640}>
      <Demo />
    </Stack>
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

export function Expanded() {
  return (
    <WidthFrame width={640}>
      <ShellOutput
        output={JEST}
        exitCode={1}
        durationMs={4520}
        maxLines={6}
        defaultExpanded
        maxHeight={200}
      />
    </WidthFrame>
  );
}

type FlowContext = { canvasElement: HTMLElement };

const READY_OUTPUT = '\x1b[32mready\x1b[39m on port 3000';

const LONG_LOG = Array.from({ length: 60 }, (_, index) => `line ${index + 1}`).join('\n');

export const ShowAllFlow = {
  render: () => (
    <Stack p="xl" maw={640}>
      <ShellOutput output={JEST} exitCode={1} durationMs={4520} maxLines={6} />
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('+8 more lines')).toBeInTheDocument();
    await expect(canvas.queryByText(/PASS/)).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole('button', { name: 'Show all 14 lines' }));
    await expect(canvas.getByText(/PASS/)).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'https://jestjs.io/docs/cli' })).toHaveAttribute(
      'target',
      '_blank'
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
    await expect(canvas.queryByText(/PASS/)).not.toBeInTheDocument();
  },
};

export const CopyFlow = {
  render: () => (
    <Stack p="xl" maw={640}>
      <ShellOutput output={READY_OUTPUT} exitCode={0} />
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const clipboard = canvasElement.ownerDocument.defaultView!.navigator.clipboard;
    let copied = '';
    Object.defineProperty(clipboard, 'writeText', {
      configurable: true,
      value: async (text: string) => {
        copied = text;
      },
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Copy output' }));
    await expect(await canvas.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    await expect(copied).toBe('ready on port 3000');
  },
};

export const JsonFlow = {
  render: () => (
    <Stack p="xl" maw={640}>
      <ShellOutput output={JSON_OUTPUT} exitCode={0} durationMs={180} />
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('"version": "2.4.0",')).toBeInTheDocument();
    await expect(canvas.getByText('"decimal.js": "^10.4.3"')).toBeInTheDocument();
    await expect(canvas.getByText('exit 0')).toBeInTheDocument();
  },
};

export const ScrollToLatestFlow = {
  render: () => (
    <Stack p="xl" maw={640}>
      <ShellOutput output={LONG_LOG} live defaultExpanded maxLines={6} maxHeight={160} />
    </Stack>
  ),
  play: async ({ canvasElement }: FlowContext) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-testid="shell-output-scroll"] .mantine-ScrollArea-viewport'
    )!;
    await waitFor(() =>
      expect(viewport.scrollTop + viewport.clientHeight).toBeGreaterThanOrEqual(
        viewport.scrollHeight - 2
      )
    );
    viewport.scrollTop = 0;
    viewport.dispatchEvent(new Event('scroll'));
    const button = await canvas.findByRole('button', { name: 'Scroll to latest' });
    await userEvent.click(button);
    await expect(viewport.scrollTop + viewport.clientHeight).toBeGreaterThanOrEqual(
      viewport.scrollHeight - 2
    );
    await expect(
      canvas.queryByRole('button', { name: 'Scroll to latest' })
    ).not.toBeInTheDocument();
  },
};
