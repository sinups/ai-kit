import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { ModelPicker } from './ModelPicker';

const models = [
  { id: 'deepseek-v3', name: 'DeepSeek', version: 'V3' },
  { id: 'qwen-2.5-coder-32b', name: 'Qwen 2.5 Coder', version: '32B' },
];

describe('ModelPicker', () => {
  it('puts popup ARIA attributes on the trigger button and selects a model', async () => {
    const onChange = jest.fn();
    render(<ModelPicker models={models} defaultValue="deepseek-v3" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Select model' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(await screen.findByRole('button', { name: /Qwen/ }));
    expect(onChange).toHaveBeenCalledWith('qwen-2.5-coder-32b');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });
});
