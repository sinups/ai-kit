import React from 'react';
import { render } from '@mantine-tests/core';
import { InputBar } from './InputBar';

const noop = () => {};
const lit = () => document.querySelector('[data-lit]');

describe('input/InputBar glow', () => {
  it('lights up only while the agent works', () => {
    const { rerender } = render(<InputBar glow status="ready" onSend={noop} onStop={noop} />);
    expect(lit()).toBeNull();

    rerender(<InputBar glow status="submitted" onSend={noop} onStop={noop} />);
    expect(lit()).toBeInTheDocument();

    rerender(<InputBar glow status="streaming" onSend={noop} onStop={noop} />);
    expect(lit()).toBeInTheDocument();

    rerender(<InputBar glow status="ready" onSend={noop} onStop={noop} />);
    expect(lit()).toBeNull();
  });

  it('keeps burning when the host asks for it', () => {
    render(<InputBar glow="always" status="ready" onSend={noop} onStop={noop} />);
    expect(lit()).toBeInTheDocument();
  });

  it('stays out of a composer that did not ask for it', () => {
    const { container } = render(<InputBar status="streaming" onSend={noop} onStop={noop} />);
    expect(container.querySelector('[class*="glow"]')).toBeNull();
  });
});
