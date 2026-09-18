import React, { memo, useCallback, useId, useState } from 'react';
import {
  ActionIcon,
  Button,
  ColorSwatch,
  Group,
  rem,
  Stack,
  Text,
  Tooltip,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { IconDeviceDesktop, IconMoon, IconRefresh, IconSun } from '@tabler/icons-react';
import {
  AI_KIT_ACCENT_SHADES,
  AI_KIT_ACCENTS,
  AI_KIT_DEFAULT_DENSITY,
  AI_KIT_DENSITIES,
  AI_KIT_RADII,
  type AiKitAccent,
  type AiKitRadius,
  type AiKitThemeSettings,
} from './ai-kit-settings';
import { useOptionalAiKitTheme } from './AiKitProvider';
import classes from './AiKitThemeCustomizer.module.css';

export interface AiKitThemeCustomizerLabels {
  title: string;
  reset: string;
  color: string;
  radius: string;
  density: string;
  mode: string;
  defaultAccent: string;
  compact: string;
  default: string;
  sharp: string;
  round: string;
  neutral: string;
  light: string;
  dark: string;
  auto: string;
  /** Accent names, the accent key by default */
  accents?: Partial<Record<AiKitAccent, string>>;
}

export const DEFAULT_AI_KIT_THEME_CUSTOMIZER_LABELS: AiKitThemeCustomizerLabels = {
  title: 'Theme',
  reset: 'Reset',
  color: 'Color',
  radius: 'Radius',
  density: 'Density',
  mode: 'Mode',
  defaultAccent: 'Default',
  compact: 'Compact',
  default: 'Default',
  sharp: 'Sharp',
  round: 'Round',
  neutral: 'Neutral',
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

const RADIUS_BY_KEY: Record<string, AiKitRadius> = { xs: 'sharp', lg: 'round' };

export interface AiKitThemeCustomizerProps {
  /** Controlled settings; without `value` and `defaultValue` the nearest `AiKitProvider` is used */
  value?: AiKitThemeSettings;
  /** Initial settings for uncontrolled use without a provider */
  defaultValue?: AiKitThemeSettings;
  /** Called with the full settings after every change and after reset */
  onChange?: (settings: AiKitThemeSettings) => void;
  /** Accents offered in the Color section, a subset of `AI_KIT_ACCENTS` */
  accents?: readonly AiKitAccent[];
  /** Hides sections, for example when the host controls the color scheme itself */
  sections?: Partial<Record<'color' | 'radius' | 'density' | 'mode', boolean>>;
  /** Overrides of the default English labels */
  labels?: Partial<AiKitThemeCustomizerLabels>;
  /** Shows an option live while it is hovered or focused and restores the stored theme when it is left; needs an `AiKitProvider` */
  preview?: boolean;
}

interface OptionProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  leftSection?: React.ReactNode;
  onPreview?: () => void;
  onEndPreview?: () => void;
}

function Option({
  selected,
  onClick,
  children,
  leftSection,
  onPreview,
  onEndPreview,
}: OptionProps) {
  return (
    <Button
      classNames={{ root: classes.option, section: classes.optionSection }}
      vars={() => ({
        root: {
          '--button-height': 'var(--ae-control-height-md)',
          '--button-padding-x': rem(10),
          '--button-radius': 'var(--ae-row-radius)',
          '--button-fz': 'var(--ae-font-size-xs)',
          '--button-bg': selected
            ? 'color-mix(in srgb, var(--ae-fg) 8%, transparent)'
            : 'transparent',
          '--button-hover': 'color-mix(in srgb, var(--ae-fg) 8%, transparent)',
          '--button-color': selected ? 'var(--ae-fg)' : 'var(--ae-fg-muted)',
          '--button-bd': 'none',
        },
      })}
      data-selected={selected || undefined}
      aria-pressed={selected}
      leftSection={leftSection}
      onClick={onClick}
      onMouseEnter={onPreview}
      onFocus={onPreview}
      onMouseLeave={onEndPreview}
      onBlur={onEndPreview}
    >
      {children}
    </Button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  const labelId = useId();
  return (
    <Stack gap={6} role="group" aria-labelledby={labelId}>
      <Text id={labelId} className={classes.sectionLabel}>
        {label}
      </Text>
      <Group gap={6} className={classes.options}>
        {children}
      </Group>
    </Stack>
  );
}

function accentSwatchColor(accent: AiKitAccent, scheme: 'light' | 'dark'): string {
  return `var(--mantine-color-${accent}-${AI_KIT_ACCENT_SHADES[accent][scheme]})`;
}

/** Theme panel for `AiKitProvider`: accent, radius, density and color scheme as pill options */
export const AiKitThemeCustomizer = memo(function AiKitThemeCustomizer({
  value,
  defaultValue,
  onChange,
  accents = AI_KIT_ACCENTS,
  sections,
  labels: labelOverrides,
  preview = false,
}: AiKitThemeCustomizerProps) {
  const labels = { ...DEFAULT_AI_KIT_THEME_CUSTOMIZER_LABELS, ...labelOverrides };
  const provider = useOptionalAiKitTheme();
  const mantineTheme = useMantineTheme();
  const { colorScheme: activeScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const [local, setLocal] = useState<AiKitThemeSettings>(defaultValue ?? {});
  const usesProvider = value === undefined && defaultValue === undefined && provider !== null;
  const settings = value ?? (usesProvider ? provider.setting : local);
  const previews = preview && usesProvider;

  const update = useCallback(
    (patch: AiKitThemeSettings) => {
      const next = { ...settings, ...patch };
      if (usesProvider) {
        provider.setSettings(patch);
        provider.cancelPreview();
      } else if (value === undefined) {
        setLocal(next);
      }
      onChange?.(next);
    },
    [settings, usesProvider, provider, value, onChange]
  );

  const startPreview = useCallback(
    (patch: AiKitThemeSettings) => (previews ? () => provider.setPreview(patch) : undefined),
    [previews, provider]
  );

  const endPreview = useCallback(
    () => (previews ? provider.cancelPreview() : undefined),
    [previews, provider]
  );

  const reset = useCallback(() => {
    if (usesProvider) {
      provider.reset();
      onChange?.(provider.defaults);
      return;
    }
    const next = defaultValue ?? {};
    if (value === undefined) {
      setLocal(next);
    }
    onChange?.(next);
  }, [usesProvider, provider, defaultValue, value, onChange]);

  const show = { color: true, radius: true, density: true, mode: true, ...sections };
  const radius = settings.radius ?? RADIUS_BY_KEY[String(mantineTheme.defaultRadius)] ?? 'default';
  const density = settings.density ?? AI_KIT_DEFAULT_DENSITY;
  const scheme = settings.colorScheme ?? activeScheme;

  return (
    <Stack gap="lg" className={classes.root}>
      <Group justify="space-between" wrap="nowrap">
        <Text className={classes.title}>{labels.title}</Text>
        <Tooltip label={labels.reset}>
          <ActionIcon
            aria-label={labels.reset}
            onClick={reset}
            vars={() => ({
              root: {
                '--ai-size': 'var(--ae-control-height-sm)',
                '--ai-radius': 'var(--ae-row-radius)',
                '--ai-bg': 'transparent',
                '--ai-hover': 'color-mix(in srgb, var(--ae-fg) 8%, transparent)',
                '--ai-color': 'color-mix(in srgb, var(--ae-fg-muted) 70%, transparent)',
                '--ai-hover-color': 'var(--ae-fg)',
                '--ai-bd': 'none',
              },
            })}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <Stack gap="md">
        {show.color && (
          <Section label={labels.color}>
            <Option
              selected={!settings.accent}
              onClick={() => update({ accent: undefined })}
              onPreview={startPreview({ accent: undefined })}
              onEndPreview={endPreview}
            >
              {labels.defaultAccent}
            </Option>
            {accents.map((accent) => (
              <Option
                key={accent}
                selected={settings.accent === accent}
                onClick={() => update({ accent })}
                onPreview={startPreview({ accent })}
                onEndPreview={endPreview}
                leftSection={
                  <ColorSwatch
                    color={accentSwatchColor(accent, computedScheme)}
                    size={10}
                    withShadow={false}
                  />
                }
              >
                {labels.accents?.[accent] ?? (accent === 'gray' ? labels.neutral : accent)}
              </Option>
            ))}
          </Section>
        )}
        {show.radius && (
          <Section label={labels.radius}>
            {AI_KIT_RADII.map((option) => (
              <Option
                key={option}
                selected={radius === option}
                onClick={() => update({ radius: option })}
                onPreview={startPreview({ radius: option })}
                onEndPreview={endPreview}
              >
                {labels[option]}
              </Option>
            ))}
          </Section>
        )}
        {show.density && (
          <Section label={labels.density}>
            {AI_KIT_DENSITIES.map((option) => (
              <Option
                key={option}
                selected={density === option}
                onClick={() => update({ density: option })}
                onPreview={startPreview({ density: option })}
                onEndPreview={endPreview}
              >
                {labels[option]}
              </Option>
            ))}
          </Section>
        )}
        {show.mode && (
          <Section label={labels.mode}>
            <Option
              selected={scheme === 'light'}
              onClick={() => update({ colorScheme: 'light' })}
              onPreview={startPreview({ colorScheme: 'light' })}
              onEndPreview={endPreview}
              leftSection={<IconSun size={14} />}
            >
              {labels.light}
            </Option>
            <Option
              selected={scheme === 'dark'}
              onClick={() => update({ colorScheme: 'dark' })}
              onPreview={startPreview({ colorScheme: 'dark' })}
              onEndPreview={endPreview}
              leftSection={<IconMoon size={14} />}
            >
              {labels.dark}
            </Option>
            <Option
              selected={scheme === 'auto'}
              onClick={() => update({ colorScheme: 'auto' })}
              onPreview={startPreview({ colorScheme: 'auto' })}
              onEndPreview={endPreview}
              leftSection={<IconDeviceDesktop size={14} />}
            >
              {labels.auto}
            </Option>
          </Section>
        )}
      </Stack>
    </Stack>
  );
});

AiKitThemeCustomizer.displayName = 'AiKitThemeCustomizer';
