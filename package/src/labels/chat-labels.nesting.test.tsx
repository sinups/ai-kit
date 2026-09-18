import React, { memo } from 'react';
import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { AgentChat } from '../AgentChat/AgentChat';
import type { ChatMessage } from '../types';
import { ChatLabelsProvider, useChatLabels } from './chat-labels';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider>{children}</MantineProvider>;
}

const renders = jest.fn();

const TitleProbe = memo(function TitleProbe() {
  const labels = useChatLabels('errorMessage');
  renders();
  return <span data-testid="probe">{`${labels?.title ?? ''}|${labels?.retry ?? ''}`}</span>;
});

const failed: ChatMessage[] = [{ id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }];

describe('labels/ChatLabelsProvider nesting', () => {
  beforeEach(() => renders.mockClear());

  it('merges a nested provider into the outer one section by section', () => {
    render(
      <ChatLabelsProvider labels={{ errorMessage: { title: 'Ошибка', retry: 'Повторить' } }}>
        <ChatLabelsProvider labels={{ errorMessage: { retry: 'Ещё раз' } }}>
          <TitleProbe />
        </ChatLabelsProvider>
      </ChatLabelsProvider>,
      { wrapper }
    );
    expect(screen.getByTestId('probe')).toHaveTextContent('Ошибка|Ещё раз');
  });

  it('keeps the outer provider inside AgentChat', () => {
    render(
      <ChatLabelsProvider labels={{ errorMessage: { retry: 'Повторить' } }}>
        <AgentChat
          messages={failed}
          status="error"
          error={new Error('Timeout')}
          onSend={() => {}}
          onStop={() => {}}
          onRetry={() => {}}
          labels={{ durationUnits: { seconds: ' с' } }}
        />
      </ChatLabelsProvider>,
      { wrapper }
    );
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  it('keeps the context value while equal labels arrive as new objects', () => {
    const { rerender } = render(
      <ChatLabelsProvider labels={{ errorMessage: { title: 'Ошибка' } }}>
        <TitleProbe />
      </ChatLabelsProvider>,
      { wrapper }
    );
    rerender(
      <ChatLabelsProvider labels={{ errorMessage: { title: 'Ошибка' } }}>
        <TitleProbe />
      </ChatLabelsProvider>
    );
    expect(renders).toHaveBeenCalledTimes(1);

    rerender(
      <ChatLabelsProvider labels={{ errorMessage: { title: 'Сбой' } }}>
        <TitleProbe />
      </ChatLabelsProvider>
    );
    expect(renders).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('probe')).toHaveTextContent('Сбой|');
  });
});
