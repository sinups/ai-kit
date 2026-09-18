import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  mergeMantineTheme,
  mergeThemeOverrides,
  MantineThemeProvider,
  useComputedColorScheme,
  useMantineColorScheme,
  useMantineTheme,
  type MantineTheme,
  type MantineThemeOverride,
} from '@mantine/core';
import {
  buildAiKitScopedCss,
  getAiKitCssVariables,
  getAiKitHostCssVariables,
  getAiKitOther,
  getAiKitSettingsTheme,
  readAiKitSettings,
  writeAiKitSettings,
  type AiKitThemeOther,
  type AiKitThemeSettings,
} from './ai-kit-settings';
import { AI_KIT_SCOPE_CLASS, createAiKitTheme } from './create-ai-kit-theme';
import type { AeTokenOverrides } from './tokens';
import classes from './ai-kit-theme.module.css';

export interface AiKitProviderProps extends AiKitThemeSettings {
  /** Overrides applied on top of the kit theme, for example `components.Button.defaultProps` */
  theme?: MantineThemeOverride;
  /** `--ae-*` token values for this subtree, keys without the `--ae-` prefix; they win over settings */
  tokens?: AeTokenOverrides;
  /** localStorage key; when set, changes made through `useAiKitTheme` are saved and restored */
  persistKey?: string;
  /** Kit components; must be rendered inside the host `MantineProvider` */
  children?: React.ReactNode;
}

/** Color scheme in effect: the stored setting with `auto` resolved against the system preference */
export type AiKitResolvedColorScheme = 'light' | 'dark';

/** The stored theme setting, as opposed to the theme currently shown (which a preview can change) */
export interface AiKitThemeSettingValue {
  /** Stored settings: props with the saved changes on top; `colorScheme` may still be `auto` */
  setting: AiKitThemeSettings;
  /** Settings passed as props, the target of `reset` */
  defaults: AiKitThemeSettings;
  /** Merges a partial change into the stored settings and persists it; `undefined` values fall back to the props */
  setSetting: (patch: AiKitThemeSettings) => void;
  /** Drops every stored change */
  reset: () => void;
  /** `setting.colorScheme` with `auto` resolved against the system preference */
  resolvedColorScheme: AiKitResolvedColorScheme;
}

/** Settings shown on top of the stored ones until they are saved or cancelled */
export interface AiKitThemePreviewValue {
  /** Settings previewed on top of the stored ones, `null` while nothing is previewed */
  preview: AiKitThemeSettings | null;
  /** Shows a partial change live without storing it; `null` ends the preview */
  setPreview: (patch: AiKitThemeSettings | null) => void;
  /** Stores the current preview through `setSetting` and ends the preview */
  savePreview: () => void;
  /** Ends the preview and restores the stored settings */
  cancelPreview: () => void;
}

export interface AiKitThemeContextValue extends AiKitThemeSettingValue, AiKitThemePreviewValue {
  /** Effective settings: props with the changes made through `setSettings` and the preview on top */
  settings: AiKitThemeSettings;
  /** Merges a partial change into the settings; `undefined` values fall back to the props */
  setSettings: (patch: AiKitThemeSettings) => void;
  /** Theme of the host `MantineProvider` above the kit */
  hostTheme: MantineTheme;
  /** Class that restores host CSS variables, used by `AiKitHostScope` */
  hostScope: string;
}

const AiKitThemeContext = createContext<AiKitThemeContextValue | null>(null);

export function useOptionalAiKitTheme(): AiKitThemeContextValue | null {
  return useContext(AiKitThemeContext);
}

function useAiKitThemeContext(hook: string): AiKitThemeContextValue {
  const context = useContext(AiKitThemeContext);
  if (!context) {
    throw new Error(`${hook} must be used inside AiKitProvider`);
  }
  return context;
}

/** Reads and changes the settings of the nearest `AiKitProvider`; `aiKit` is `theme.other.aiKit` resolved from `useMantineTheme()` */
export function useAiKitTheme(): AiKitThemeContextValue & { aiKit: AiKitThemeOther } {
  const context = useAiKitThemeContext('useAiKitTheme');
  const theme = useMantineTheme();
  return { ...context, aiKit: getAiKitOther(theme) };
}

/** Reads and changes what the nearest `AiKitProvider` stores, ignoring any running preview */
export function useAiKitThemeSetting(): AiKitThemeSettingValue {
  const { setting, defaults, setSetting, reset, resolvedColorScheme } =
    useAiKitThemeContext('useAiKitThemeSetting');
  return { setting, defaults, setSetting, reset, resolvedColorScheme };
}

/** Shows settings live in the nearest `AiKitProvider` before they are stored, with `savePreview` and `cancelPreview` */
export function useAiKitThemePreview(): AiKitThemePreviewValue {
  const { preview, setPreview, savePreview, cancelPreview } =
    useAiKitThemeContext('useAiKitThemePreview');
  return { preview, setPreview, savePreview, cancelPreview };
}

function withoutUndefined(settings: AiKitThemeSettings): AiKitThemeSettings {
  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined)
  ) as AiKitThemeSettings;
}

function applyPatch(base: AiKitThemeSettings, patch: AiKitThemeSettings): AiKitThemeSettings {
  return withoutUndefined({ ...base, ...patch });
}

/**
 * Applies the kit theme to its subtree only (except `colorScheme`, which is app wide): stock Mantine components inside take the kit's
 * visual language while the host's own components outside keep the host theme.
 * Settings are written to standard theme fields (`primaryColor`, `defaultRadius`) and
 * `theme.other.aiKit`; the CSS variables Mantine writes only at the document root are
 * re-declared on the subtree and on its portals.
 */
export function AiKitProvider({
  accent,
  radius,
  density,
  colorScheme,
  theme,
  tokens,
  persistKey,
  children,
}: AiKitProviderProps) {
  const defaults = useMemo(
    () => withoutUndefined({ accent, radius, density, colorScheme }),
    [accent, radius, density, colorScheme]
  );
  const [changes, setChanges] = useState(() => readAiKitSettings(persistKey));
  const [loadedKey, setLoadedKey] = useState(persistKey);
  if (loadedKey !== persistKey) {
    setLoadedKey(persistKey);
    setChanges(readAiKitSettings(persistKey));
  }

  const [preview, setPreview] = useState<AiKitThemeSettings | null>(null);

  const setSettings = useCallback(
    (patch: AiKitThemeSettings) =>
      setChanges((previous) => {
        const next = applyPatch(previous, patch);
        writeAiKitSettings(persistKey, next);
        return next;
      }),
    [persistKey]
  );

  const reset = useCallback(() => {
    writeAiKitSettings(persistKey, {});
    setPreview(null);
    setChanges({});
  }, [persistKey]);

  const setting = useMemo(() => ({ ...defaults, ...changes }), [defaults, changes]);
  const settings = useMemo(
    () => (preview ? applyPatch(setting, preview) : setting),
    [setting, preview]
  );

  const previewRef = useRef(preview);
  previewRef.current = preview;

  const savePreview = useCallback(() => {
    if (previewRef.current) {
      setSettings(previewRef.current);
    }
    setPreview(null);
  }, [setSettings]);

  const cancelPreview = useCallback(() => setPreview(null), []);

  const hostTheme = useMantineTheme();
  const { colorScheme: activeScheme, setColorScheme } = useMantineColorScheme();
  const computedScheme = useComputedColorScheme('light');
  const activeSchemeRef = useRef(activeScheme);
  activeSchemeRef.current = activeScheme;
  const hostSchemeRef = useRef(activeScheme);

  useEffect(() => {
    const next = settings.colorScheme ?? hostSchemeRef.current;
    if (next !== activeSchemeRef.current) {
      setColorScheme(next);
    }
  }, [settings.colorScheme]);

  const resolvedColorScheme: AiKitResolvedColorScheme =
    setting.colorScheme && setting.colorScheme !== 'auto' ? setting.colorScheme : computedScheme;

  const scope = `ae-kit-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const kitOverride = useMemo(() => {
    const portal: MantineThemeOverride = {
      components: {
        Portal: {
          defaultProps: { className: `${scope} ${AI_KIT_SCOPE_CLASS}`, reuseTargetNode: false },
        },
      },
    };
    const withSettings = mergeThemeOverrides(portal, getAiKitSettingsTheme(settings));
    return createAiKitTheme(theme ? mergeThemeOverrides(withSettings, theme) : withSettings);
  }, [scope, settings, theme]);

  const css = useMemo(() => {
    const kitTheme = mergeMantineTheme(hostTheme, kitOverride);
    const variables = getAiKitCssVariables(hostTheme, kitTheme, tokens);
    return (
      buildAiKitScopedCss(scope, variables) +
      buildAiKitScopedCss(`${scope}-host`, getAiKitHostCssVariables(hostTheme, variables))
    );
  }, [hostTheme, kitOverride, scope, tokens]);

  const contextValue = useMemo(
    () => ({
      settings,
      setting,
      defaults,
      setSettings,
      setSetting: setSettings,
      reset,
      resolvedColorScheme,
      preview,
      setPreview,
      savePreview,
      cancelPreview,
      hostTheme,
      hostScope: `${scope}-host`,
    }),
    [
      settings,
      setting,
      defaults,
      setSettings,
      reset,
      resolvedColorScheme,
      preview,
      savePreview,
      cancelPreview,
      hostTheme,
      scope,
    ]
  );

  return (
    <AiKitThemeContext.Provider value={contextValue}>
      <Box className={`${classes.tokens} ${scope} ${AI_KIT_SCOPE_CLASS}`}>
        <style data-ae-theme="">{css}</style>
        <MantineThemeProvider theme={kitOverride}>{children}</MantineThemeProvider>
      </Box>
    </AiKitThemeContext.Provider>
  );
}

/**
 * Renders host UI inside a kit subtree with the host theme: stock components inside keep the
 * host look, for example a host toolbar placed between kit panels.
 */
export function AiKitHostScope({ children }: { children?: React.ReactNode }) {
  const context = useContext(AiKitThemeContext);
  if (!context) {
    return <>{children}</>;
  }
  return (
    <Box className={`${classes.tokens} ${context.hostScope}`}>
      <MantineThemeProvider inherit={false} theme={context.hostTheme}>
        {children}
      </MantineThemeProvider>
    </Box>
  );
}
