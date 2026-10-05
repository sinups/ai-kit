import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { MessageList } from './MessageList';

const picture = 'https://example.com/shot.png';

const conversation: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [
      { type: 'text', text: 'Here is the pair I meant' },
      { type: 'file', url: picture, mediaType: 'image/png', filename: 'sneaker.png' },
    ],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Sales of that model:' },
      { type: 'file', url: picture, mediaType: 'image/png', filename: 'quarter.png' },
    ],
  },
];

describe('MessageList/a file in an answer', () => {
  it('shows a picture from either side of the conversation', () => {
    render(<MessageList messages={conversation} status="ready" />);

    expect(screen.getByAltText('sneaker.png')).toBeInTheDocument();
    expect(screen.getByAltText('quarter.png')).toBeInTheDocument();
  });

  it('opens the picture of an answer unless the host says otherwise', () => {
    const { rerender } = render(<MessageList messages={conversation} status="ready" />);
    expect(screen.getAllByRole('button', { name: 'Open image preview' }).length).toBeGreaterThan(0);

    rerender(<MessageList messages={conversation} status="ready" enableImagePreview={false} />);
    expect(screen.queryByRole('button', { name: 'Open image preview' })).toBeNull();
    expect(screen.getByAltText('quarter.png')).toBeInTheDocument();
  });

  it('shows anything that is not media as a file chip', () => {
    const withFile: ChatMessage[] = [
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          {
            type: 'file',
            url: 'https://example.com/warranty.pdf',
            mediaType: 'application/pdf',
            filename: 'warranty.pdf',
            size: 182_400,
          },
        ],
      },
    ];
    render(<MessageList messages={withFile} status="ready" />);
    expect(screen.getByText('warranty.pdf')).toBeInTheDocument();
  });

  it('leaves the part to the host when it brought its own renderer', () => {
    const Custom = () => <div>custom media</div>;
    render(<MessageList messages={conversation} status="ready" partRenderers={{ file: Custom }} />);
    expect(screen.getByText('custom media')).toBeInTheDocument();
    expect(screen.queryByAltText('quarter.png')).toBeNull();
  });
});
