import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { IconPin } from '@tabler/icons-react';
import { MessageActionButton } from './MessageActionButton';
import { MessageActions } from '../MessageActions/MessageActions';

describe('message-actions/MessageActionButton', () => {
  it('sits in the toolbar after the built-in actions and is reached from the keyboard', async () => {
    const onPin = jest.fn();
    render(
      <MessageActions
        messageRole="assistant"
        text="Answer"
        visibility="hover"
        actions={<MessageActionButton label="Pin" icon={<IconPin size={16} />} onClick={onPin} />}
      />
    );
    const toolbar = screen.getByRole('toolbar');
    const buttons = Array.from(toolbar.querySelectorAll('button'));
    expect(buttons.at(-1)).toHaveAccessibleName('Pin');

    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onPin).toHaveBeenCalledTimes(1);
  });

  it('reports a pressed toggle and a disabled action', () => {
    render(
      <>
        <MessageActionButton label="Saved" icon={<IconPin size={16} />} active />
        <MessageActionButton label="Share" icon={<IconPin size={16} />} disabled />
      </>
    );
    expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Share' })).toBeDisabled();
  });
});
