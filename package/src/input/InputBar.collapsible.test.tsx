import React from 'react';
import { render, screen, userEvent } from '@mantine-tests/core';
import { InputBar } from './InputBar';

const noop = () => {};

function field() {
  return document.querySelector('[data-drag-over], [role="presentation"]') as HTMLElement;
}

describe('input/InputBar collapsible', () => {
  it('stands as one line until it is focused', async () => {
    render(<InputBar collapsible status="ready" onSend={noop} onStop={noop} />);
    expect(field()).toHaveAttribute('data-collapsed');

    await userEvent.click(screen.getByRole('textbox'));
    expect(field()).not.toHaveAttribute('data-collapsed');
  });

  it('stays unfolded while anything is typed and folds back when it is empty', async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <InputBar collapsible status="ready" onSend={noop} onStop={noop} />
      </>
    );
    const textbox = screen.getByRole('textbox');

    await userEvent.type(textbox, 'Five seats');
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(field()).not.toHaveAttribute('data-collapsed');

    await userEvent.clear(textbox);
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(field()).toHaveAttribute('data-collapsed');
  });

  it('tells the host that it unfolded, once', async () => {
    const onExpand = jest.fn();
    render(<InputBar collapsible onExpand={onExpand} status="ready" onSend={noop} onStop={noop} />);

    await userEvent.click(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it('keeps the folded toolbar away from the keyboard', async () => {
    render(<InputBar collapsible onAttach={() => {}} status="ready" onSend={noop} onStop={noop} />);

    const toolbar = document.querySelector('[inert]');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toContainElement(screen.getByRole('button', { name: /attach/i }));

    await userEvent.click(screen.getByRole('textbox'));
    expect(document.querySelector('[inert]')).toBeNull();
  });

  it('takes the button of the collapsed line from the host', () => {
    render(
      <InputBar
        collapsible
        collapsedAction={<button type="button">Speak</button>}
        status="ready"
        onSend={noop}
        onStop={noop}
      />
    );
    expect(screen.getByRole('button', { name: 'Speak' })).toBeInTheDocument();
  });

  it('keeps the full composer when the host does not ask for the line', () => {
    render(<InputBar status="ready" onSend={noop} onStop={noop} />);
    expect(field()).not.toHaveAttribute('data-collapsed');
  });
});
