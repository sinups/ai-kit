import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { useMinDisplayTime } from './use-min-display-time';

function Status({ value, minMs }: { value: string; minMs?: number }) {
  const shown = useMinDisplayTime(value, { minMs });
  return <span data-testid="status">{shown}</span>;
}

describe('hooks/use-min-display-time', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the first value immediately', () => {
    render(<Status value="Running" />);
    expect(screen.getByTestId('status')).toHaveTextContent('Running');
  });

  it('holds a value for the minimum before replacing it', () => {
    const view = render(<Status value="Running" />);
    view.rerender(<Status value="Done" />);
    expect(screen.getByTestId('status')).toHaveTextContent('Running');

    act(() => {
      jest.advanceTimersByTime(599);
    });
    expect(screen.getByTestId('status')).toHaveTextContent('Running');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('status')).toHaveTextContent('Done');
  });

  it('drops values that flash past and shows the latest one', () => {
    const view = render(<Status value="Reading" />);
    view.rerender(<Status value="Searching" />);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    view.rerender(<Status value="Editing" />);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    view.rerender(<Status value="Done" />);
    expect(screen.getByTestId('status')).toHaveTextContent('Reading');

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.getByTestId('status')).toHaveTextContent('Done');
  });

  it('replaces immediately once the value has been up long enough', () => {
    const view = render(<Status value="Running" />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    view.rerender(<Status value="Done" />);
    act(() => {
      jest.advanceTimersByTime(0);
    });
    expect(screen.getByTestId('status')).toHaveTextContent('Done');
  });

  it('is a pass-through when disabled', () => {
    const view = render(<Status value="Running" minMs={0} />);
    view.rerender(<Status value="Done" minMs={0} />);
    expect(screen.getByTestId('status')).toHaveTextContent('Done');
  });
});
