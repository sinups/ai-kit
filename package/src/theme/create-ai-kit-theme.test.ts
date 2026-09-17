import { DEFAULT_THEME, mergeMantineTheme, rem } from '@mantine/core';
import {
  aiKitVariantColorResolver,
  createAiKitTheme,
  getAiKitActionIconVars,
  getAiKitButtonVars,
  isAiKitThemed,
  mergeAiKitTheme,
  normalizeAiKitSize,
} from './create-ai-kit-theme';

const theme = mergeMantineTheme(DEFAULT_THEME, createAiKitTheme());

describe('normalizeAiKitSize', () => {
  it('drops the compact prefix and falls back to sm', () => {
    expect(normalizeAiKitSize('compact-xs')).toBe('xs');
    expect(normalizeAiKitSize(undefined)).toBe('sm');
    expect(normalizeAiKitSize('input-sm')).toBe('sm');
  });
});

describe('size vars', () => {
  it('maps button and action icon sizes to kit control heights', () => {
    expect(getAiKitButtonVars('xs')).toEqual({
      '--button-height': 'var(--ae-control-height-xs)',
      '--button-padding-x': rem(6),
      '--button-fz': 'var(--ae-font-size-xs)',
      '--button-radius': 'var(--ae-control-radius)',
    });
    expect(getAiKitActionIconVars('input-sm')['--ai-size']).toBe('var(--ae-control-height-sm)');
  });
});

describe('aiKitVariantColorResolver', () => {
  const resolve = (variant: string, color?: string) =>
    aiKitVariantColorResolver({ theme, variant, color: color ?? theme.primaryColor });

  it('keeps filled on the primary color and fills red with the danger token', () => {
    expect(resolve('filled').background).toBe('var(--mantine-color-blue-filled)');
    expect(resolve('filled', 'red').background).toBe('var(--ae-danger-fill)');
  });

  it('renders light as a soft tag tinted by tone and default as a ghost button', () => {
    expect(resolve('light', 'gray')).toMatchObject({
      background: 'color-mix(in srgb, var(--ae-fg) 8%, transparent)',
      color: 'var(--ae-fg-muted)',
    });
    expect(resolve('light', 'teal').color).toBe('var(--mantine-color-teal-text)');
    expect(resolve('light', 'red').background).toBe('var(--ae-error-bg)');
    expect(resolve('default', 'gray')).toMatchObject({
      background: 'transparent',
      hover: 'color-mix(in srgb, var(--ae-fg) 8%, transparent)',
    });
  });

  it('renders subtle gray as a muted text button', () => {
    expect(resolve('subtle', 'gray')).toMatchObject({
      background: 'transparent',
      hover: 'color-mix(in srgb, var(--ae-fg) 8%, transparent)',
      color: 'var(--ae-fg-muted)',
      hoverColor: 'var(--ae-fg)',
    });
  });
});

describe('createAiKitTheme', () => {
  it('sets the standard theme fields of the kit language', () => {
    const override = createAiKitTheme();
    expect(override.fontWeights).toEqual({ medium: '500' });
    expect(override.cursorType).toBe('pointer');
    expect(override.autoContrast).toBe(true);
    expect(override.respectReducedMotion).toBe(true);
    expect(override.activeClassName).toBe('active');
    expect(Object.keys(override.components ?? {})).toEqual(
      expect.arrayContaining([
        'Button',
        'Badge',
        'Alert',
        'Modal',
        'Drawer',
        'TextInput',
        'Stepper',
        'Kbd',
      ])
    );
  });

  it('merges overrides over the kit theme and keeps host values in a global setup', () => {
    const merged = createAiKitTheme({
      primaryColor: 'violet',
      components: { Badge: { defaultProps: { size: 'lg' } } },
    });
    expect(merged.primaryColor).toBe('violet');
    expect(merged.components?.Badge?.vars).toBeDefined();
    expect(mergeAiKitTheme({ defaultRadius: 'lg' }).defaultRadius).toBe('lg');
  });
});

describe('isAiKitThemed', () => {
  it('themes components with their own classes and skips explicit opt-outs', () => {
    expect(isAiKitThemed({})).toBe(true);
    expect(isAiKitThemed({ className: 'x', classNames: { root: 'x' } })).toBe(true);
    expect(isAiKitThemed({ unstyled: true })).toBe(false);
    expect(isAiKitThemed({ variant: 'unstyled' })).toBe(false);
    expect(isAiKitThemed({ 'data-ai-kit-unstyled': true })).toBe(false);
  });
});
