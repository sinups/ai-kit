import React from 'react';
import { act, waitFor } from '@testing-library/react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { setElementWidth } from '../../primitives/_testing/element-width';
import { EffortSelector } from './EffortSelector';

function controllableResizeObserver() {
  const original = window.ResizeObserver;
  const observed: Array<{ callback: ResizeObserverCallback; target: Element }> = [];
  class ManualObserver {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe(target: Element) {
      observed.push({ callback: this.callback, target });
    }
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = ManualObserver as unknown as typeof ResizeObserver;
  return {
    resize(width: number) {
      act(() => {
        for (const { callback, target } of observed) {
          const size = [{ inlineSize: width, blockSize: 600 }];
          callback(
            [
              {
                target,
                borderBoxSize: size,
                contentBoxSize: size,
                devicePixelContentBoxSize: size,
                contentRect: {
                  width,
                  height: 600,
                  x: 0,
                  y: 0,
                  top: 0,
                  left: 0,
                  right: width,
                  bottom: 600,
                },
              } as unknown as ResizeObserverEntry,
            ],
            {} as ResizeObserver
          );
        }
      });
    },
    restore() {
      window.ResizeObserver = original;
    },
  };
}

describe('model-settings/EffortSelector', () => {
  it('renders a segmented control when wide with the level description', async () => {
    const restore = setElementWidth(600);
    const onChange = jest.fn();
    const onThinkingChange = jest.fn();
    render(
      <EffortSelector
        value="medium"
        onChange={onChange}
        thinking={false}
        onThinkingChange={onThinkingChange}
      />
    );

    expect(screen.getByText('Balanced speed and depth')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('radio', { name: 'High' }));
    expect(onChange).toHaveBeenCalledWith('high');
    await userEvent.click(screen.getByRole('switch', { name: /Extended thinking/ }));
    expect(onThinkingChange).toHaveBeenCalledWith(true);
    restore();
  });

  it('renders a select when narrow', async () => {
    const restore = setElementWidth(300);
    render(<EffortSelector value="low" onChange={() => {}} />);
    expect(await screen.findByRole('combobox', { name: 'Reasoning effort' })).toHaveValue('Low');
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    restore();
  });

  it('hides the control until the width is measured', async () => {
    const observer = controllableResizeObserver();
    render(<EffortSelector value="low" onChange={() => {}} />);
    const beforeMeasure = screen.getByRole('combobox', { name: 'Reasoning effort' });
    expect(beforeMeasure.closest('[data-measuring]')).not.toBeNull();

    observer.resize(300);
    await waitFor(() => expect(beforeMeasure.closest('[data-measuring]')).toBeNull());
    expect(screen.getByRole('combobox', { name: 'Reasoning effort' })).toBe(beforeMeasure);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    observer.restore();
  });

  it('picks a level from the inline menu', async () => {
    const onChange = jest.fn();
    render(
      <EffortSelector
        variant="inline"
        value="high"
        onChange={onChange}
        levels={[
          { value: 'high', label: 'High' },
          { value: 'turbo', label: 'Turbo', description: 'Custom level' },
        ]}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reasoning effort: High' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: /Turbo/ }));
    expect(onChange).toHaveBeenCalledWith('turbo');
  });
});
