import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { TranscriptSearch } from './TranscriptSearch';

describe('TranscriptSearch', () => {
  it('navigates with Enter and Shift+Enter and closes with Escape', async () => {
    const onNext = jest.fn();
    const onPrevious = jest.fn();
    const onClose = jest.fn();
    render(
      <TranscriptSearch
        value="token"
        onChange={() => {}}
        activeIndex={2}
        total={12}
        onNext={onNext}
        onPrevious={onPrevious}
        onClose={onClose}
      />
    );
    expect(screen.getByText('3/12')).toBeInTheDocument();
    const input = screen.getByRole('textbox', { name: 'Search conversation' });
    await userEvent.type(input, '{Enter}');
    await userEvent.type(input, '{Shift>}{Enter}{/Shift}');
    await userEvent.type(input, '{Escape}');
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
