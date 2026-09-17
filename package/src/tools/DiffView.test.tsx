import React from 'react';
import { render } from '@mantine-tests/core';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { DiffView } from './DiffView';

const OLD = 'const total = sum(items);\nreturn total;';
const NEW = 'const total = sumBy(items, price);\nreturn total;';

const keywordHighlighter: SyntaxHighlighter = (code) =>
  code
    .split('\n')
    .map((line) =>
      (line.match(/\w+|\W+/g) ?? []).map((content) =>
        content === 'const' ? { content, color: 'rgb(255, 0, 0)' } : { content }
      )
    );

describe('tools/DiffView', () => {
  it('highlights changed words when asked', () => {
    const { container } = render(<DiffView oldText={OLD} newText={NEW} wordHighlight />);
    const marks = Array.from(container.querySelectorAll('mark')).map((mark) => mark.textContent);
    expect(marks).toContain('sum(items');
  });

  it('leaves replaced lines unmarked by default', () => {
    const { container } = render(<DiffView oldText={OLD} newText={NEW} />);
    expect(container.querySelectorAll('mark')).toHaveLength(0);
    expect(container.querySelectorAll('[data-type="remove"]')).toHaveLength(1);
  });

  it('colors tokens from the highlighter and keeps word marks on top', () => {
    const { container } = render(
      <DiffView oldText={OLD} newText={NEW} wordHighlight highlighter={keywordHighlighter} />
    );
    const colored = Array.from(container.querySelectorAll<HTMLElement>('span[style]')).filter(
      (node) => node.style.color === 'rgb(255, 0, 0)'
    );
    expect(colored.map((node) => node.textContent)).toEqual(['const', 'const']);
    expect(container.querySelectorAll('mark').length).toBeGreaterThan(0);
  });

  it('wraps long lines only when asked', () => {
    const { container, rerender } = render(<DiffView oldText={OLD} newText={NEW} />);
    expect(container.querySelector('[data-wrap]')).toBeNull();
    rerender(<DiffView oldText={OLD} newText={NEW} wrapLines />);
    expect(container.querySelector('[data-wrap="true"]')).not.toBeNull();
  });
});
