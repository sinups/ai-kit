import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { PermissionRuleInput, type PermissionRuleInputProps } from './PermissionRuleInput';

function Controlled(props: Partial<PermissionRuleInputProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <PermissionRuleInput
      knownTools={['Bash', 'Read', 'WebFetch']}
      {...props}
      value={value}
      onChange={setValue}
    />
  );
}

describe('PermissionRuleInput', () => {
  it('describes a valid rule in plain words', async () => {
    render(<Controlled behavior="deny" />);
    await userEvent.type(screen.getByLabelText('Rule'), 'Bash(rm -rf *)');
    expect(screen.getByText('Deny Bash commands matching rm -rf *')).toBeInTheDocument();
  });

  it('shows the validation error after blur and a warning for unknown tools', async () => {
    render(<Controlled />);
    const input = screen.getByLabelText('Rule');
    await userEvent.type(input, 'Bash(npm');
    expect(screen.queryByText('Close the parenthesis')).not.toBeInTheDocument();
    await userEvent.tab();
    expect(screen.getByText('Close the parenthesis')).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'Bsh(ls)');
    expect(screen.getByText(/Unknown tool Bsh/)).toBeInTheDocument();
  });

  it('completes tool names', async () => {
    render(<Controlled />);
    await userEvent.type(screen.getByLabelText('Rule'), 'web');
    await userEvent.click(await screen.findByRole('option', { name: 'WebFetch' }));
    expect(screen.getByLabelText('Rule')).toHaveValue('WebFetch');
  });
});
