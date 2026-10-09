import React, { useState } from 'react';
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToolRowBase } from './ToolRowBase';

function NestedRows() {
  const [opened, setOpened] = useState(false);
  return (
    <ToolRowBase completeLabel="Actions" isAnimating={false} expandable defaultOpen>
      <ToolRowBase
        completeLabel="Search pages"
        isAnimating={false}
        expandable
        expanded={opened}
        onToggleExpand={() => setOpened((value) => !value)}
      >
        {opened && <p>Found three pages</p>}
      </ToolRowBase>
    </ToolRowBase>
  );
}

describe('ToolRowBase disclosure', () => {
  it('makes nested lazy details visible in the click commit, without waiting for animation frames', () => {
    render(<NestedRows />, {
      wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider>,
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search pages' }));
    expect(screen.getByText('Found three pages')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Search pages' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('marks closed details inert and inaccessible immediately, and handles rapid reversal', () => {
    render(
      <ToolRowBase completeLabel="Action" isAnimating={false} expandable defaultOpen>
        <input aria-label="Details field" defaultValue="Retained" />
      </ToolRowBase>,
      { wrapper: ({ children }) => <MantineProvider>{children}</MantineProvider> }
    );
    const trigger = screen.getByRole('button', { name: 'Action' });
    const input = screen.getByRole('textbox');
    fireEvent.click(trigger);
    expect(input.closest('[aria-hidden="true"]')).toHaveAttribute('inert');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toBeVisible();
    expect(input).toHaveValue('Retained');
  });
});
