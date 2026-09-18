import React from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { act, render as rtlRender } from '@testing-library/react';
import { AgentChat } from '../AgentChat/AgentChat';
import { ChatLabelsProvider } from '../labels/chat-labels';
import { quietPresentation } from '../quiet/quiet-presentation';
import type { ChatMessage, ToolPart } from '../types';
import { ThinkingTool } from './ThinkingTool';

const ru = {
  thinkingTool: { thinking: 'Думаю', thought: (duration: string) => `Думал ${duration}` },
  durationUnits: { seconds: ' с' },
};

function thinking(thought: string, state: ToolPart['state']): ToolPart {
  return { type: 'tool-Thinking', toolCallId: 'th1', state, input: { thought } };
}

// `render` of `@mantine-tests/core` remounts the tree on the first `rerender`, which would restart the clock.
function renderStable(ui: React.ReactElement) {
  return rtlRender(ui, {
    wrapper: ({ children }) => <MantineProvider env="test">{children}</MantineProvider>,
  });
}

describe('tools/ThinkingTool labels', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts the thought from its first render to the moment it is complete', () => {
    const { rerender } = renderStable(
      <ChatLabelsProvider labels={ru}>
        <ThinkingTool part={thinking('Сначала', 'input-streaming')} />
      </ChatLabelsProvider>
    );
    expect(screen.getByText('Думаю')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2500);
    });
    expect(screen.getByText('2 с')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    rerender(
      <ChatLabelsProvider labels={ru}>
        <ThinkingTool part={thinking('Сначала **задачи**, потом сроки.', 'output-available')} />
      </ChatLabelsProvider>
    );
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByText('Думал 4 с')).toBeInTheDocument();
  });

  it('keeps the English defaults and names no duration it has not seen', () => {
    render(<ThinkingTool part={thinking('Done', 'output-available')} />);
    expect(screen.getByText('Thought')).toBeInTheDocument();
  });

  it('renders the thought through the markdown of the kit', () => {
    const { container } = render(
      <ThinkingTool part={thinking('Сначала **задачи**', 'output-available')} defaultOpen />
    );
    expect(container.querySelector('strong')).toHaveTextContent('задачи');
  });

  it('takes the quiet look of a tool call in the quiet presentation', () => {
    jest.useRealTimers();
    const messages = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Что просрочено?' }] },
      {
        id: 'a1',
        role: 'assistant',
        parts: [thinking('Посмотрю задачи с истёкшим сроком.', 'output-available')],
      },
    ] as ChatMessage[];
    const { container } = render(
      <AgentChat
        messages={messages}
        status="ready"
        onSend={() => {}}
        onStop={() => {}}
        slots={{ InputBar: () => null }}
        presentation={quietPresentation}
        labels={{ ...ru, messageList: { toolRuns: { thought: 'думал' } } }}
      />
    );

    expect(screen.getByText('Думал')).toBeInTheDocument();
    expect(container.querySelector('.quiet')).not.toBeNull();
  });
});
