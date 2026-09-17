import React from 'react';
import { render, screen } from '@mantine-tests/core';
import { ShortcutHint } from './ShortcutHint';

describe('primitives/ShortcutHint', () => {
  it('renders mac keys without separators', () => {
    const { container } = render(
      <ShortcutHint keys="mod+shift+P" label="Commands" platform="mac" />
    );
    expect(screen.getByText('Commands')).toBeInTheDocument();
    expect(Array.from(container.querySelectorAll('kbd')).map((node) => node.textContent)).toEqual([
      '⌘',
      '⇧',
      'P',
    ]);
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders Ctrl with separators on other platforms', () => {
    const { container } = render(<ShortcutHint keys={['mod', 'k']} platform="other" />);
    expect(Array.from(container.querySelectorAll('kbd')).map((node) => node.textContent)).toEqual([
      'Ctrl',
      'K',
    ]);
    expect(screen.getByText('+')).toBeInTheDocument();
  });
});
