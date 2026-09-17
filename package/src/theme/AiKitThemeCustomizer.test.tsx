import React from 'react';
import { render, screen } from '@mantine-tests/core';
import userEvent from '@testing-library/user-event';
import { AiKitProvider, useAiKitTheme } from './AiKitProvider';
import { AiKitThemeCustomizer } from './AiKitThemeCustomizer';

function Settings() {
  return <span data-testid="settings">{JSON.stringify(useAiKitTheme().settings)}</span>;
}

describe('theme/AiKitThemeCustomizer', () => {
  it('changes the nearest provider and resets it', async () => {
    render(
      <AiKitProvider>
        <AiKitThemeCustomizer />
        <Settings />
      </AiKitProvider>
    );

    expect(screen.getAllByRole('button', { name: 'Default', pressed: true })).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'violet' }));
    await userEvent.click(screen.getByRole('button', { name: 'Round' }));
    expect(screen.getByTestId('settings')).toHaveTextContent(
      '{"accent":"violet","radius":"round"}'
    );
    expect(screen.getByRole('button', { name: 'violet' })).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByTestId('settings')).toHaveTextContent('{}');
  });

  it('names accents through labels', () => {
    render(<AiKitThemeCustomizer labels={{ accents: { violet: 'Violett' } }} />);
    expect(
      screen.getByRole('button', { name: 'Violett' }).closest('[role="group"]')
    ).toHaveAccessibleName('Color');
  });

  it('works controlled', async () => {
    const onChange = jest.fn();
    render(<AiKitThemeCustomizer value={{ radius: 'sharp' }} onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'Sharp' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Round' }));
    expect(onChange).toHaveBeenCalledWith({ radius: 'round' });
    expect(screen.getByRole('button', { name: 'Sharp' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('works uncontrolled with a default value and hides sections', async () => {
    render(<AiKitThemeCustomizer defaultValue={{ radius: 'sharp' }} sections={{ mode: false }} />);

    expect(screen.queryByText('Mode')).not.toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Radius' })).toContainElement(
      screen.getByRole('button', { name: 'Round' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'Round' }));
    expect(screen.getByRole('button', { name: 'Round' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('button', { name: 'Sharp' })).toHaveAttribute('aria-pressed', 'true');
  });
});
