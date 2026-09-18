import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ChatLabelsProvider } from '../labels/chat-labels';
import { TurnSummary } from './TurnSummary';

describe('TurnSummary units', () => {
  it('reads the duration in the units of the chat', () => {
    render(
      <ChatLabelsProvider
        labels={{
          turnSummary: { worked: (duration) => `Заняло ${duration}` },
          durationUnits: { seconds: ' с' },
        }}
      >
        <TurnSummary durationMs={11_000} />
      </ChatLabelsProvider>
    );

    expect(screen.getByText('Заняло 11 с')).toBeInTheDocument();
  });
});
