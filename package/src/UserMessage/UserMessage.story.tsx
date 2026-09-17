import React from 'react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import type { ChatMessage } from '../types';
import { UserMessage } from './UserMessage';

export default { title: 'UserMessage' };

const IMAGE_URL = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="royalblue"/><circle cx="160" cy="100" r="60" fill="white"/></svg>'
)}`;

const textMessage: ChatMessage = {
  id: 'u1',
  role: 'user',
  parts: [{ type: 'text', text: 'Refactor the auth module and add tests for token refresh.' }],
};

const imageMessage: ChatMessage = {
  id: 'u2',
  role: 'user',
  parts: [
    { type: 'file', mediaType: 'image/svg+xml', url: IMAGE_URL, filename: 'mockup.svg' },
    { type: 'text', text: 'Can you match this layout?' },
  ],
};

const fileMessage: ChatMessage = {
  id: 'u3',
  role: 'user',
  parts: [
    { type: 'file', mediaType: 'application/pdf', filename: 'spec.pdf', size: 245_760 },
    { type: 'file', mediaType: 'text/csv', filename: 'data.csv', size: 12_288 },
    { type: 'text', text: 'Summarize these two files.\nKeep it under 200 words.' },
  ],
};

export function Usage() {
  return (
    <div style={{ padding: 40, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UserMessage message={textMessage} />
      <UserMessage message={imageMessage} />
      <UserMessage message={fileMessage} />
    </div>
  );
}

export function WithoutImagePreview() {
  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <UserMessage message={imageMessage} enableImagePreview={false} />
    </div>
  );
}

const LONG_TEXT = Array.from({ length: 60 }, (_, index) => `line ${index + 1}`).join('\n');

export function LongTextFlow() {
  return (
    <div style={{ padding: 40, maxWidth: 420 }}>
      <UserMessage
        message={{ id: 'long', role: 'user', parts: [{ type: 'text', text: LONG_TEXT }] }}
        longMessageThreshold
      />
    </div>
  );
}

LongTextFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvasElement).not.toHaveTextContent('line 30');
  await expect(canvasElement).toHaveTextContent('line 60');
  const expand = canvas.getByRole('button', { name: 'Show full message (45 more lines)' });
  await expect(expand).toHaveAttribute('aria-expanded', 'false');
  await userEvent.click(expand);
  await waitFor(() => expect(canvasElement).toHaveTextContent('line 30'));
  await userEvent.click(canvas.getByRole('button', { name: 'Show less' }));
  await waitFor(() => expect(canvasElement).not.toHaveTextContent('line 30'));
};

export function SlashCommandFlow() {
  const commands = [{ name: 'review', description: 'Review changes in a path' }];
  return (
    <div style={{ padding: 40, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <UserMessage
        message={{ id: 'cmd', role: 'user', parts: [{ type: 'text', text: '/review src/auth' }] }}
        commands={commands}
      />
      <UserMessage
        message={{ id: 'path', role: 'user', parts: [{ type: 'text', text: '/usr/bin is empty' }] }}
        commands={commands}
      />
    </div>
  );
}

SlashCommandFlow.play = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const canvas = within(canvasElement);
  await expect(canvasElement.querySelector('[data-command="review"]')).toHaveTextContent('review');
  await expect(canvas.getByText('src/auth')).toBeInTheDocument();
  await expect(canvas.getByText('/usr/bin is empty')).toBeInTheDocument();
};
