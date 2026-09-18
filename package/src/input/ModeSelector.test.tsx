import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { fireEvent } from '@testing-library/react';
import { ModeSelector } from './ModeSelector';

const modes = [
  { id: 'agent', label: 'Agent' },
  { id: 'plan', label: 'Plan' },
];

describe('input/ModeSelector', () => {
  it('takes the trigger name from labels', () => {
    const { rerender } = render(<ModeSelector modes={modes} defaultValue="agent" />);
    expect(screen.getByRole('button', { name: 'Select mode' })).toBeInTheDocument();

    rerender(<ModeSelector modes={modes} defaultValue="agent" labels={{ trigger: 'Modus' }} />);
    expect(screen.getByRole('button', { name: 'Modus' })).toBeInTheDocument();
  });

  it('keeps the plain menu unless a title, badges or shortcuts are asked for', async () => {
    render(<ModeSelector modes={modes} defaultValue="agent" />);
    await userEvent.click(screen.getByRole('button', { name: 'Select mode' }));

    expect(screen.getByText('Plan')).toBeInTheDocument();
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('Mode')).toBeNull();
  });

  it('heads the menu, marks the default mode and numbers the modes', async () => {
    render(
      <ModeSelector
        modes={[
          {
            id: 'ask',
            label: 'Спрашивать',
            description: 'Подтверждать каждый вызов',
            badge: 'По умолчанию',
          },
          { id: 'auto', label: 'Автоматически', description: 'Выполнять без вопросов' },
          { id: 'plan', label: 'План', description: 'Сначала составить план' },
        ]}
        defaultValue="ask"
        shortcuts
        labels={{ title: 'Режим' }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Select mode' }));

    expect(screen.getByText('Режим')).toBeInTheDocument();
    expect(screen.getByText('По умолчанию')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('picks a mode by its digit while the menu is open, and only then', async () => {
    const onChange = jest.fn();
    render(<ModeSelector modes={modes} defaultValue="agent" shortcuts onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Select mode' });
    fireEvent.keyDown(trigger, { key: '2' });
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: '2', metaKey: true });
    fireEvent.keyDown(trigger, { key: '2', ctrlKey: true });
    fireEvent.keyDown(trigger, { key: '2', altKey: true });
    fireEvent.keyDown(trigger, { key: '2', repeat: true });
    fireEvent.keyDown(trigger, { key: '2', isComposing: true });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(trigger, { key: '2' });
    expect(onChange).toHaveBeenCalledWith('plan');
  });

  it('picks a mode by its digit from inside the menu and names the shortcut', async () => {
    const onChange = jest.fn();
    render(<ModeSelector modes={modes} defaultValue="agent" shortcuts onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Select mode' }));
    const option = screen.getByRole('button', { name: /Plan/ });
    expect(option).toHaveAttribute('aria-keyshortcuts', '2');

    fireEvent.keyDown(option, { key: '1' });
    expect(onChange).toHaveBeenCalledWith('agent');
  });

  it('leaves digits typed into an editable element alone', async () => {
    const onChange = jest.fn();
    render(
      <>
        <div contentEditable="plaintext-only" aria-label="editor" role="textbox" />
        <select aria-label="size">
          <option>1</option>
        </select>
        <ModeSelector modes={modes} defaultValue="agent" shortcuts onChange={onChange} />
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Select mode' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'editor' }), { key: '2' });
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'size' }), { key: '2' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('leaves digits typed into a text field alone', async () => {
    const onChange = jest.fn();
    render(
      <>
        <textarea aria-label="composer" />
        <ModeSelector modes={modes} defaultValue="agent" shortcuts onChange={onChange} />
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Select mode' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'composer' }), { key: '2' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
