import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import type { ChatMessage } from '../types';
import { UserMessage } from './UserMessage';

describe('UserMessage/UserMessage', () => {
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
  it('renders a known slash command as a chip and leaves other slashes as text', () => {
    const commands = [{ name: 'review', description: 'Review code' }];
    const { unmount } = render(
      <UserMessage
        message={{ id: 'u4', role: 'user', parts: [{ type: 'text', text: '/review src/auth' }] }}
        commands={commands}
      />
    );
    expect(screen.getByText('review')).toBeInTheDocument();
    expect(screen.getByText('src/auth')).toBeInTheDocument();
    unmount();

    render(
      <UserMessage
        message={{ id: 'u5', role: 'user', parts: [{ type: 'text', text: '/usr/bin is empty' }] }}
        commands={commands}
      />
    );
    expect(screen.getByText('/usr/bin is empty')).toBeInTheDocument();
  });

  it('collapses a long message to head and tail and expands it', async () => {
    const text = Array.from({ length: 60 }, (_, i) => `line ${i + 1}`).join('\n');
    const { container } = render(
      <UserMessage
        message={{ id: 'u6', role: 'user', parts: [{ type: 'text', text }] }}
        longMessageThreshold
      />
    );
    expect(container.textContent).not.toContain('line 30');
    expect(container.textContent).toContain('line 60');
    const button = screen.getByRole('button', { name: 'Show full message (45 more lines)' });
    await userEvent.click(button);
    expect(container.textContent).toContain('line 30');
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();
  });

  it('shows the full text by default', () => {
    const text = 'x'.repeat(5000);
    render(<UserMessage message={{ id: 'u7', role: 'user', parts: [{ type: 'text', text }] }} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });
});
