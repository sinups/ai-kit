import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ToolResultContent } from './ToolResultContent';

describe('tools/ToolResultContent', () => {
  it('shows images, audio and resources of an MCP result by their block type', () => {
    const { container } = render(
      <ToolResultContent
        messageId="c1"
        result={{
          content: [
            { type: 'text', text: 'Two files' },
            { type: 'image', data: 'iVBORw0KGgo=', mimeType: 'image/png' },
            { type: 'audio', data: 'AAA=', mimeType: 'audio/mpeg' },
            {
              type: 'resource_link',
              uri: 'https://example.com/spec.pdf',
              name: 'spec.pdf',
              title: 'Spec',
            },
            { type: 'resource', resource: { uri: 'file:///var/log/app.log', text: 'log' } },
          ],
        }}
      />
    );
    expect(screen.getByRole('img', { name: 'image/png' })).toHaveAttribute(
      'src',
      'data:image/png;base64,iVBORw0KGgo='
    );
    expect(container.querySelector('audio')).toHaveAttribute('src', 'data:audio/mpeg;base64,AAA=');
    expect(screen.getByRole('link', { name: 'Spec' })).toHaveAttribute(
      'href',
      'https://example.com/spec.pdf'
    );
    expect(screen.getByText('file:///var/log/app.log').closest('a')).toBeNull();
    expect(screen.queryByText('Two files')).toBeNull();
  });

  it('keeps unsafe media types out of the page and renders nothing for text only', () => {
    const { container } = render(
      <ToolResultContent
        messageId="c1"
        result={{ content: [{ type: 'image', data: 'PHN2Zz4=', mimeType: 'text/html' }] }}
      />
    );
    expect(container.querySelector('img')).toBeNull();
    render(
      <ToolResultContent messageId="c2" result={{ content: [{ type: 'text', text: 'x' }] }} />
    );
  });
});
