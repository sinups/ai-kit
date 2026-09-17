import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_THEME,
  getPrimaryContrastColor,
  getPrimaryShade,
  luminance,
  mergeMantineTheme,
} from '@mantine/core';
import { AI_KIT_ACCENTS, getAiKitSettingsTheme } from './ai-kit-settings';
import { aiKitVariantColorResolver, createAiKitTheme } from './create-ai-kit-theme';

const VARS = fs.readFileSync(path.join(__dirname, '../styles/vars.module.css'), 'utf8');

function readToken(scheme: 'light' | 'dark', name: string): string {
  const block = VARS.slice(VARS.indexOf(`@mixin ${scheme}-root`));
  const match = block.match(new RegExp(`--ae-${name}:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`--ae-${name} is not declared for ${scheme}`);
  }
  return match[1].trim();
}

function resolvePaletteVar(theme: ReturnType<typeof mergeMantineTheme>, value: string): string {
  const match = value.match(/^var\(--mantine-color-([a-z]+)-(\d)\)$/);
  if (!match) {
    throw new Error(`${value} is not a palette color variable`);
  }
  return theme.colors[match[1]][Number(match[2])];
}

function readRootToken(name: string): string {
  const match = VARS.match(new RegExp(`--ae-${name}:\\s*([^;]+);`));
  if (!match) {
    throw new Error(`--ae-${name} is not declared`);
  }
  return match[1].trim();
}

function mix(top: string, bottom: string, amount: number): string {
  const channels = (hex: string) => {
    const value = hex.replace('#', '');
    const full = value.length === 3 ? [...value].map((c) => c + c).join('') : value;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  };
  const [a, b] = [channels(top), channels(bottom)];
  const rgb = a.map((c, i) => Math.round(c * amount + b[i] * (1 - amount)));
  return `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const TEXT = 4.5;
const GRAPHICS = 3;

describe.each(AI_KIT_ACCENTS)('accent %s', (accent) => {
  const theme = mergeMantineTheme(
    DEFAULT_THEME,
    createAiKitTheme(getAiKitSettingsTheme({ accent }))
  );
  const palette = theme.colors[accent];

  describe.each(['light', 'dark'] as const)('%s scheme', (scheme) => {
    const shade = getPrimaryShade(theme, scheme);
    const fill = palette[shade];
    const hover = palette[shade === 9 ? 8 : shade + 1];
    const onFill =
      getPrimaryContrastColor(theme, scheme) === 'var(--mantine-color-black)'
        ? theme.black
        : theme.white;
    const tinted = scheme === 'light' ? fill : palette[4];
    const background = readToken(scheme, 'bg');
    const track = mix(readToken(scheme, 'fg'), background, 0.1);
    const unchecked = readToken(scheme, 'fg-muted');

    it('keeps text and icons readable on filled buttons, checked boxes and completed steps', () => {
      expect(contrast(fill, onFill)).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps text readable on the hover shade', () => {
      expect(contrast(hover, onFill)).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps tinted text of light, outline and subtle variants readable on the kit background', () => {
      expect(contrast(tinted, background)).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps selected borders, checkboxes and progress visible', () => {
      expect(contrast(fill, background)).toBeGreaterThanOrEqual(GRAPHICS);
      expect(contrast(fill, track)).toBeGreaterThanOrEqual(GRAPHICS);
    });

    it('keeps checkbox and radio marks and the checked switch thumb visible on the fill', () => {
      expect(contrast(onFill, fill)).toBeGreaterThanOrEqual(GRAPHICS);
    });

    it('keeps unchecked checkbox, radio and switch outlines visible on the background and track', () => {
      expect(contrast(unchecked, background)).toBeGreaterThanOrEqual(GRAPHICS);
      expect(contrast(unchecked, track)).toBeGreaterThanOrEqual(GRAPHICS);
    });
  });
});

describe('danger fill', () => {
  const theme = mergeMantineTheme(DEFAULT_THEME, createAiKitTheme());
  const fill = resolvePaletteVar(theme, readRootToken('danger-fill'));
  const resolved = aiKitVariantColorResolver({ color: 'red', variant: 'filled', theme });

  it('uses the danger fill token with white text for filled destructive buttons', () => {
    expect(resolved.background).toBe('var(--ae-danger-fill)');
    expect(resolved.hover).toBe('var(--ae-danger-fill)');
    expect(resolved.color).toBe('var(--mantine-color-white)');
  });

  describe.each(['light', 'dark'] as const)('%s scheme', (scheme) => {
    it('keeps white text readable on the danger fill', () => {
      expect(contrast(fill, theme.white)).toBeGreaterThanOrEqual(TEXT);
    });

    it('keeps the danger fill visible on the kit background', () => {
      expect(contrast(fill, readToken(scheme, 'bg'))).toBeGreaterThanOrEqual(GRAPHICS);
    });
  });
});
