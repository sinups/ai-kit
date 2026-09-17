import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MantineProvider, type MantineThemeOverride } from '@mantine/core';
import { collectDocumentStyles, scopeCssToShadowRoot, SHADOW_ROOT_CLASS } from './shadow-styles';

export interface MountChatLauncherOptions {
  /** Renders inside an open shadow root so the host page styles do not reach the widget, `true` by default */
  shadow?: boolean;
  /** CSS text added to the shadow root, usually Mantine and kit stylesheets; `:root`, `html` and `body` selectors are scoped to the widget */
  styles?: string[];
  /** Stylesheet URLs linked in the shadow root as they are, without scoping */
  styleUrls?: string[];
  /** Copies the stylesheets of the current document head into the shadow root, for development builds that inject CSS modules at runtime */
  adoptDocumentStyles?: boolean;
  /** Mantine theme of the widget */
  theme?: MantineThemeOverride;
  /** Color scheme of the widget, `light` by default */
  colorScheme?: 'light' | 'dark';
  /** Wraps the element inside the widget provider, for example with `AiKitProvider` */
  wrap?: (element: React.ReactNode) => React.ReactNode;
}

export interface MountedChatLauncher {
  /** Element that holds the widget: the container inside the shadow root or the target itself */
  container: HTMLElement;
  /** Removes the widget and its shadow content */
  unmount: () => void;
}

function createStyle(css: string): HTMLStyleElement {
  const style = document.createElement('style');
  style.textContent = css;
  return style;
}

function createLink(href: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  return link;
}

/** Mounts a chat launcher on a third-party page, isolated in a shadow root with its own Mantine provider */
export function mountChatLauncher(
  target: HTMLElement | ShadowRoot,
  element: React.ReactNode,
  {
    shadow = true,
    styles = [],
    styleUrls = [],
    adoptDocumentStyles = false,
    theme,
    colorScheme = 'light',
    wrap,
  }: MountChatLauncherOptions = {}
): MountedChatLauncher {
  const isShadowTarget = typeof ShadowRoot !== 'undefined' && target instanceof ShadowRoot;
  const useShadow = isShadowTarget || shadow;
  const host = useShadow
    ? isShadowTarget
      ? target
      : ((target as HTMLElement).shadowRoot ??
        (target as HTMLElement).attachShadow({ mode: 'open' }))
    : (target as HTMLElement);

  const container = document.createElement('div');
  container.className = SHADOW_ROOT_CLASS;
  const appRoot = document.createElement('div');
  const portalTarget = document.createElement('div');
  container.append(appRoot, portalTarget);

  const styleNodes: HTMLElement[] = [];
  if (useShadow) {
    if (adoptDocumentStyles) {
      const collected = collectDocumentStyles(document);
      styleNodes.push(...collected.urls.map(createLink));
      styleNodes.push(...collected.texts.map((css) => createStyle(scopeCssToShadowRoot(css))));
    }
    styleNodes.push(...styleUrls.map(createLink));
    styleNodes.push(...styles.map((css) => createStyle(scopeCssToShadowRoot(css))));
  }
  host.append(...styleNodes, container);

  const providerTheme: MantineThemeOverride = {
    ...theme,
    components: {
      ...theme?.components,
      Portal: { defaultProps: { target: portalTarget } },
    },
  };

  const root: Root = createRoot(appRoot);
  root.render(
    <MantineProvider
      theme={providerTheme}
      forceColorScheme={colorScheme}
      getRootElement={() => container}
      cssVariablesSelector={`.${SHADOW_ROOT_CLASS}`}
    >
      {wrap ? wrap(element) : element}
    </MantineProvider>
  );

  return {
    container,
    unmount: () => {
      root.unmount();
      container.remove();
      styleNodes.forEach((node) => node.remove());
    },
  };
}
