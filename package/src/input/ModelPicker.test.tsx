import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ModelPicker } from './ModelPicker';

const models = [
  { id: 'fable', name: 'Fable', version: '5.1' },
  { id: 'opus', name: 'Opus', version: '5' },
];

describe('ModelPicker', () => {
  it('puts popup ARIA attributes on the trigger button and selects a model', async () => {
    const onChange = jest.fn();
    render(<ModelPicker models={models} defaultValue="fable" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Select model' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(await screen.findByRole('button', { name: /Opus/ }));
    expect(onChange).toHaveBeenCalledWith('opus');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
