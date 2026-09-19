import React from 'react';
import { MantineProvider } from '@mantine/core';
import { act, fireEvent, render as rtlRender, screen } from '@testing-library/react';
import type { ChatMessage, ChatStatus, SendScroll } from '../types';
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

const question = (id: string): ChatMessage => ({
  id,
  role: 'user',
  parts: [{ type: 'text', text: 'Next' }],
});

const answer = (id: string, text = 'Checking'): ChatMessage => ({
  id,
  role: 'assistant',
  parts: [
    {
      type: 'tool-Read',
      toolCallId: `${id}-read`,
      state: 'output-available',
      input: { file_path: '/repo/a.ts' },
      output: 'done',
    },
    { type: 'text', text },
  ] as ChatMessage['parts'],
});

const VIEWPORT = 600;

function frames(count = 3) {
  return act(async () => {
    for (let index = 0; index < count; index += 1) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
    }
  });
}

/** Renders the history, then sends; the new turn sits 800px down and the content ends at `height` */
function setup(sendScroll: SendScroll) {
  const utils = render(<MessageList messages={history} status="ready" sendScroll={sendScroll} />);
  const list = utils.container.querySelector<HTMLElement>('[role="log"]')!;
  let height = 1400;
  Object.defineProperty(list, 'scrollHeight', { configurable: true, get: () => height });
  Object.defineProperty(list, 'clientHeight', { configurable: true, value: VIEWPORT });
  list.getBoundingClientRect = () => ({ top: 100 }) as DOMRect;
  list.scrollTo = () => {};

  const show = (messages: ChatMessage[], status: ChatStatus = 'streaming', to = height) => {
    height = to;
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function rect(this: HTMLElement) {
      return (
        this.dataset.turnKey?.startsWith('u2')
          ? { top: 100 + 800 - list.scrollTop }
          : { top: 0, height: 0 }
      ) as DOMRect;
    };
    act(() => {
      utils.rerender(<MessageList messages={messages} status={status} sendScroll={sendScroll} />);
    });
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  };
  return { list, show };
}

function watchButton() {
  const seen: string[] = [];
  const observer = new MutationObserver(() => {
    const button = screen.queryByRole('button', { name: /new message/ });
    if (button) {
      seen.push(button.textContent ?? '');
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return { seen, stop: () => observer.disconnect() };
}

describe('MessageList new messages button', () => {
  it.each<SendScroll>(['prompt-top', 'prompt-top-hold'])(
    'stays hidden in %s while the whole answer is in view',
    async (mode) => {
      const { list, show } = setup(mode);
      const watch = watchButton();
      list.scrollTop = 200;
      show([...history, question('u2'), answer('a2')]);
      show([...history, question('u2'), answer('a2'), answer('a3', 'Done')], 'ready');
      await frames();
      watch.stop();
      expect(list.scrollTop + VIEWPORT).toBe(1400);
      expect(watch.seen).toEqual([]);
    }
  );

  it('never shows the button for a single frame while a send scrolls the list', async () => {
    const { list, show } = setup('prompt-top');
    list.scrollTop = 200;
    fireEvent.scroll(list);
    const watch = watchButton();
    show([...history, question('u2')], 'submitted');
    show([...history, question('u2'), answer('pending-reply')]);
    fireEvent.scroll(list);
    await frames();
    watch.stop();
    expect(watch.seen).toEqual([]);
  });

  it('counts a reply that replaced its placeholder as the same message', async () => {
    const { list, show } = setup('prompt-top-hold');
    list.scrollTop = 200;
    show([...history, question('u2'), answer('pending-reply')]);
    show([...history, question('u2'), answer('pending-reply', 'A long answer')], 'streaming', 3000);
    fireEvent.scroll(list);
    expect(await screen.findByRole('button', { name: '1 new message' })).toBeInTheDocument();

    show([...history, question('u2-saved'), answer('a2', 'A long answer')], 'ready', 3000);
    await frames();
    expect(screen.getByRole('button', { name: '1 new message' })).toBeInTheDocument();
    expect(list.scrollTop).toBe(800);
  });

  it('does not count a seen message whose id the server replaced', async () => {
    const { list, show } = setup('bottom');
    list.scrollTop = 400;
    fireEvent.scroll(list);
    list.scrollTop = 100;
    fireEvent.scroll(list);
    show([history[0], { ...history[1], id: 'a1-saved' }], 'ready', 1400);
    await frames();
    expect(screen.queryByRole('button', { name: /new message/ })).toBeNull();
  });
});
