import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import {
  Box,
  mergeMantineTheme,
  mergeThemeOverrides,
  MantineThemeProvider,
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

export interface AiKitThemeContextValue {
  /** Effective settings: props with the changes made through `setSettings` on top */
  settings: AiKitThemeSettings;
  /** Settings passed as props, the target of `reset` */
  defaults: AiKitThemeSettings;
  /** Merges a partial change into the settings; `undefined` values fall back to the props */
  setSettings: (patch: AiKitThemeSettings) => void;
  /** Drops every change made through `setSettings` */
  reset: () => void;
  /** Theme of the host `MantineProvider` above the kit */
  hostTheme: MantineTheme;
  /** Class that restores host CSS variables, used by `AiKitHostScope` */
  hostScope: string;
}

const AiKitThemeContext = createContext<AiKitThemeContextValue | null>(null);

export function useOptionalAiKitTheme(): AiKitThemeContextValue | null {
  return useContext(AiKitThemeContext);
}

/** Reads and changes the settings of the nearest `AiKitProvider`; `aiKit` is `theme.other.aiKit` resolved from `useMantineTheme()` */
export function useAiKitTheme(): AiKitThemeContextValue & { aiKit: AiKitThemeOther } {
  const context = useContext(AiKitThemeContext);
  const theme = useMantineTheme();
  if (!context) {
    throw new Error('useAiKitTheme must be used inside AiKitProvider');
  }
  return { ...context, aiKit: getAiKitOther(theme) };
}

function withoutUndefined(settings: AiKitThemeSettings): AiKitThemeSettings {
  return Object.fromEntries(
    Object.entries(settings).filter(([, value]) => value !== undefined)
  ) as AiKitThemeSettings;
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

  const setSettings = useCallback(
    (patch: AiKitThemeSettings) =>
      setChanges((previous) => {
        const next = withoutUndefined({ ...previous, ...patch });
        for (const key of Object.keys(patch) as (keyof AiKitThemeSettings)[]) {
          if (patch[key] === undefined) {
            delete next[key];
          }
        }
        writeAiKitSettings(persistKey, next);
        return next;
      }),
    [persistKey]
  );

  const reset = useCallback(() => {
    writeAiKitSettings(persistKey, {});
    setChanges({});
  }, [persistKey]);

  const settings = useMemo(() => ({ ...defaults, ...changes }), [defaults, changes]);
  const hostTheme = useMantineTheme();
  const { colorScheme: activeScheme, setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    if (settings.colorScheme && settings.colorScheme !== activeScheme) {
      setColorScheme(settings.colorScheme);
    }
  }, [settings.colorScheme]);

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
    () => ({ settings, defaults, setSettings, reset, hostTheme, hostScope: `${scope}-host` }),
    [settings, defaults, setSettings, reset, hostTheme, scope]
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
