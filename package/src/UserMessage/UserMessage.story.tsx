import React from 'react';
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
