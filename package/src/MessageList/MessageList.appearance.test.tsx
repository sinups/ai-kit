import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render as rtlRender } from '@testing-library/react';
import type { ChatMessage } from '../types';
import { MessageList } from './MessageList';

// `render` of `@mantine-tests/core` wraps the tree in a fragment that `rerender` drops, which
// remounts the list and loses the memory of what was already on screen.
function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

const transcript: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'First question' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'First answer' }] },
];

const withReply: ChatMessage[] = [
  ...transcript,
  { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Second question' }] },
  { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: 'Second answer' }] },
];

function appearing(container: HTMLElement) {
  return container.querySelectorAll('.appear');
}

describe('MessageList appearance', () => {
  it('does not animate the transcript that is already on screen at mount', () => {
    const { container } = render(
      <MessageList messages={transcript} status="ready" animateAppearance />
    );

    expect(appearing(container)).toHaveLength(0);
  });

  it('animates a message and a part that arrive later', () => {
    const { container, rerender } = render(
      <MessageList messages={transcript} status="ready" animateAppearance />
    );

    rerender(<MessageList messages={withReply} status="ready" animateAppearance />);

    const animated = Array.from(appearing(container));
    expect(animated).toHaveLength(2);
    expect(animated.map((element) => element.textContent)).toEqual([
      'Second question',
      'Second answer',
    ]);
  });

  it('animates a part appended to a message that is already on screen', () => {
    const { container, rerender } = render(
      <MessageList messages={transcript} status="ready" animateAppearance />
    );

    const grown: ChatMessage[] = [
      transcript[0],
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'text', text: 'First answer' },
          { type: 'text', text: 'One more thought' },
        ],
      },
    ];
    rerender(<MessageList messages={grown} status="ready" animateAppearance />);

    const animated = Array.from(appearing(container));
    expect(animated.map((element) => element.textContent)).toEqual(['One more thought']);
  });

  it('keeps the animation off without the prop', () => {
    const { container, rerender } = render(<MessageList messages={transcript} status="ready" />);

    rerender(<MessageList messages={withReply} status="ready" />);

    expect(appearing(container)).toHaveLength(0);
  });

  it('is inert under prefers-reduced-motion', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      ...matchMedia(query),
      matches: query === '(prefers-reduced-motion: reduce)',
    })) as typeof window.matchMedia;

    const { container, rerender } = render(
      <MessageList messages={transcript} status="ready" animateAppearance />
    );
    rerender(<MessageList messages={withReply} status="ready" animateAppearance />);

    expect(appearing(container)).toHaveLength(0);
    window.matchMedia = matchMedia;
  });
});
