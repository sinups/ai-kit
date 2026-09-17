import {
  defaultCssVariablesResolver,
  type MantineColorScheme,
  type MantineTheme,
  type MantineThemeOverride,
} from '@mantine/core';
import type { AeTokenOverrides } from './tokens';

/**
 * Accents offered by the customizer, with the primary shade per scheme. Every entry passes the
 * contrast checks in `ai-kit-contrast.test.ts`: text on the fill and on its hover ≥ 4.5:1,
 * tinted text on the kit background ≥ 4.5:1, fill against the background ≥ 3:1.
 */
export const AI_KIT_ACCENT_SHADES = {
  gray: { light: 8, dark: 4 },
  blue: { light: 8, dark: 8 },
  indigo: { light: 7, dark: 7 },
  violet: { light: 7, dark: 6 },
  grape: { light: 7, dark: 7 },
  pink: { light: 7, dark: 7 },
} as const;

export const AI_KIT_ACCENTS = Object.keys(AI_KIT_ACCENT_SHADES) as AiKitAccent[];
export const AI_KIT_RADII = ['sharp', 'default', 'round'] as const;
export const AI_KIT_DENSITIES = ['default', 'compact'] as const;
export const AI_KIT_COLOR_SCHEMES = ['light', 'dark', 'auto'] as const;

export type AiKitAccent = keyof typeof AI_KIT_ACCENT_SHADES;
export type AiKitRadius = (typeof AI_KIT_RADII)[number];
export type AiKitDensity = (typeof AI_KIT_DENSITIES)[number];

/** `theme.defaultRadius` behind each radius step */
export const AI_KIT_RADIUS_KEYS: Record<AiKitRadius, 'xs' | 'md' | 'lg'> = {
  sharp: 'xs',
  default: 'md',
  round: 'lg',
};

export interface AiKitThemeSettings {
  /** Sets `theme.primaryColor` and `theme.primaryShade`; unset keeps the host primary color */
  accent?: AiKitAccent;
  /** Sets `theme.defaultRadius` (`sharp` → xs, `default` → md, `round` → lg); kit radii follow it */
  radius?: AiKitRadius;
  /** Kit control heights and paddings; `default` matches the original chat surface */
  density?: AiKitDensity;
  /** Applied through Mantine `useMantineColorScheme`, so it changes the color scheme of the whole app */
  colorScheme?: MantineColorScheme;
}

export interface AiKitRadii {
  /** Composer, user message and info bar */
  surface: string;
  /** Cards and dropdowns */
  card: string;
  /** Error and warning cards */
  notice: string;
  /** Menu options, picker triggers, inputs */
  row: string;
  /** Buttons and badges */
  control: string;
}

export interface AiKitControlHeights {
  xs: string;
  sm: string;
  md: string;
  row: string;
}

/** Kit settings kept in `theme.other.aiKit` */
export interface AiKitThemeOther {
  density: AiKitDensity;
  radii: AiKitRadii;
  controlHeights: AiKitControlHeights;
  contextPadding: string;
  userMessagePadding: { x: string; y: string };
}

declare module '@mantine/core' {
  export interface MantineThemeOther {
    aiKit?: Partial<AiKitThemeOther>;
  }
}

export const AI_KIT_DEFAULT_DENSITY: AiKitDensity = 'default';

const px = (value: number) => `calc(${value / 16}rem * var(--mantine-scale))`;

type RadiusKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const RADII: Record<RadiusKey, AiKitRadii> = {
  xs: { surface: px(8), card: px(6), notice: px(4), row: px(4), control: px(2) },
  sm: { surface: px(12), card: px(8), notice: px(6), row: px(4), control: px(3) },
  md: {
    surface: 'var(--mantine-radius-lg)',
    card: px(10),
    notice: px(8),
    row: px(6),
    control: 'var(--mantine-radius-sm)',
  },
  lg: { surface: px(22), card: px(14), notice: px(10), row: px(8), control: px(6) },
  xl: { surface: px(24), card: px(16), notice: px(12), row: px(10), control: px(7) },
};

const RADIUS_KEYS = new Set<string>(['xs', 'sm', 'md', 'lg', 'xl']);

type DensityValues = Pick<
  AiKitThemeOther,
  'controlHeights' | 'contextPadding' | 'userMessagePadding'
>;

const DENSITY: Record<AiKitDensity, DensityValues> = {
  default: {
    controlHeights: { xs: px(20), sm: px(24), md: px(28), row: px(28) },
    contextPadding: px(10),
    userMessagePadding: { x: px(14), y: px(6) },
  },
  compact: {
    controlHeights: { xs: px(20), sm: px(22), md: px(24), row: px(24) },
    contextPadding: px(8),
    userMessagePadding: { x: px(12), y: px(4) },
  },
};

export function isAiKitAccent(value: unknown): value is AiKitAccent {
  return typeof value === 'string' && value in AI_KIT_ACCENT_SHADES;
}

export function isAiKitRadius(value: unknown): value is AiKitRadius {
  return (AI_KIT_RADII as readonly unknown[]).includes(value);
}

/** Theme override that expresses the settings with standard theme fields and `theme.other.aiKit` */
export function getAiKitSettingsTheme(settings: AiKitThemeSettings): MantineThemeOverride {
  const override: MantineThemeOverride = {};
  if (settings.accent && isAiKitAccent(settings.accent)) {
    override.primaryColor = settings.accent;
    override.primaryShade = { ...AI_KIT_ACCENT_SHADES[settings.accent] };
  }
  if (settings.radius && isAiKitRadius(settings.radius)) {
    override.defaultRadius = AI_KIT_RADIUS_KEYS[settings.radius];
  }
  if (settings.density) {
    override.other = { aiKit: { density: settings.density } };
  }
  return override;
}

/** Kit values of a theme: radii follow `theme.defaultRadius`, heights follow the density; explicit `theme.other.aiKit` values win */
export function getAiKitOther(theme: MantineTheme): AiKitThemeOther {
  const custom = theme.other?.aiKit ?? {};
  const density = custom.density ?? AI_KIT_DEFAULT_DENSITY;
  const radiusKey: RadiusKey = RADIUS_KEYS.has(String(theme.defaultRadius))
    ? (theme.defaultRadius as RadiusKey)
    : 'md';
  const densityValues = DENSITY[density] ?? DENSITY.default;
  return {
    density,
    radii: { ...RADII[radiusKey], ...custom.radii },
    controlHeights: { ...densityValues.controlHeights, ...custom.controlHeights },
    contextPadding: custom.contextPadding ?? densityValues.contextPadding,
    userMessagePadding: { ...densityValues.userMessagePadding, ...custom.userMessagePadding },
  };
}

export function getAiKitTokens(other: AiKitThemeOther): AeTokenOverrides {
  return {
    radius: other.radii.surface,
    'message-radius': other.radii.surface,
    'input-radius': other.radii.surface,
    'message-radius-inner': `calc(${other.radii.surface} - var(--ae-message-radius-inner-offset))`,
    'tool-radius': other.radii.card,
    'notice-radius': other.radii.notice,
    'row-radius': other.radii.row,
    'control-radius': other.radii.control,
    'control-height-xs': other.controlHeights.xs,
    'control-height-sm': other.controlHeights.sm,
    'control-height-md': other.controlHeights.md,
    'row-height': other.controlHeights.row,
    'context-padding': other.contextPadding,
    'user-message-x': other.userMessagePadding.x,
    'user-message-y': other.userMessagePadding.y,
  };
}

/** Mantine CSS variables re-pointed at kit tokens inside the kit subtree, so stock components pick up kit surfaces */
export const AI_KIT_SURFACE_VARIABLES: Record<string, string> = {
  '--mantine-color-body': 'var(--ae-bg)',
  '--mantine-color-text': 'var(--ae-fg)',
  '--mantine-color-dimmed': 'var(--ae-fg-muted)',
  '--mantine-color-placeholder': 'var(--ae-input-placeholder)',
  '--mantine-color-default': 'var(--ae-bg)',
  '--mantine-color-default-hover': 'color-mix(in srgb, var(--ae-fg) 6%, transparent)',
  '--mantine-color-default-color': 'var(--ae-fg)',
  '--mantine-color-default-border': 'var(--ae-border)',
};

/**
 * `--ae-*` tokens that reference primary color variables. Custom properties resolve `var()` where
 * they are declared, so the root declarations keep the host color and must be repeated on the subtree.
 */
export const AI_KIT_PRIMARY_TOKENS: Record<string, string> = {
  '--ae-primary': 'var(--mantine-primary-color-filled)',
  '--ae-primary-hover': 'var(--mantine-primary-color-filled-hover)',
  '--ae-primary-contrast': 'var(--mantine-primary-color-contrast)',
  '--ae-send-button-bg': 'var(--ae-primary)',
  '--ae-send-button-color': 'var(--ae-primary-contrast)',
};

export interface AiKitCssVariables {
  variables: Record<string, string>;
  light: Record<string, string>;
  dark: Record<string, string>;
}

function diff(host: Record<string, string>, kit: Record<string, string>) {
  return Object.fromEntries(Object.entries(kit).filter(([name, value]) => host[name] !== value));
}

/**
 * CSS variables the kit subtree needs on top of the host ones: the Mantine variables that differ
 * between the host theme and the kit theme (Mantine writes them only at the document root),
 * kit surfaces, and `--ae-*` tokens that differ from the defaults of `vars.module.css`.
 */
export function getAiKitCssVariables(
  hostTheme: MantineTheme,
  kitTheme: MantineTheme,
  tokens?: AeTokenOverrides
): AiKitCssVariables {
  const host = defaultCssVariablesResolver(hostTheme) as AiKitCssVariables;
  const kit = defaultCssVariablesResolver(kitTheme) as AiKitCssVariables;
  const defaults = getAiKitTokens(getAiKitOther({ ...kitTheme, defaultRadius: 'md', other: {} }));
  const kitTokens = getAiKitTokens(getAiKitOther(kitTheme));
  const tokenVariables = Object.fromEntries(
    Object.entries({
      ...diff(defaults as Record<string, string>, kitTokens as Record<string, string>),
      ...tokens,
    })
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([name, value]) => [`--ae-${name}`, String(value)])
  );
  const primaryChanged = Object.keys({
    ...diff(host.variables, kit.variables),
    ...diff(host.light, kit.light),
    ...diff(host.dark, kit.dark),
  }).some((name) => name.startsWith('--mantine-primary-color'));
  if (primaryChanged) {
    Object.assign(tokenVariables, { ...AI_KIT_PRIMARY_TOKENS, ...tokenVariables });
  }
  const light = diff(host.light, kit.light);
  const dark = diff(host.dark, kit.dark);
  for (const name of Object.keys({ ...light, ...dark })) {
    light[name] = kit.light[name];
    dark[name] = kit.dark[name];
  }
  return {
    variables: {
      ...diff(host.variables, kit.variables),
      ...AI_KIT_SURFACE_VARIABLES,
      ...tokenVariables,
    },
    light,
    dark,
  };
}

function declarations(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([name, value]) => `${name}:${value.replace(/[;{}<>]/g, '')};`)
    .join('');
}

/** Stylesheet that sets the variables on every element with the scope class, per color scheme */
export function buildAiKitScopedCss(scope: string, vars: AiKitCssVariables): string {
  return [
    Object.keys(vars.variables).length ? `.${scope}{${declarations(vars.variables)}}` : '',
    Object.keys(vars.light).length
      ? `[data-mantine-color-scheme='light'] .${scope}{${declarations(vars.light)}}`
      : '',
    Object.keys(vars.dark).length
      ? `[data-mantine-color-scheme='dark'] .${scope}{${declarations(vars.dark)}}`
      : '',
  ].join('');
}

export function sanitizeAiKitSettings(value: unknown): AiKitThemeSettings {
  if (!value || typeof value !== 'object') {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const settings: AiKitThemeSettings = {};
  if (isAiKitAccent(raw.accent)) {
    settings.accent = raw.accent;
  }
  if (isAiKitRadius(raw.radius)) {
    settings.radius = raw.radius;
  }
  if ((AI_KIT_DENSITIES as readonly unknown[]).includes(raw.density)) {
    settings.density = raw.density as AiKitDensity;
  }
  if ((AI_KIT_COLOR_SCHEMES as readonly unknown[]).includes(raw.colorScheme)) {
    settings.colorScheme = raw.colorScheme as MantineColorScheme;
  }
  return settings;
}

export function readAiKitSettings(key: string | undefined): AiKitThemeSettings {
  if (!key) {
    return {};
  }
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? sanitizeAiKitSettings(JSON.parse(stored)) : {};
  } catch {
    return {};
  }
}

export function writeAiKitSettings(key: string | undefined, settings: AiKitThemeSettings): boolean {
  if (!key) {
    return false;
  }
  try {
    if (Object.keys(settings).length === 0) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(settings));
    }
    return true;
  } catch {
    return false;
  }
}

/** Host values of the Mantine variables the kit re-declares, for host UI rendered inside the kit subtree */
export function getAiKitHostCssVariables(
  hostTheme: MantineTheme,
  kitVariables: AiKitCssVariables
): AiKitCssVariables {
  const host = defaultCssVariablesResolver(hostTheme) as AiKitCssVariables;
  const names = Object.keys({ ...kitVariables.variables, ...kitVariables.light }).filter((name) =>
    name.startsWith('--mantine-')
  );
  const pick = (source: Record<string, string>) =>
    Object.fromEntries(names.filter((name) => name in source).map((name) => [name, source[name]]));
  const primary = '--ae-primary' in kitVariables.variables ? AI_KIT_PRIMARY_TOKENS : {};
  return {
    variables: { ...pick(host.variables), ...primary },
    light: pick(host.light),
    dark: pick(host.dark),
  };
}
