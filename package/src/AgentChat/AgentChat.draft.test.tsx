import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { AgentChat } from './AgentChat';

function wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider env="test">{children}</MantineProvider>;
}

describe('AgentChat draft', () => {
  it('shows a controlled draft without taking the focus and reports every change', () => {
    const changes: string[] = [];
    const onSend = jest.fn();
    function Host() {
      const [draft, setDraft] = useState('Explain the selected code');
      return (
        <>
          <button type="button">Outside</button>
          <AgentChat
            messages={[]}
            status="ready"
            onSend={onSend}
            onStop={() => {}}
            draft={draft}
            onDraftChange={(value) => {
              changes.push(value);
              setDraft(value);
            }}
          />
        </>
      );
    }
    render(<Host />, { wrapper });
    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();
    const field = screen.getByRole('textbox');
    expect(field).toHaveValue('Explain the selected code');
    expect(outside).toHaveFocus();

    fireEvent.change(field, { target: { value: 'Explain it' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ content: 'Explain it' }));
    expect(changes).toEqual(['Explain it', '']);
    expect(field).toHaveValue('');
  });

  it('keeps its own draft when uncontrolled', () => {
    render(<AgentChat messages={[]} status="ready" onSend={() => {}} onStop={() => {}} />, {
      wrapper,
    });
    const field = screen.getByRole('textbox');
    fireEvent.change(field, { target: { value: 'hello' } });
    expect(field).toHaveValue('hello');
  });
});
