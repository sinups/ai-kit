import React from 'react';
import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import type { ChatMessage, SendScroll } from '../types';
import { MessageList } from './MessageList';

function render(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

const history: ChatMessage[] = [
  { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'First' }] },
  { id: 'a1', role: 'assistant', parts: [{ type: 'text', text: 'First answer' }] },
];

function turn(answer: string): ChatMessage[] {
  return [
    ...history,
    { id: 'u2', role: 'user', parts: [{ type: 'text', text: 'Next' }] },
    { id: 'a2', role: 'assistant', parts: [{ type: 'text', text: answer }] },
  ];
}

const VIEWPORT = 600;

/** A list whose content height the test sets; the new turn sits 800px down the content */
function setup(sendScroll: SendScroll) {
  const utils = render(<MessageList messages={history} status="ready" sendScroll={sendScroll} />);
  const list = utils.container.querySelector<HTMLElement>('[role="log"]')!;
  let height = 1400;
  Object.defineProperty(list, 'scrollHeight', { configurable: true, get: () => height });
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: VIEWPORT });
  list.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
    return (
      this.dataset.turnKey === 'u2' ? { top: 100 + 800 - list.scrollTop } : { top: 0, height: 0 }
    ) as DOMRect;
  };
  list.scrollTop = 200;
  act(() => {
    utils.rerender(<MessageList messages={turn('')} status="streaming" sendScroll={sendScroll} />);
  });
  HTMLElement.prototype.getBoundingClientRect = originalRect;
  // The scroll to the question fires its own event, while the short answer leaves the list at its bottom.
  fireEvent.scroll(list);

  const grow = (to: number, answer: string) => {
    height = to;
    act(() => {
      utils.rerender(
        <MessageList messages={turn(answer)} status="streaming" sendScroll={sendScroll} />
      );
    });
    // Scroll anchoring and the layout of the grown answer fire a scroll without a gesture.
    fireEvent.scroll(list);
  };
  return { list, grow };
}

describe('MessageList prompt-top-hold', () => {
  it('keeps the question in place while the answer grows past the viewport', async () => {
    const { list, grow } = setup('prompt-top-hold');
    expect(list.scrollTop).toBe(800);

    grow(3000, 'A long answer');
    grow(4000, 'A long answer that keeps growing');
    expect(list.scrollTop).toBe(800);
    expect(await screen.findByRole('button', { name: '1 new message' })).toBeInTheDocument();
  });

  it('follows again once the user scrolls to the bottom', () => {
    const { list, grow } = setup('prompt-top-hold');
    grow(3000, 'A long answer');

    fireEvent.wheel(list, { deltaY: 400 });
    list.scrollTop = 3000 - VIEWPORT;
    fireEvent.scroll(list);
    expect(screen.queryByRole('button', { name: /new message/ })).toBeNull();

    grow(3500, 'A long answer that keeps growing');
    expect(list.scrollTop).toBe(3500);
  });

  it('does not follow after a scroll to the bottom without a gesture', () => {
    const { list, grow } = setup('prompt-top-hold');
    grow(3000, 'A long answer');

    list.scrollTop = 3000 - VIEWPORT;
    fireEvent.scroll(list);
    grow(3500, 'A long answer that keeps growing');
    expect(list.scrollTop).toBe(3000 - VIEWPORT);
  });

  it('follows after a keyboard scroll', () => {
    const keyboard = setup('prompt-top-hold');
    keyboard.grow(3000, 'A long answer');
    fireEvent.keyDown(keyboard.list, { key: 'End' });
    keyboard.list.scrollTop = 3000 - VIEWPORT;
    fireEvent.scroll(keyboard.list);
    keyboard.grow(3500, 'A long answer that keeps growing');
    expect(keyboard.list.scrollTop).toBe(3500);
  });

  it('follows after the new messages button', async () => {
    const { list, grow } = setup('prompt-top-hold');
    list.scrollTo = () => {};
    grow(3000, 'A long answer');
    fireEvent.click(await screen.findByRole('button', { name: '1 new message' }));
    grow(3500, 'A long answer that keeps growing');
    expect(list.scrollTop).toBe(3500);
  });

  it('hides the button while the answer still fits under the question', () => {
    const { grow } = setup('prompt-top-hold');
    grow(1400, 'Short');
    expect(screen.queryByRole('button', { name: /new message/ })).toBeNull();
  });

  it('lets plain prompt-top follow the answer once it reaches the bottom', () => {
    const { list, grow } = setup('prompt-top');
    grow(3000, 'A long answer');
    grow(4000, 'A long answer that keeps growing');
    expect(list.scrollTop).toBe(4000);
  });
});
