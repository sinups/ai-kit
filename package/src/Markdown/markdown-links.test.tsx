import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { Markdown } from './Markdown';
import { MarkdownLinksProvider } from './markdown-links';

describe('Markdown links', () => {
  it('renders an unsafe link as text', () => {
    render(
      <Markdown content="[open](blob:https://example.com/1) and [docs](https://example.com)" />
    );
    expect(screen.getByText('open').closest('a')).toBeNull();
    expect(screen.getByRole('link', { name: 'docs' })).toHaveAttribute('target', '_blank');
  });

  it('keeps links of other schemes as in 0.3', () => {
    render(<Markdown content="[repo](ftp://example.com/r) and [editor](vscode://file/a.ts)" />);
    expect(screen.getByRole('link', { name: 'repo' })).toHaveAttribute(
      'href',
      'ftp://example.com/r'
    );
    expect(screen.getByRole('link', { name: 'editor' })).toBeInTheDocument();
  });

  it('hands a link of a host scheme to onLinkClick without navigating', () => {
    const onLinkClick = jest.fn();
    render(
      <MarkdownLinksProvider onLinkClick={onLinkClick} linkSchemes={[' Artifact ']}>
        <Markdown content="See [the report](ARTIFACT:report-1)." />
      </MarkdownLinksProvider>
    );
    const link = screen.getByRole('link', { name: 'the report' });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    fireEvent(link, event);
    expect(event.defaultPrevented).toBe(true);
    expect(onLinkClick).toHaveBeenCalledWith('ARTIFACT:report-1', expect.anything());
  });

  it('takes the handler from its own props too', () => {
    const onLinkClick = jest.fn();
    render(<Markdown content="[docs](https://example.com)" onLinkClick={onLinkClick} />);
    fireEvent.click(screen.getByRole('link', { name: 'docs' }));
    expect(onLinkClick).toHaveBeenCalledWith('https://example.com', expect.anything());
  });
});
