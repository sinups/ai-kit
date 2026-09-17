import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { clearHighlightCache, type SyntaxHighlighter } from '../utils/highlighter';
import { CodeBlock } from './CodeBlock';

const lines = (count: number) =>
  Array.from({ length: count }, (_, index) => `line ${index + 1}`).join('\n');

describe('CodeBlock', () => {
  beforeEach(() => clearHighlightCache());

  it('renders the language, plain lines and a copy button', () => {
    const { container } = render(<CodeBlock code={'const a = 1;\nconst b = 2;'} language="ts" />);
    expect(screen.getByText('ts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(container.querySelector('pre code')?.textContent).toBe('const a = 1;\nconst b = 2;');
    expect(container.querySelectorAll('pre code span')).toHaveLength(0);
    expect(container.querySelector('pre')).not.toHaveAttribute('data-numbered');
  });

  it('shows the title and line numbers and hides copy on request', () => {
    const { container } = render(
      <CodeBlock code="x" title="index.ts" withLineNumbers startLineNumber={40} withCopy={false} />
    );
    expect(screen.getByText('index.ts')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy code' })).not.toBeInTheDocument();
    const pre = container.querySelector('pre')!;
    expect(pre).toHaveAttribute('data-numbered', 'true');
    expect(pre.style.getPropertyValue('--ae-code-start')).toBe('39');
  });

  it('applies highlighted token colors with light-dark', () => {
    const highlighter: SyntaxHighlighter = () => [
      [{ content: 'const', color: '#d73a49', darkColor: '#f97583' }, { content: ' a' }],
    ];
    render(<CodeBlock code="const a" language="ts" highlighter={highlighter} />);
    expect(screen.getByText('const')).toHaveStyle({
      color: 'light-dark(#d73a49, #f97583)',
    });
  });

  it('highlights only once the code stops streaming', () => {
    const highlighter = jest.fn<ReturnType<SyntaxHighlighter>, Parameters<SyntaxHighlighter>>(
      (code) => [[{ content: code, color: '#d73a49' }]]
    );
    const { rerender } = render(
      <CodeBlock code="const" language="ts" highlighter={highlighter} streaming />
    );
    rerender(<CodeBlock code="const a" language="ts" highlighter={highlighter} streaming />);
    expect(highlighter).not.toHaveBeenCalled();
    rerender(<CodeBlock code="const a" language="ts" highlighter={highlighter} />);
    expect(highlighter).toHaveBeenCalledTimes(1);
    expect(screen.getByText('const a')).toHaveStyle({ color: '#d73a49' });
  });

  it('falls back to plain code when the highlighter returns null', () => {
    render(<CodeBlock code="fn main() {}" language="rust" highlighter={() => null} />);
    expect(screen.getByText('fn main() {}')).toBeInTheDocument();
  });

  it('collapses long code and expands it', async () => {
    const { container } = render(<CodeBlock code={lines(40)} collapsedLines={10} />);
    expect(container.querySelector('pre code')?.textContent?.split('\n')).toHaveLength(10);

    await userEvent.click(screen.getByRole('button', { name: 'Show 30 more lines' }));
    expect(container.querySelector('pre code')?.textContent?.split('\n')).toHaveLength(40);
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(container.querySelector('pre code')?.textContent?.split('\n')).toHaveLength(10);
  });

  it('does not collapse by default, for short code or while streaming', () => {
    const { rerender } = render(<CodeBlock code={lines(24)} collapsedLines={20} />);
    expect(screen.queryByRole('button', { name: /more lines/ })).not.toBeInTheDocument();

    rerender(<CodeBlock code={lines(60)} collapsedLines={20} streaming />);
    expect(screen.queryByRole('button', { name: /more lines/ })).not.toBeInTheDocument();

    rerender(<CodeBlock code={lines(60)} />);
    expect(screen.queryByRole('button', { name: /more lines/ })).not.toBeInTheDocument();
  });
});
