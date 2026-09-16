import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { Markdown } from './Markdown';

describe('Markdown', () => {
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
});
