import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { Markdown } from './Markdown';

const WIDE_TABLE = '| a | b | c | d |\n| - | - | - | - |\n| 1 | 2 | 3 | 4 |';

describe('Markdown', () => {
  it('renders tables as plain scrollable tables by default', () => {
    const { container } = render(<Markdown content={WIDE_TABLE} />);
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('[data-measuring], [data-stacked]')).toBeNull();
  });

  it('hides a responsive table until its width is measured', () => {
    const { container } = render(<Markdown content={WIDE_TABLE} responsiveTables />);
    expect(container.querySelector('[data-measuring] table')).toBeInTheDocument();
  });

  it('renders lists', () => {
    render(<Markdown content={'- first\n- second'} />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('first');
  });

  it('renders external links with rel and target', () => {
    render(<Markdown content="See [docs](https://mantine.dev) and [local](/page)" />);
    const external = screen.getByRole('link', { name: 'docs' });
    expect(external).toHaveAttribute('href', 'https://mantine.dev');
    expect(external).toHaveAttribute('target', '_blank');
    expect(external).toHaveAttribute('rel', 'noopener noreferrer');
    const local = screen.getByRole('link', { name: 'local' });
    expect(local).not.toHaveAttribute('target');
  });

  it('renders code blocks with a language label and copy button', () => {
    render(<Markdown content={'```ts\nconst a = 1;\n```'} />);
    expect(screen.getByText('ts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
  });

  it('does not render raw html', () => {
    render(<Markdown content="<script>alert(1)<\/script> text" />);
    expect(document.querySelector('script')).toBeNull();
  });

  it('passes fenced code without the trailing newline to the copy button', async () => {
    const writeText = jest.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    render(<Markdown content={'```bash\nyarn test\n```'} />);
    await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));
    expect(writeText).toHaveBeenCalledWith('yarn test');
    expect(document.querySelector('pre code')?.textContent).toBe('yarn test');
  });

  it('wraps long code lines only with codeWrap', () => {
    const content =
      '```bash\ncurl -X POST https://api.example.com/v1/items -d \'{"name":"item"}\'\n```';
    const { container, rerender } = render(<Markdown content={content} />);
    expect(container.querySelector('pre')).not.toHaveAttribute('data-wrap');

    rerender(
      <>
        <Markdown content={content} codeWrap />
      </>
    );
    expect(container.querySelector('pre')).toHaveAttribute('data-wrap', 'true');
  });
});
