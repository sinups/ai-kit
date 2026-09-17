import { DEFAULT_THEME, mergeMantineTheme } from '@mantine/core';
import {
  buildAiKitScopedCss,
  getAiKitCssVariables,
  getAiKitOther,
  getAiKitSettingsTheme,
  readAiKitSettings,
  sanitizeAiKitSettings,
  writeAiKitSettings,
} from './ai-kit-settings';
import { createAiKitTheme } from './create-ai-kit-theme';

const host = mergeMantineTheme(DEFAULT_THEME, {});
const kit = (settings = {}) =>
  mergeMantineTheme(host, createAiKitTheme(getAiKitSettingsTheme(settings)));

describe('theme/getAiKitSettingsTheme', () => {
  it('writes settings to standard theme fields', () => {
    expect(getAiKitSettingsTheme({})).toEqual({});
    expect(
      getAiKitSettingsTheme({ accent: 'violet', radius: 'round', density: 'compact' })
    ).toEqual({
      primaryColor: 'violet',
      primaryShade: { light: 7, dark: 6 },
      defaultRadius: 'lg',
      other: { aiKit: { density: 'compact' } },
    });
    expect(getAiKitSettingsTheme({ radius: 'default' }).defaultRadius).toBe('md');
  });
});

describe('theme/getAiKitOther', () => {
  it('matches the original chat surface for the Mantine default radius and default density', () => {
    const other = getAiKitOther(host);
    expect(other.radii).toMatchObject({
      card: 'calc(0.625rem * var(--mantine-scale))',
      row: 'calc(0.375rem * var(--mantine-scale))',
    });
    expect(other.controlHeights.md).toBe('calc(1.75rem * var(--mantine-scale))');
  });

  it('follows defaultRadius and lets theme.other.aiKit override values', () => {
    const theme = mergeMantineTheme(host, {
      defaultRadius: 'xl',
      other: { aiKit: { density: 'compact', radii: { card: '0px' } } },
    });
    const other = getAiKitOther(theme);
    expect(other.radii.control).toBe('calc(0.4375rem * var(--mantine-scale))');
    expect(other.radii.card).toBe('0px');
    expect(other.controlHeights.md).toBe('calc(1.5rem * var(--mantine-scale))');
  });
});

describe('theme/getAiKitCssVariables', () => {
  it('re-declares only the Mantine variables the kit theme changes, plus kit surfaces', () => {
    const vars = getAiKitCssVariables(host, kit());
    expect(vars.variables['--mantine-font-weight-medium']).toBe('500');
    expect(vars.variables['--mantine-cursor-type']).toBe('pointer');
    expect(vars.variables['--mantine-color-dimmed']).toBe('var(--ae-fg-muted)');
    expect(vars.variables['--mantine-primary-color-filled']).toBeUndefined();
    expect(Object.keys(vars.variables).some((name) => name.startsWith('--ae-'))).toBe(false);
  });

  it('points primary variables at the accent with a contrast color per scheme', () => {
    const vars = getAiKitCssVariables(host, kit({ accent: 'violet' }));
    expect(vars.variables['--mantine-primary-color-filled']).toBe(
      'var(--mantine-color-violet-filled)'
    );
    expect(vars.light['--mantine-color-violet-filled']).toBe('var(--mantine-color-violet-7)');
    expect(vars.dark['--mantine-color-violet-filled']).toBe('var(--mantine-color-violet-6)');
    expect(vars.variables['--ae-primary']).toBe('var(--mantine-primary-color-filled)');
    expect(vars.variables['--ae-send-button-bg']).toBe('var(--ae-primary)');
  });

  it('adds kit tokens for radius, density and explicit overrides', () => {
    const vars = getAiKitCssVariables(host, kit({ radius: 'sharp', density: 'compact' }), {
      'tool-bg': 'red',
    });
    expect(vars.variables['--ae-control-radius']).toBe('calc(0.125rem * var(--mantine-scale))');
    expect(vars.variables['--ae-message-radius']).toBe(vars.variables['--ae-radius']);
    expect(vars.variables['--ae-row-height']).toBe('calc(1.5rem * var(--mantine-scale))');
    expect(vars.variables['--mantine-radius-default']).toBe(host.radius.xs);
    expect(vars.variables['--ae-tool-bg']).toBe('red');
  });
});

describe('theme/buildAiKitScopedCss', () => {
  it('writes shared variables and per-scheme blocks and strips rule breakers', () => {
    expect(
      buildAiKitScopedCss('s', {
        variables: { '--a': '1;}body{' },
        light: { '--b': 'black' },
        dark: { '--b': 'white' },
      })
    ).toBe(
      ".s{--a:1body;}[data-mantine-color-scheme='light'] .s{--b:black;}[data-mantine-color-scheme='dark'] .s{--b:white;}"
    );
  });
});

describe('theme/ai-kit-settings settings persistence', () => {
  afterEach(() => window.localStorage.clear());

  it('keeps only valid values', () => {
    expect(
      sanitizeAiKitSettings({
        accent: 'teal',
        radius: 'huge',
        density: 'compact',
        colorScheme: 1,
      })
    ).toEqual({ density: 'compact' });
    expect(
      sanitizeAiKitSettings({ accent: 'violet', radius: 'round', colorScheme: 'dark' })
    ).toEqual({
      accent: 'violet',
      radius: 'round',
      colorScheme: 'dark',
    });
    expect(sanitizeAiKitSettings(null)).toEqual({});
  });

  it('round-trips settings and survives broken storage', () => {
    writeAiKitSettings('kit', { radius: 'round' });
    expect(readAiKitSettings('kit')).toEqual({ radius: 'round' });
    writeAiKitSettings('kit', {});
    expect(window.localStorage.getItem('kit')).toBeNull();
    window.localStorage.setItem('kit', '{broken');
    expect(readAiKitSettings('kit')).toEqual({});
  });
});
