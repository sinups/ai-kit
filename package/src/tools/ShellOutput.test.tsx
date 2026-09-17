import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { ShellOutput } from './ShellOutput';

const LOG = Array.from({ length: 30 }, (_, index) => `line ${index + 1}`).join('\n');

describe('tools/ShellOutput', () => {
  it('shows the tail with a hidden line count and expands', async () => {
    render(<ShellOutput output={LOG} maxLines={5} />);

    expect(screen.getByText('+25 more lines')).toBeInTheDocument();
    expect(screen.queryByText('line 25')).not.toBeInTheDocument();
    expect(screen.getByText('line 30')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show all 30 lines' }));
    expect(screen.getByText('line 1')).toBeInTheDocument();
    expect(screen.queryByText('+25 more lines')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.queryByText('line 1')).not.toBeInTheDocument();
  });

  it('colors ANSI segments, links URLs and copies plain text', () => {
    const output = '\x1b[32m✓ ready\x1b[0m on http://localhost:3000';
    const { container } = render(<ShellOutput output={output} />);

    expect(container.querySelector('[data-ansi-fg="green"]')).toHaveTextContent('✓ ready');
    expect(screen.getByRole('link', { name: 'http://localhost:3000' })).toHaveAttribute(
      'href',
      'http://localhost:3000'
    );
    expect(screen.getByRole('button', { name: 'Copy output' })).toBeInTheDocument();
  });

  it('pretty-prints JSON and shows run metadata', () => {
    render(
      <ShellOutput
        output='{"status":"ok"}'
        exitCode={2}
        durationMs={3200}
        timeoutMs={120000}
        sizeBytes={2048}
      />
    );
    expect(screen.getByText('"status": "ok"')).toBeInTheDocument();
    expect(screen.getByText('exit 2')).toBeInTheDocument();
    expect(screen.getByText('3s')).toBeInTheDocument();
    expect(screen.getByText('timeout 2m')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('shows a running state and an empty placeholder', () => {
    render(<ShellOutput output="" live />);
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByText('No output')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy output' })).not.toBeInTheDocument();
  });

  it('follows live output in the expanded log until the user scrolls up', () => {
    function Harness() {
      const [count, setCount] = useState(30);
      const output = Array.from({ length: count }, (_, index) => `line ${index + 1}`).join('\n');
      return (
        <>
          <button type="button" onClick={() => setCount((value) => value + 1)}>
            Append
          </button>
          <ShellOutput output={output} live defaultExpanded maxLines={5} />
        </>
      );
    }
    render(<Harness />);
    const viewport = document.querySelector<HTMLDivElement>(
      '[data-testid="shell-output-scroll"] .mantine-ScrollArea-viewport'
    )!;
    let scrollTop = 0;
    Object.defineProperties(viewport, {
      scrollHeight: { configurable: true, value: 1000 },
      clientHeight: { configurable: true, value: 300 },
      scrollTop: {
        configurable: true,
        get: () => scrollTop,
        set: (value: number) => {
          scrollTop = value;
        },
      },
    });
    const append = () => fireEvent.click(screen.getByRole('button', { name: 'Append' }));

    append();
    expect(viewport.scrollTop).toBe(1000);

    viewport.scrollTop = 100;
    fireEvent.scroll(viewport);
    append();
    expect(viewport.scrollTop).toBe(100);

    fireEvent.click(screen.getByRole('button', { name: 'Scroll to latest' }));
    expect(viewport.scrollTop).toBe(1000);
    expect(screen.queryByRole('button', { name: 'Scroll to latest' })).not.toBeInTheDocument();
  });
});
