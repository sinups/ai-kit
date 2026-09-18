import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { fireEvent, waitFor } from '@testing-library/react';
import { Modal, Textarea } from '@mantine/core';
import { ModelPicker } from './ModelPicker';
import { ModeSelector } from './ModeSelector';

const modes = [
  { id: 'agent', label: 'Agent' },
  { id: 'plan', label: 'Plan' },
];

const models = [
  { id: 'deepseek-v3', name: 'DeepSeek', version: 'V3' },
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', version: '32B' },
];

describe('input/InputPopover', () => {
  it.each([
    ['ModeSelector', () => <ModeSelector modes={modes} defaultValue="agent" />, 'Select mode'],
    [
      'ModelPicker',
      () => <ModelPicker models={models} defaultValue="deepseek-v3" />,
      'Select model',
    ],
  ])('%s closes on Escape and gives the focus back to its trigger', async (_, picker, name) => {
    render(picker());
    const trigger = screen.getByRole('button', { name });

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(trigger, { key: 'Escape' });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(trigger).toHaveFocus();
  });

  it.each([
    ['ModeSelector', () => <ModeSelector modes={modes} defaultValue="agent" />, 'Select mode'],
    [
      'ModelPicker',
      () => <ModelPicker models={models} defaultValue="deepseek-v3" />,
      'Select model',
    ],
  ])('%s closes on a click outside of it', async (_, picker, name) => {
    render(
      <>
        <p>Transcript</p>
        {picker()}
      </>
    );
    const trigger = screen.getByRole('button', { name });

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByText('Transcript'));
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
  });

  it('closes only the picker when it sits in a modal', async () => {
    const onClose = jest.fn();
    render(
      <Modal opened onClose={onClose} title="Settings">
        <ModeSelector modes={modes} defaultValue="agent" />
      </Modal>
    );
    const trigger = screen.getByRole('button', { name: 'Select mode' });
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(onClose).not.toHaveBeenCalled();

    await userEvent.click(trigger);
    screen.getByRole('button', { name: /Plan/ }).focus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'false'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('keeps the picker open on Escape pressed in the text field', async () => {
    render(
      <>
        <Textarea aria-label="Message" />
        <ModeSelector modes={modes} defaultValue="agent" />
      </>
    );
    const trigger = screen.getByRole('button', { name: 'Select mode' });
    await userEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Message' }), { key: 'Escape' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });
});
