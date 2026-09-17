import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../../primitives/_testing/element-width';
import { DIFF_EXTRA_FIXTURES, DIFF_FIXTURES } from '../fixtures';
import type { SyntaxHighlighter } from '../../utils/highlighter';
import type { FileChange } from '../types';
import { DiffFileView } from './DiffFileView';

const byPath = (suffix: string) => DIFF_FIXTURES.find((change) => change.path.endsWith(suffix))!;

describe('diff/DiffFileView', () => {
  it('renders a unified diff with word highlights and collapsed unchanged lines', async () => {
    const { container } = render(<DiffFileView change={byPath('invoice.ts')} />);

    expect(screen.getByText('packages/billing/src/')).toBeInTheDocument();
    expect(screen.getByText('invoice.ts')).toBeInTheDocument();
    expect(screen.queryByText('Split')).not.toBeInTheDocument();

    const words = Array.from(container.querySelectorAll('ins, del')).map((word) => [
      word.tagName,
      word.textContent,
    ]);
    expect(words).toContainEqual(['DEL', '5']);
    expect(words).toContainEqual(['INS', '6']);
    expect(screen.getAllByText('Added line').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Removed line').length).toBeGreaterThan(0);

    const [gap] = screen.getAllByRole('button', { name: /Show \d+ unchanged lines?/ });
    const rowsBefore = container.querySelectorAll('tbody tr').length;
    await userEvent.click(gap);
    expect(container.querySelectorAll('tbody tr').length).toBeGreaterThan(rowsBefore);
  });

  it('shows stubs for binary, renamed and deleted files', async () => {
    const { rerender, container } = render(<DiffFileView change={byPath('.png')} />);
    expect(screen.getByText('Binary file')).toBeInTheDocument();

    rerender(<DiffFileView change={byPath('README.md')} />);
    expect(screen.getByText('File renamed without content changes')).toBeInTheDocument();
    expect(screen.getByText('docs/billing.md → docs/billing/README.md')).toBeInTheDocument();

    rerender(<DiffFileView change={byPath('fetch-totals.ts')} />);
    expect(screen.getByText('File deleted')).toBeInTheDocument();
    expect(screen.getByText('8 lines removed')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show content' }));
    expect(container.querySelectorAll('tbody tr[data-type="remove"]')).toHaveLength(8);
  });

  it('renders an added file without collapsing and an empty file stub', () => {
    const { container, rerender } = render(<DiffFileView change={byPath('invoice.test.ts')} />);
    expect(container.querySelectorAll('tbody tr[data-type="add"]').length).toBeGreaterThan(10);
    expect(screen.queryByRole('button', { name: /unchanged/ })).not.toBeInTheDocument();

    const empty: FileChange = { path: 'src/.gitkeep', status: 'added', newContent: '' };
    rerender(<DiffFileView change={empty} />);
    expect(screen.getByText('Empty file')).toBeInTheDocument();
  });

  it('shows stubs for untracked and too large files with a way to reveal them', async () => {
    const [untracked, lockfile] = DIFF_EXTRA_FIXTURES;
    const { container, rerender } = render(<DiffFileView change={untracked} />);
    expect(screen.getByText('New untracked file')).toBeInTheDocument();
    expect(screen.getByLabelText('Untracked')).toHaveTextContent('U');
    await userEvent.click(screen.getByRole('button', { name: 'Show content' }));
    expect(container.querySelectorAll('tbody tr[data-type="add"]')).toHaveLength(5);

    rerender(<DiffFileView change={lockfile} />);
    expect(screen.getByText('File too large to display')).toBeInTheDocument();
    expect(screen.getByText(/is over the 500 KB limit/)).toBeInTheDocument();
    expect(screen.getByText('+214')).toBeInTheDocument();
    expect(container.querySelector('table')).not.toBeInTheDocument();

    rerender(<DiffFileView change={lockfile} maxBytes={10_000_000} />);
    expect(screen.queryByText('File too large to display')).not.toBeInTheDocument();
  });

  it('hides the next large file again after Show anyway', async () => {
    const [, lockfile] = DIFF_EXTRA_FIXTURES;
    const { container, rerender } = render(<DiffFileView change={lockfile} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show anyway' }));
    expect(container.querySelector('table')).toBeInTheDocument();

    rerender(<DiffFileView change={{ ...lockfile, path: 'other/yarn.lock' }} />);
    expect(screen.getByText('File too large to display')).toBeInTheDocument();
    expect(container.querySelector('table')).not.toBeInTheDocument();
  });

  it('colors code with a highlighter and keeps word highlights', () => {
    const highlighter = jest.fn<ReturnType<SyntaxHighlighter>, Parameters<SyntaxHighlighter>>(
      (code) =>
        code
          .split('\n')
          .map((line) =>
            (line.match(/\w+|\W+/g) ?? []).map((content) =>
              content === 'export' ? { content, color: 'rgb(0, 0, 255)' } : { content }
            )
          )
    );
    const { container } = render(
      <DiffFileView change={byPath('invoice.ts')} highlighter={highlighter} />
    );

    expect(highlighter).toHaveBeenCalledWith(expect.stringContaining('discountAmount'), 'ts');
    const colored = Array.from(container.querySelectorAll<HTMLElement>('[style]')).filter(
      (node) => node.style.color === 'rgb(0, 0, 255)'
    );
    expect(colored.length).toBeGreaterThan(0);
    expect(container.querySelector('ins[data-type="added"]')).toBeInTheDocument();
  });

  it('hides a split diff until the width is measured', () => {
    const { container, rerender } = render(
      <DiffFileView change={byPath('types.ts')} defaultMode="split" />
    );
    expect(container.querySelector('table')).toHaveAttribute('data-measuring', 'true');
    rerender(<DiffFileView change={byPath('types.ts')} />);
    expect(container.querySelector('table')).not.toHaveAttribute('data-measuring');
  });

  describe('wide', () => {
    let restore: () => void;
    beforeEach(() => {
      restore = setElementWidth(1000);
    });
    afterEach(() => restore());

    it('switches to the split layout', async () => {
      const onModeChange = jest.fn();
      const { container } = render(
        <DiffFileView change={byPath('types.ts')} onModeChange={onModeChange} />
      );

      await userEvent.click(await screen.findByText('Split'));
      expect(onModeChange).toHaveBeenCalledWith('split');
      expect(container.querySelector('table[data-mode="split"]')).toBeInTheDocument();
      expect(container.querySelectorAll('td[data-type="add"]').length).toBeGreaterThan(0);
    });
  });
});
