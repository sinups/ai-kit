import React, { useMemo, useState } from 'react';
import { expect, within } from '@storybook/test';
import { Badge, Stack } from '@mantine/core';
import { MessageList } from '../../MessageList/MessageList';
import type { ChatMessage } from '../../types';
import { createMediaPartRenderers } from './MediaPart';

export default { title: 'Messages/MediaPart' };

const CHART = `data:image/svg+xml;base64,${btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="160"><rect width="320" height="160" fill="aliceblue"/><rect x="24" y="90" width="40" height="50" fill="steelblue"/><rect x="84" y="60" width="40" height="80" fill="steelblue"/><rect x="144" y="40" width="40" height="100" fill="steelblue"/><rect x="204" y="20" width="40" height="120" fill="steelblue"/></svg>'
)}`;

const MESSAGES: ChatMessage[] = [
  {
    id: 'u1',
    role: 'user',
    parts: [{ type: 'text', text: 'Send me the chart, the call and the spec' }],
  },
  {
    id: 'a1',
    role: 'assistant',
    parts: [
      { type: 'text', text: 'Here is everything from the review:' },
      { type: 'file', mediaType: 'image/svg+xml', url: CHART, filename: 'signups.svg' },
      {
        type: 'file',
        mediaType: 'audio/mpeg',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
        filename: 'review-call.mp3',
      },
      {
        type: 'file',
        mediaType: 'video/mp4',
        url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        filename: 'demo.mp4',
      },
      {
        type: 'file',
        mediaType: 'application/pdf',
        url: 'https://example.com/spec.pdf',
        filename: 'spec.pdf',
        size: 182_000,
      },
      { type: 'file', mediaType: 'text/csv', filename: 'signups.csv', size: 2_400 },
    ],
  },
];

function MediaDemo() {
  const [opened, setOpened] = useState('none');
  const renderers = useMemo(
    () => createMediaPartRenderers({ onOpenFile: (part) => setOpened(part.filename ?? '') }),
    []
  );
  return (
    <Stack p="xl" maw={640} h="85vh" gap="xs">
      <Badge variant="light" w="fit-content">{`Opened: ${opened}`}</Badge>
      <MessageList messages={MESSAGES} status="ready" partRenderers={renderers} />
    </Stack>
  );
}

export const Usage = {
  render: () => <MediaDemo />,
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('img', { name: 'signups.svg' })).toBeVisible();
    await expect(canvasElement.querySelector('audio')).toHaveAttribute(
      'aria-label',
      'Audio: review-call.mp3'
    );
    await expect(canvasElement.querySelector('video')).toHaveAttribute(
      'aria-label',
      'Video: demo.mp4'
    );
  },
};
