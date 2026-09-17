import React, { useState } from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { headerKeyValidator, type KeyValuePair } from './key-value';
import { KeyValueEditor, type KeyValueEditorProps } from './KeyValueEditor';

function Controlled({
  initial,
  onPairs,
  ...props
}: Partial<KeyValueEditorProps> & {
  initial: KeyValuePair[];
  onPairs?: (pairs: KeyValuePair[]) => void;
}) {
  const [pairs, setPairs] = useState(initial);
  return (
    <KeyValueEditor
      value={pairs}
      onChange={(next) => {
        setPairs(next);
        onPairs?.(next);
      }}
      {...props}
    />
  );
}

describe('KeyValueEditor', () => {
  it('adds a row, focuses its key and edits it', async () => {
    const onPairs = jest.fn();
    render(<Controlled initial={[]} onPairs={onPairs} addLabel="Add variable" />);

    await userEvent.click(screen.getByRole('button', { name: 'Add variable' }));
    const key = screen.getByRole('textbox', { name: 'Key 1' });
    expect(key).toHaveFocus();

    await userEvent.type(key, 'API_URL');
    await userEvent.type(screen.getByRole('textbox', { name: 'Value 1' }), 'https://x');
    expect(onPairs).toHaveBeenLastCalledWith([
      expect.objectContaining({ key: 'API_URL', value: 'https://x' }),
    ]);
  });

  it('shows key errors from the validator and duplicates', async () => {
    render(
      <Controlled
        initial={[
          { id: 'a', key: 'TOKEN', value: '1' },
          { id: 'b', key: 'TOKEN', value: '2' },
          { id: 'c', key: '1BAD', value: '' },
        ]}
      />
    );

    expect(screen.getByText('Duplicate key')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Key 3' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox', { name: 'Key 1' })).not.toHaveAttribute('aria-invalid');
  });

  it('uses a custom validator', () => {
    render(
      <Controlled
        initial={[{ id: 'a', key: 'X-Api-Key', value: '1' }]}
        validateKey={headerKeyValidator}
      />
    );
    expect(screen.getByRole('textbox', { name: 'Key 1' })).not.toHaveAttribute('aria-invalid');
  });

  it('masks secret values and toggles the flag', async () => {
    const onPairs = jest.fn();
    render(
      <Controlled
        initial={[{ id: 'a', key: 'TOKEN', value: 'shh' }]}
        onPairs={onPairs}
        allowSecrets
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Mark as secret' }));
    expect(onPairs).toHaveBeenLastCalledWith([expect.objectContaining({ secret: true })]);
    expect(screen.getByLabelText('Value 1')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Mark as not secret' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('removes a row', async () => {
    const onPairs = jest.fn();
    render(
      <Controlled
        initial={[
          { id: 'a', key: 'A', value: '1' },
          { id: 'b', key: 'B', value: '2' },
        ]}
        onPairs={onPairs}
      />
    );

    await userEvent.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(onPairs).toHaveBeenLastCalledWith([{ id: 'b', key: 'B', value: '2' }]);
  });

  it('expands pasted .env text into rows', async () => {
    const onPairs = jest.fn();
    render(<Controlled initial={[{ id: 'a', key: '', value: '' }]} onPairs={onPairs} />);

    await userEvent.click(screen.getByRole('textbox', { name: 'Key 1' }));
    await userEvent.paste('# env\nHOST=localhost\nPORT=5432');

    expect(screen.getByRole('textbox', { name: 'Key 1' })).toHaveValue('HOST');
    expect(screen.getByRole('textbox', { name: 'Value 2' })).toHaveValue('5432');
    expect(onPairs).toHaveBeenCalledTimes(1);
  });

  it('pastes a plain key as text', async () => {
    render(<Controlled initial={[{ id: 'a', key: '', value: '' }]} />);
    await userEvent.click(screen.getByRole('textbox', { name: 'Key 1' }));
    await userEvent.paste('API_KEY');
    expect(screen.getByRole('textbox', { name: 'Key 1' })).toHaveValue('API_KEY');
    expect(screen.queryByRole('textbox', { name: 'Key 2' })).not.toBeInTheDocument();
  });

  it('limits rows and disables everything', () => {
    const { rerender } = render(
      <KeyValueEditor value={[{ id: 'a', key: 'A', value: '1' }]} onChange={() => {}} maxRows={1} />
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    rerender(
      <KeyValueEditor value={[{ id: 'a', key: 'A', value: '1' }]} onChange={() => {}} disabled />
    );
    expect(screen.getByRole('textbox', { name: 'Key 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });
});
