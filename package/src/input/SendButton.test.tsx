import React from 'react';
import { render } from '@mantine-tests/core';
import { SendButton } from './SendButton';

describe('SendButton', () => {
  it('exposes the state through a data attribute', () => {
    const { container, rerender } = render(<SendButton state="idle" />);
    const root = () => container.querySelector('[data-state]');
    expect(root()).toHaveAttribute('data-state', 'idle');

    rerender(<SendButton state="typing" />);
    expect(root()).toHaveAttribute('data-state', 'typing');

    rerender(<SendButton state="streaming" />);
    expect(root()).toHaveAttribute('data-state', 'streaming');
  });

  it('renders a stop icon while streaming and an arrow otherwise', () => {
    const { container, rerender } = render(<SendButton state="streaming" />);
    expect(container.querySelector('.tabler-icon-player-stop-filled')).toBeInTheDocument();

    rerender(<SendButton state="idle" />);
    expect(container.querySelector('.tabler-icon-arrow-up')).toBeInTheDocument();
  });

  it('supports className and style', () => {
    const { container } = render(
      <SendButton state="idle" className="custom" style={{ opacity: 0.5 }} />
    );
    const root = container.querySelector('[data-state]');
    expect(root).toHaveClass('custom');
    expect(root).toHaveStyle({ opacity: '0.5' });
  });
});
