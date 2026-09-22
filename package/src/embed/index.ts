import { optionsFromDataset, type ChatWidgetOptions, type LegacyWidgetOptions } from './options';
import { createChatWidget, type ChatWidget } from './widget';

export { createChatWidget } from './widget';
export type { ChatWidget, ChatWidgetEvent, ChatWidgetNotification } from './widget';
export { MAX_ACTIONS, DEFAULT_LABELS, optionsFromDataset, fromLocation } from './options';
export { BUILT_IN_ICONS } from './icons';
export type {
  WidgetCoordinate,
  WidgetLocation,
  LegacyWidgetOptions,
  ChatWidgetSize,
  ChatWidgetAction,
  ChatWidgetDevices,
  ChatWidgetIconAnimation,
  ChatWidgetLabels,
  ChatWidgetOptions,
  ChatWidgetPosition,
} from './options';

function configAddress(options: ChatWidgetOptions & LegacyWidgetOptions): string | undefined {
  if (options.configUrl) {
    return options.configUrl;
  }
  return options.appId && options.configEndpoint
    ? `${options.configEndpoint.replace(/\/$/, '')}/${encodeURIComponent(options.appId)}.json`
    : undefined;
}

/**
 * Creates the widget and, when `configUrl` or `appId` with `configEndpoint` is set, merges the
 * options from that JSON over the ones passed here as soon as it arrives
 */
export function chatWidget(options: ChatWidgetOptions & LegacyWidgetOptions = {}): ChatWidget {
  const widget = createChatWidget(options);
  const address = configAddress(options);
  if (address) {
    void fetch(address, { credentials: 'omit' })
      .then((response) => (response.ok ? (response.json() as Promise<ChatWidgetOptions>) : null))
      .then((remote) => {
        if (remote) {
          widget.setOptions({ ...remote, ...options });
        }
      })
      .catch(() => {});
  }
  return widget;
}

/**
 * Reads the options from the `data-*` attributes of a script tag and starts the widget. Without an
 * argument it takes the running script, and falls back to the tag marked `data-ai-kit-widget`
 */
export function initFromScript(script?: HTMLScriptElement | null): ChatWidget | undefined {
  const element =
    script ??
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>('script[data-ai-kit-widget]');
  if (!element) {
    return undefined;
  }
  const dataset = { ...element.dataset } as Record<string, string | undefined>;
  delete dataset.aiKitWidget;
  return chatWidget(optionsFromDataset(dataset));
}
