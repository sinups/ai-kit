import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { DEFAULT_MIC_BUTTON_LABELS, MicButton, type MicState } from './MicButton';

describe('voice/MicButton', () => {
  const cases: [MicState, string, boolean][] = [
    ['idle', '', false],
    ['requesting', 'Requesting microphone', false],
    ['listening', '', true],
    ['processing', 'Transcribing', false],
    ['error', 'Permission denied', false],
    ['unsupported', "Voice input isn't supported in this browser", false],
  ];

  it.each(cases)('keeps one name and describes the %s state', (state, description, pressed) => {
    render(<MicButton state={state} error="Permission denied" />);
    const button = screen.getByRole('button', { name: 'Dictation' });
    expect(button).toHaveAttribute('aria-pressed', String(pressed));
    expect(button).toHaveAttribute('data-state', state);
    expect(button).toHaveAccessibleDescription(description);
  });

  it('marks the waiting states busy and the dead ones disabled', () => {
    const { rerender } = render(<MicButton state="requesting" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    rerender(<MicButton state="processing" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    rerender(<MicButton state="unsupported" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    rerender(<MicButton state="idle" />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy');
  });

  it('calls onToggle only where the click means something', async () => {
    const user = userEvent.setup({ delay: null });
    const onToggle = jest.fn();
    const { rerender } = render(<MicButton state="idle" onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    rerender(<MicButton state="listening" onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    rerender(<MicButton state="processing" onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    rerender(<MicButton state="unsupported" onToggle={onToggle} />);
    await user.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('does nothing when disabled', async () => {
    const user = userEvent.setup({ delay: null });
    const onToggle = jest.fn();
    render(<MicButton state="idle" onToggle={onToggle} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
    await user.click(screen.getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('passes the clamped level to the ring only while listening', () => {
    const { rerender } = render(<MicButton state="listening" level={1.7} />);
    expect(screen.getByRole('button').style.getPropertyValue('--mic-level')).toBe('1');
    rerender(<MicButton state="listening" level={0.4} />);
    expect(screen.getByRole('button').style.getPropertyValue('--mic-level')).toBe('0.4');
    rerender(<MicButton state="idle" level={0.4} />);
    expect(screen.getByRole('button').style.getPropertyValue('--mic-level')).toBe('');
  });

  it('keeps the English defaults and takes labels', () => {
    expect(DEFAULT_MIC_BUTTON_LABELS.dictation).toBe('Dictation');
    expect(DEFAULT_MIC_BUTTON_LABELS.start).toBe('Start dictation');
    render(
      <MicButton state="error" labels={{ dictation: 'Диктовка', error: 'Микрофон недоступен' }} />
    );
    expect(screen.getByRole('button', { name: 'Диктовка' })).toHaveAccessibleDescription(
      'Микрофон недоступен'
    );
  });
});
