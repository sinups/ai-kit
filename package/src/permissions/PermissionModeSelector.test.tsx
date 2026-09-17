import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { PermissionModeSelector } from './PermissionModeSelector';
import type { PermissionMode } from './types';

function Controlled({ onChange }: { onChange?: (mode: PermissionMode) => void }) {
  const [mode, setMode] = useState<PermissionMode>('default');
  return (
    <PermissionModeSelector
      variant="segmented"
      value={mode}
      onChange={(next) => {
        setMode(next);
        onChange?.(next);
      }}
    />
  );
}

describe('permissions/PermissionModeSelector', () => {
  it('describes the selected mode and warns about bypass', async () => {
    const onChange = jest.fn();
    render(<Controlled onChange={onChange} />);

    expect(screen.getByRole('radiogroup', { name: 'Permission mode' })).toBeInTheDocument();
    expect(screen.getByText(/Ask before the first use/)).toBeInTheDocument();
    expect(screen.queryByText(/isolated environment/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Bypass' }));
    expect(onChange).toHaveBeenCalledWith('bypass');
    expect(screen.getByText(/isolated environment/)).toBeInTheDocument();
  });

  it('renders a select with custom labels', () => {
    render(
      <PermissionModeSelector
        variant="select"
        value="plan"
        onChange={jest.fn()}
        labels={{ modes: { plan: { label: 'Planning', description: 'Only think' } } }}
      />
    );
    expect(screen.getByDisplayValue('Planning')).toBeInTheDocument();
    expect(screen.getByText('Only think')).toBeInTheDocument();
  });
});
