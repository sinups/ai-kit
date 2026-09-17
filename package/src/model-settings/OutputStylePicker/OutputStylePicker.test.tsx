import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { OutputStylePicker } from './OutputStylePicker';

const styles = [
  { id: 'default', name: 'Default', description: 'Concise answers' },
  { id: 'explanatory', name: 'Explanatory', description: 'Explains choices', example: 'Because…' },
];

describe('OutputStylePicker', () => {
  it('selects a style card', async () => {
    const onChange = jest.fn();
    render(
      <OutputStylePicker styles={styles} value="default" onChange={onChange} label="Output style" />
    );

    const cards = screen.getAllByRole('radio');
    expect(cards[0]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText('Because…')).toBeInTheDocument();
    await userEvent.click(cards[1]);
    expect(onChange).toHaveBeenCalledWith('explanatory');
  });
});
