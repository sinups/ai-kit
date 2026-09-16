import React from 'react';
import { render, screen } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { UserMessage } from './UserMessage';

describe('UserMessage', () => {
  it('renders text, image parts, file images and non-image files', () => {
    const message: ChatMessage = {
      id: 'u1',
      role: 'user',
      parts: [
        { type: 'text', text: 'Look at this' },
        { type: 'image', url: 'https://example.com/a.png' },
        { type: 'file', mediaType: 'image/png', data: 'AAAA' },
        { type: 'file', mediaType: 'application/pdf', filename: 'report.pdf', size: 2048 },
      ],
    };
    render(<UserMessage message={message} />);
    expect(screen.getByText('Look at this')).toBeInTheDocument();
    const images = screen.getAllByRole('img', { name: 'attachment' });
    expect(images.map((img) => img.getAttribute('src'))).toEqual([
      'https://example.com/a.png',
      'data:image/png;base64,AAAA',
    ]);
    expect(screen.getByText('report.pdf')).toBeInTheDocument();
  });

  it('renders image experimental_attachments', () => {
    const message: ChatMessage = {
      id: 'u2',
      role: 'user',
      parts: [],
      experimental_attachments: [
        { contentType: 'image/jpeg', url: 'https://example.com/b.jpg' },
        { contentType: 'text/plain', url: 'https://example.com/c.txt' },
      ],
    };
    render(<UserMessage message={message} enableImagePreview={false} />);
    const images = screen.getAllByRole('img', { name: 'attachment' });
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/b.jpg');
    expect(screen.queryByRole('button', { name: 'Open image preview' })).toBeNull();
  });

  it('renders nothing for an empty message', () => {
    const { container } = render(<UserMessage message={{ id: 'u3', role: 'user', parts: [] }} />);
    expect(container.querySelector('p')).toBeNull();
  });
});
