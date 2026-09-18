import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { DEFAULT_SPEAKING_INDICATOR_LABELS, SpeakingIndicator } from './SpeakingIndicator';

describe('voice/SpeakingIndicator', () => {
  it('announces speech once, shows its level and stops it', async () => {
    const user = userEvent.setup({ delay: null });
    const onStop = jest.fn();
    const { rerender, container } = render(
      <SpeakingIndicator speaking={false} levels={[0.2, 0.8, 0.4]} onStop={onStop} />
    );
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    rerender(<SpeakingIndicator speaking levels={[0.2, 0.8, 0.4]} onStop={onStop} />);
    expect(screen.getByRole('status')).toHaveTextContent('Speaking');
    expect(container.querySelectorAll('[data-source="assistant"] > span')).toHaveLength(3);
    await user.click(screen.getByRole('button', { name: 'Stop speaking' }));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('hides the stop button without onStop and takes labels', () => {
    expect(DEFAULT_SPEAKING_INDICATOR_LABELS).toEqual({
      speaking: 'Speaking',
      stop: 'Stop speaking',
    });
    render(<SpeakingIndicator speaking labels={{ speaking: 'Говорю' }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Говорю');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
