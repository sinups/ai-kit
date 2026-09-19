import React from 'react';
import { render } from '@mantine-tests/core';
import { VoiceLevel } from './VoiceLevel';

function bars(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-source] > span')).map((bar) =>
    bar.style.getPropertyValue('--bar-level')
  );
}

describe('voice/VoiceLevel', () => {
  it('gives every bar its clamped level and hides itself from assistive tech', () => {
    const { container } = render(<VoiceLevel levels={[0.2, 1.4, -1, 0.5]} />);
    expect(bars(container)).toEqual(['0.2', '1', '0', '0.5']);
    expect(container.querySelector('[data-source]')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws three bars around a single level', () => {
    const { container } = render(<VoiceLevel levels={0.5} source="assistant" />);
    expect(bars(container)).toEqual(['0.3', '0.5', '0.3']);
    expect(container.querySelector('[data-source]')).toHaveAttribute('data-source', 'assistant');
  });

  it('flattens the bars when inactive', () => {
    const { container } = render(<VoiceLevel levels={[0.8, 0.9]} active={false} />);
    expect(bars(container)).toEqual(['0', '0']);
    expect(container.querySelector('[data-source]')).not.toHaveAttribute('data-active');
  });
});
