import React from 'react';
import { Button, MantineProvider, Portal } from '@mantine/core';
import { render, screen } from '@mantine-tests/core';
import { render as renderWithProvider } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AiKitHostScope, AiKitProvider, useAiKitTheme } from './AiKitProvider';
import { AI_KIT_SCOPE_CLASS, mergeAiKitTheme } from './create-ai-kit-theme';

function Probe() {
  const { settings, setSettings, reset } = useAiKitTheme();
  return (
    <>
      <span data-testid="settings">{JSON.stringify(settings)}</span>
      <button type="button" onClick={() => setSettings({ radius: 'round' })}>
        round
      </button>
      <button type="button" onClick={reset}>
        reset
      </button>
    </>
  );
}

describe('theme/AiKitProvider', () => {
  afterEach(() => window.localStorage.clear());

  it('themes stock components inside its subtree only', () => {
    render(
      <>
        <Button>Host</Button>
        <AiKitProvider>
          <Button>Kit</Button>
          <Button className="own">Own</Button>
          <Button data-ai-kit-unstyled>Opted out</Button>
        </AiKitProvider>
      </>
    );

    expect(screen.getByRole('button', { name: 'Kit' })).toHaveClass('button');
    expect(screen.getByRole('button', { name: 'Host' })).not.toHaveClass('button');
    expect(screen.getByRole('button', { name: 'Own' })).toHaveClass('button', 'own');
    expect(screen.getByRole('button', { name: 'Opted out' })).not.toHaveClass('button');
  });

  it('renders host UI inside the kit with the host theme', () => {
    const { container } = render(
      <AiKitProvider>
        <AiKitHostScope>
          <Button>Host inside</Button>
        </AiKitHostScope>
      </AiKitProvider>
    );
    expect(screen.getByRole('button', { name: 'Host inside' })).not.toHaveClass('button');
    const css = container.querySelector('style[data-ae-theme]')?.textContent ?? '';
    expect(css).toMatch(/-host\{[^}]*--mantine-font-weight-medium:600;/);
  });

  it('keeps kit tokens and primary color untouched for default settings', () => {
    const { container } = render(
      <AiKitProvider radius="default" density="default">
        <span>content</span>
      </AiKitProvider>
    );
    const css = container.querySelector('style[data-ae-theme]')?.textContent ?? '';
    expect(css).toContain('--mantine-font-weight-medium:500;');
    expect(css).not.toMatch(/--ae-[a-z-]+:/);
    expect(css).not.toContain('--mantine-primary-color-filled');
  });

  it('writes accent, radius and token overrides to the scoped stylesheet', () => {
    const { container } = render(
      <AiKitProvider accent="violet" radius="round" tokens={{ 'tool-bg': 'red' }}>
        <span>content</span>
      </AiKitProvider>
    );
    const css = container.querySelector('style[data-ae-theme]')?.textContent ?? '';
    expect(css).toContain('--mantine-primary-color-filled:var(--mantine-color-violet-filled);');
    expect(css).toContain('--ae-control-radius:calc(0.375rem * var(--mantine-scale));');
    expect(css).toContain('--ae-tool-bg:red;');
    const scope = css.slice(1, css.indexOf('{'));
    expect(container.querySelector(`.${scope}`)).not.toBeNull();
  });

  it('changes, persists and resets settings through useAiKitTheme', async () => {
    render(
      <AiKitProvider density="compact" persistKey="kit-theme">
        <Probe />
      </AiKitProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'round' }));
    expect(screen.getByTestId('settings')).toHaveTextContent(
      '{"density":"compact","radius":"round"}'
    );
    expect(window.localStorage.getItem('kit-theme')).toBe('{"radius":"round"}');

    await userEvent.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('settings')).toHaveTextContent('{"density":"compact"}');
    expect(window.localStorage.getItem('kit-theme')).toBeNull();
  });

  it('restores persisted settings', () => {
    window.localStorage.setItem('kit-theme', '{"accent":"violet"}');
    render(
      <AiKitProvider persistKey="kit-theme">
        <Probe />
      </AiKitProvider>
    );
    expect(screen.getByTestId('settings')).toHaveTextContent('{"accent":"violet"}');
  });

  it('applies persisted settings on the first render', () => {
    window.localStorage.setItem('kit-theme', '{"radius":"round"}');
    const renders: string[] = [];
    function Recorder() {
      renders.push(JSON.stringify(useAiKitTheme().settings));
      return null;
    }
    render(
      <AiKitProvider persistKey="kit-theme">
        <Recorder />
      </AiKitProvider>
    );
    expect(renders[0]).toBe('{"radius":"round"}');
  });
});

describe('theme/mergeAiKitTheme', () => {
  it('themes components and portals under an ae-kit root without AiKitProvider', () => {
    renderWithProvider(
      <MantineProvider theme={mergeAiKitTheme()}>
        <div className={AI_KIT_SCOPE_CLASS}>
          <Button>Global</Button>
          <Portal>
            <span>In portal</span>
          </Portal>
        </div>
      </MantineProvider>
    );
    expect(screen.getByRole('button', { name: 'Global' })).toHaveClass('button');
    expect(screen.getByText('In portal').closest(`.${AI_KIT_SCOPE_CLASS}`)).not.toBeNull();
  });
});
