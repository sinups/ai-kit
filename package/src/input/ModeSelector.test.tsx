import React from 'react';
import { render, screen } from '@mantine-tests/core';
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
});
