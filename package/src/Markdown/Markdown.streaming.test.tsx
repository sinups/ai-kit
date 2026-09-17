import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { act, render as renderWithoutRemount } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { clearHighlightCache, type SyntaxHighlighter } from '../utils/highlighter';
import { Markdown } from './Markdown';

describe('Markdown/Markdown streaming', () => {
  beforeEach(() => clearHighlightCache());

  it('parses finished blocks once and re-parses only the growing tail', () => {
    const markdownToJsx = require('markdown-to-jsx') as typeof import('markdown-to-jsx');
    const compile = jest.spyOn(markdownToJsx, 'compiler');
    const { rerender } = render(<Markdown streaming content={'# Title\n\nFirst paragraph'} />);
    expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument();
    compile.mockClear();

    rerender(
      <>
        <Markdown streaming content={'# Title\n\nFirst paragraph grows'} />
      </>
    );
    expect(compile.mock.calls.map((call) => call[0])).toEqual(['First paragraph grows']);
    expect(compile.mock.calls[0][0]).toBe('First paragraph grows');

    compile.mockClear();
    rerender(
      <>
        <Markdown streaming content={'# Title\n\nFirst paragraph grows\n\n- item'} />
      </>
    );
    expect(compile.mock.calls.map((call) => call[0])).toEqual(['First paragraph grows', '- item']);
    expect(screen.getByRole('listitem')).toHaveTextContent('item');
    compile.mockRestore();
  });

  it('renders an unclosed fence in the tail as a code block', () => {
    const { container } = render(
      <Markdown streaming content={'Intro\n\n```ts\nconst a = 1;\n\nconst b'} />
    );
    const code = container.querySelector('[data-code-block] pre');
    expect(code).toHaveTextContent('const a = 1;');
    expect(code).toHaveTextContent('const b');
    expect(screen.queryByText('```')).not.toBeInTheDocument();
  });

  it('drops a dangling list marker while streaming', () => {
    render(<Markdown streaming content={'- one\n- '} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('renders the same result when streaming ends', () => {
    const content = '# Done\n\nText\n\n```ts\nx\n```';
    const { container, rerender } = render(<Markdown streaming content={content} />);
    const streamed = container.textContent;
    rerender(<Markdown content={content} />);
    expect(container.textContent).toBe(streamed);
  });

  it('keeps finished code blocks mounted when streaming ends', () => {
    const content = 'Intro\n\n```ts\nx\n```\n\nOutro';
    const { container, rerender } = renderWithoutRemount(
      <MantineProvider>
        <Markdown streaming content={content} />
      </MantineProvider>
    );
    const block = container.querySelector('[data-code-block]');
    rerender(
      <MantineProvider>
        <Markdown content={content} />
      </MantineProvider>
    );
    expect(container.querySelector('[data-code-block]')).toBe(block);
    expect(container.querySelector('[data-streaming]')).toBeNull();
  });

  it('renders a loose list as one list while streaming', () => {
    render(<Markdown streaming content={'- a\n\n- b\n\nAfter'} />);
    expect(screen.getAllByRole('list')).toHaveLength(1);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('passes the highlighter to fenced code and keeps unknown languages plain', () => {
    const highlighter: SyntaxHighlighter = (code, language) =>
      language === 'ts' ? [[{ content: code, color: '#005cc5', darkColor: '#79b8ff' }]] : null;
    render(
      <Markdown highlighter={highlighter} content={'```ts\nconst a\n```\n\n```we!rd\nplain\n```'} />
    );
    expect(screen.getByText('const a')).toHaveStyle({
      color: 'light-dark(#005cc5, #79b8ff)',
    });
    expect(screen.getAllByText('text')).toHaveLength(1);
    expect(screen.getByText('plain')).not.toHaveAttribute('style');
  });

  it('holds back the unfinished last line with line granularity', () => {
    const { container, rerender } = render(
      <Markdown streaming tailGranularity="line" content={'Intro\n\nFirst line\nhalf wo'} />
    );
    expect(container).toHaveTextContent('First line');
    expect(container).not.toHaveTextContent('half wo');

    rerender(
      <>
        <Markdown streaming tailGranularity="line" content={'Intro\n\nFirst line\nhalf word\n'} />
      </>
    );
    expect(container).toHaveTextContent('half word');
  });

  it('shows every character as it arrives by default', () => {
    const { container } = render(<Markdown streaming content={'Intro\n\nFirst line\nhalf wo'} />);
    expect(container).toHaveTextContent('half wo');
  });

  it('commits a burst of deltas as one frame when frame batching is on', () => {
    jest.useFakeTimers();
    const { container, rerender } = renderWithoutRemount(
      <MantineProvider>
        <Markdown streaming frameBatched content="Answer" />
      </MantineProvider>
    );
    expect(container).toHaveTextContent('Answer');

    for (const content of ['Answer gro', 'Answer grow', 'Answer grows']) {
      rerender(
        <MantineProvider>
          <Markdown streaming frameBatched content={content} />
        </MantineProvider>
      );
    }
    expect(container).toHaveTextContent('Answer');
    expect(container).not.toHaveTextContent('grows');

    act(() => {
      jest.advanceTimersByTime(16);
    });
    expect(container).toHaveTextContent('Answer grows');
    jest.useRealTimers();
  });
});
