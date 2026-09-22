import { escapeAttribute, escapeText, inlineMarkdown, renderIcon } from './icons';
import {
  DEFAULT_LABELS,
  resolveOptions,
  type ChatWidgetAction,
  type ChatWidgetOptions,
  type LegacyWidgetOptions,
} from './options';
import { WIDGET_STYLES } from './styles';

export type ChatWidgetEvent = 'open' | 'close' | 'action' | 'message' | 'ready';

export interface ChatWidgetNotification {
  /** Text of the bubble */
  text?: string;
  /** The same as `text` */
  content?: string;
  /** Quiet line above the text, usually who is writing or what it is about */
  title?: string;
  /** Image URL shown beside the text */
  avatar?: string;
  /** Milliseconds before the bubble hides itself, `0` or `false` keeps it until it is dismissed */
  timeout?: number | false;
  /** Identity, so the same notification is not shown twice */
  id?: string;
}

export interface ChatWidget {
  /** Opens the panel */
  open: () => void;
  /** Closes the panel */
  close: () => void;
  /** Opens the panel when it is closed and the other way round */
  toggle: (next?: boolean) => void;
  /** Shows a bubble above the closed button and returns its `hide` */
  notify: (notification: ChatWidgetNotification | string) => { hide: () => void };
  /** Removes every bubble on screen */
  clearNotifications: () => void;
  /** Takes the whole widget off the page without destroying it */
  hide: () => void;
  /** Brings a hidden widget back */
  show: () => void;
  /** Opens the panel on another address */
  navigate: (url: string) => void;
  /** Sends a message to the chat page inside the panel */
  send: (type: string, data?: Record<string, unknown>) => void;
  /** Live options: assigning a field applies it, like `widget.options.color = '#000'` */
  options: ChatWidgetOptions;
  /** Sets the count on the button, `0` hides the badge */
  unread: (count: number) => void;
  /** Merges new options into the current ones */
  setOptions: (options: ChatWidgetOptions & LegacyWidgetOptions) => void;
  /** Subscribes to an event and returns the unsubscribe */
  on: (event: ChatWidgetEvent, listener: (payload?: unknown) => void) => () => void;
  /** Removes the widget, its listeners and its timers */
  destroy: () => void;
}

const HOST_TAG = 'ai-kit-widget';
const MESSAGE_SOURCE = 'ai-kit-chat';

function storageKey(url: string): string {
  return `ai-kit-widget:${url}`;
}

function readDismissed(url: string): boolean {
  try {
    return window.localStorage.getItem(storageKey(url)) === 'closed';
  } catch {
    return false;
  }
}

function writeDismissed(url: string): void {
  try {
    window.localStorage.setItem(storageKey(url), 'closed');
  } catch {
    /* private mode keeps the widget stateless */
  }
}

function originOf(url: string): string {
  try {
    return new URL(url, window.location.href).origin;
  } catch {
    return '';
  }
}

function contrastColor(color: string): string {
  const hex = color.trim().replace('#', '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((part) => part + part)
          .join('')
      : hex;
  const value = Number.parseInt(full.slice(0, 6), 16);
  if (full.length < 6 || Number.isNaN(value)) {
    return '#fff';
  }
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? '#111' : '#fff';
}

/** Builds the widget, its shadow root and everything the page can drive from outside */
export function createChatWidget(
  options: ChatWidgetOptions & LegacyWidgetOptions = {}
): ChatWidget {
  let current = resolveOptions(options);
  const listeners = new Map<ChatWidgetEvent, Set<(payload?: unknown) => void>>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const seenNotifications = new Set<string>();
  let opened = false;
  let actionsOpened = false;
  let unreadCount = 0;
  let frame: HTMLIFrameElement | null = null;
  let destroyed = false;
  let touched = false;
  let hidden = false;
  let darkMedia: MediaQueryList | null = null;

  const host = document.createElement(HOST_TAG);
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = WIDGET_STYLES;
  const hostStyle = document.createElement('style');
  const root = document.createElement('div');
  root.className = 'container';
  shadow.append(style, hostStyle, root);

  const emit = (event: ChatWidgetEvent, payload?: unknown) => {
    listeners.get(event)?.forEach((listener) => listener(payload));
  };

  const narrow = () => window.innerWidth < current.mobileBreakpoint;

  const allowedHere = () =>
    current.devices === 'all' ||
    (current.devices === 'mobile' && narrow()) ||
    (current.devices === 'desktop' && !narrow());

  const prefersDark = () => {
    if (current.theme !== 'auto') {
      return current.theme === 'dark';
    }
    darkMedia = darkMedia ?? window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
    return darkMedia?.matches ?? false;
  };

  const applyVars = () => {
    const dark = prefersDark();
    const vars: Record<string, string> = {
      '--w-z': String(current.zIndex),
      '--w-x': `${current.offset.x}px`,
      '--w-y': `${current.offset.y}px`,
      '--w-size': `${current.size}px`,
      '--w-color': current.color,
      '--w-on-color': current.iconColor || contrastColor(current.color),
      '--w-ring': `color-mix(in srgb, ${current.ringColor || current.color} 30%, transparent)`,
      '--w-action-size': `${current.actionSize}px`,
      '--w-step': `${current.actionSize + current.actionGap}px`,
      '--w-inset': `${Math.round(current.size * 0.1)}px`,
      '--w-ring-soft': `color-mix(in srgb, ${current.ringColor || current.color} 10%, transparent)`,
      '--w-panel-width': `${Math.max(
        240,
        Math.min(current.panelWidth, window.innerWidth - 2 * current.offset.x)
      )}px`,
      '--w-panel-height': `${Math.max(
        240,
        Math.min(current.panelHeight, window.innerHeight - 2 * current.offset.y - current.size - 12)
      )}px`,
      '--w-mobile-height': `${current.mobileHeight}dvh`,
      '--w-scheme': current.theme === 'auto' ? 'light dark' : current.theme,
      '--w-surface': dark ? '#1f2023' : '#fff',
      '--w-fg': dark ? '#f1f3f5' : '#1a1b1e',
      '--w-muted': dark ? '#9aa1a9' : '#6b7280',
      '--w-close-bg': dark ? 'rgb(255 255 255 / 10%)' : 'rgb(0 0 0 / 6%)',
      '--w-teaser-shift': current.position.endsWith('left') ? '-20px' : '20px',
      '--w-font':
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    };
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
    root.dataset.position = current.position;
    root.hidden = hidden || !allowedHere();
    hostStyle.textContent = current.css;
  };

  const actionMarkup = (action: ChatWidgetAction, index: number) => {
    const tag = action.href ? 'a' : 'button';
    const attributes = action.href
      ? `href="${escapeAttribute(action.href)}"${action.target ? ` target="${escapeAttribute(action.target)}" rel="noopener noreferrer"` : ''}`
      : 'type="button"';
    const paint = [
      action.color ? `background:${action.color}` : '',
      action.iconColor ? `color:${action.iconColor}` : action.color ? 'color:#fff' : '',
    ]
      .filter(Boolean)
      .join(';');
    const background = paint ? ` style="${escapeAttribute(paint)}"` : '';
    return `<div class="multi_button_item" style="--w-index:${index}">
      <${tag} data-action="${escapeAttribute(action.id)}" aria-label="${escapeAttribute(action.label)}" ${attributes}${background}>
        ${renderIcon(action.icon ?? 'chat')}
        ${action.unread ? `<span class="multi_button_noty">${action.unread > 99 ? '99+' : action.unread}</span>` : ''}
      </${tag}>
      <div class="multi_notification">${escapeText(action.label)}</div>
    </div>`;
  };

  const render = () => {
    const { labels, actions, title, url } = current;
    const hasActions = actions.length > 0;
    root.innerHTML = `
      <div class="backdrop" part="backdrop"></div>
      <div class="panel" role="dialog" aria-modal="false" aria-label="${escapeAttribute(title || labels.panel)}">
        ${title ? `<div class="header"><span>${escapeText(title)}</span><button type="button" class="panelClose" aria-label="${escapeAttribute(labels.close)}">${renderIcon('close')}</button></div>` : ''}
        <div class="frameSlot"></div>
      </div>
      <div class="multi_button_wrap">
        <button type="button" class="multi_button${current.iconAnimation !== 'none' ? ` animation_${current.iconAnimation}` : ''}" aria-label="${escapeAttribute(hasActions ? labels.actions : labels.open)}" aria-expanded="false"${current.pulse ? ' data-pulse' : ''}>
          <span class="multi_button_close"></span>
          <span class="multi_button_noty" hidden></span>
          <span class="multi_button_icon">${renderIcon(current.icon)}</span>
          ${current.avatar ? `<span class="multi_button_img"><img src="${escapeAttribute(current.avatar)}" alt="" /></span>` : ''}
        </button>
      </div>
      ${hasActions ? `<div class="multi_list" role="group" aria-label="${escapeAttribute(labels.actions)}" data-motion="${current.actionsMotion}" style="--w-count:${actions.length}">${actions.map(actionMarkup).join('')}</div>` : ''}`;

    if (frame) {
      root.querySelector('.frameSlot')?.append(frame);
    } else if (!current.defer && url) {
      mountFrame();
    }
    if (teasers) {
      root.append(teasers);
    }
    applyVars();
    applyState();
  };

  const mountFrame = () => {
    if (frame || !current.url) {
      return;
    }
    frame = document.createElement('iframe');
    frame.className = 'frame';
    frame.src = current.url;
    frame.title = current.title || current.labels.panel;
    frame.allow = 'microphone; clipboard-write';
    root.querySelector('.frameSlot')?.append(frame);
  };

  const applyState = () => {
    const button = root.querySelector<HTMLButtonElement>('.multi_button');
    const badge = root.querySelector<HTMLElement>('.multi_button > .multi_button_noty');
    const hasActions = current.actions.length > 0;
    root.toggleAttribute('data-opened', opened);
    root.toggleAttribute('data-actions-opened', actionsOpened);
    root.dataset.mode = narrow() ? 'full' : 'panel';
    if (button) {
      const label = actionsOpened
        ? current.labels.closeActions
        : hasActions
          ? current.labels.actions
          : opened
            ? current.labels.close
            : current.labels.open;
      button.setAttribute(
        'aria-label',
        unreadCount > 0 && !opened && !actionsOpened
          ? `${label}, ${unreadCount} ${current.labels.unread}`
          : label
      );
      button.setAttribute('aria-expanded', String(hasActions ? actionsOpened : opened));
    }
    if (badge) {
      badge.hidden = unreadCount === 0 || !current.indicator;
      badge.textContent = unreadCount > 99 ? '99+' : String(unreadCount);
    }
    root
      .querySelectorAll<HTMLElement>('[data-action]')
      .forEach((action) => action.setAttribute('tabindex', actionsOpened ? '0' : '-1'));
  };

  const setOpened = (next: boolean) => {
    if (opened === next || (next && !current.url)) {
      return;
    }
    opened = next;
    actionsOpened = false;
    if (opened) {
      mountFrame();
      unreadCount = 0;
      clearTeaser();
    } else if (current.remember) {
      writeDismissed(current.url);
    }
    applyState();
    frame?.contentWindow?.postMessage(
      { source: 'ai-kit-widget', type: opened ? 'open' : 'close' },
      originOf(current.url) || '*'
    );
    emit(opened ? 'open' : 'close');
  };

  let teasers: HTMLElement | null = null;

  const teaserList = () => {
    if (!teasers) {
      teasers = document.createElement('div');
      teasers.className = 'teasers';
      root.append(teasers);
    }
    return teasers;
  };

  const dropTeaser = (element: HTMLElement) => {
    if (!element.isConnected || element.hasAttribute('data-leaving')) {
      return;
    }
    const { height } = element.getBoundingClientRect();
    element.style.marginBlockStart = `-${height}px`;
    element.setAttribute('data-leaving', '');
    element.removeAttribute('data-shown');
    later(() => {
      element.remove();
      if (teasers && teasers.childElementCount === 0) {
        root.removeAttribute('data-teaser');
      }
    }, 400);
  };

  const clearTeaser = () => {
    teasers?.querySelectorAll<HTMLElement>('.teaser').forEach(dropTeaser);
  };

  const showTeaser = (notification: ChatWidgetNotification) => {
    root.setAttribute('data-teaser', '');
    const list = teaserList();
    while (list.childElementCount >= current.notificationLimit) {
      const oldest = list.lastElementChild as HTMLElement | null;
      if (!oldest) {
        break;
      }
      oldest.remove();
    }
    const element = document.createElement('div');
    element.className = 'teaser';
    element.setAttribute('role', 'status');
    element.innerHTML = `
      ${notification.avatar ? `<img class="teaser_avatar" src="${escapeAttribute(notification.avatar)}" alt="" />` : ''}
      <div class="teaser_body">
        ${notification.title ? `<div class="teaser_title">${escapeText(notification.title)}</div>` : ''}
        <div class="text">${inlineMarkdown(notification.text ?? notification.content ?? '')}</div>
      </div>
      <button type="button" class="teaser_close" aria-label="${escapeAttribute(current.labels.dismissNotification)}">${renderIcon('close')}</button>`;
    element.querySelector('img')?.addEventListener('error', (event) => {
      (event.currentTarget as HTMLElement).remove();
    });
    element.addEventListener('click', (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('a')) {
        return;
      }
      if (target?.closest('.teaser_close')) {
        dropTeaser(element);
        return;
      }
      setOpened(true);
    });
    list.prepend(element);
    requestAnimationFrame(() => element.setAttribute('data-shown', ''));
    return element;
  };

  const later = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const onClick = (event: Event) => {
    const target = event.composedPath()[0] as HTMLElement | undefined;
    const actionElement = target?.closest?.('[data-action]');
    if (actionElement) {
      touched = true;
      const id = actionElement.getAttribute('data-action');
      const action = current.actions.find((item) => item.id === id);
      actionsOpened = false;
      applyState();
      emit('action', id);
      if (action?.opensChat) {
        setOpened(true);
      }
      return;
    }
    if (target?.closest?.('.panelClose') || target?.closest?.('.backdrop')) {
      setOpened(false);
      return;
    }
    if (target?.closest?.('.multi_button')) {
      touched = true;
      clearTeaser();
      if (opened) {
        setOpened(false);
      } else if (current.actions.length > 0) {
        actionsOpened = !actionsOpened;
        applyState();
      } else {
        setOpened(true);
      }
    }
  };

  const onPointerDown = (event: Event) => {
    if (actionsOpened && !event.composedPath().includes(host)) {
      actionsOpened = false;
      applyState();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) {
      return;
    }
    if (actionsOpened) {
      actionsOpened = false;
      applyState();
      root.querySelector<HTMLButtonElement>('.button')?.focus();
    } else if (opened) {
      setOpened(false);
    }
  };

  const onMessage = (event: MessageEvent) => {
    const expected = originOf(current.url);
    if (!expected || event.origin !== expected || event.source !== frame?.contentWindow) {
      return;
    }
    const data = event.data as { source?: string; type?: string; [key: string]: unknown };
    if (!data || data.source !== MESSAGE_SOURCE) {
      return;
    }
    if (data.type === 'close') {
      setOpened(false);
    } else if (data.type === 'unread') {
      api.unread(Number(data.count) || 0);
    } else if (data.type === 'notify') {
      api.notify({
        text: String(data.text ?? data.content ?? ''),
        title: typeof data.title === 'string' ? data.title : undefined,
        avatar: typeof data.avatar === 'string' ? data.avatar : undefined,
        id: typeof data.id === 'string' ? data.id : undefined,
      });
    } else if (data.type === 'ready') {
      emit('ready', data);
    }
    emit('message', data);
  };

  const onResize = () => {
    applyVars();
    applyState();
  };

  let openTimer: ReturnType<typeof setTimeout> | undefined;

  const startTimer = () => {
    clearTimeout(openTimer);
    if (!current.openAfter || (narrow() && !current.openAfterOnMobile)) {
      return;
    }
    if (current.remember && readDismissed(current.url)) {
      return;
    }
    openTimer = later(() => {
      if (!opened && !destroyed && !touched && allowedHere()) {
        setOpened(true);
      }
    }, current.openAfter);
  };

  const send = (type: string, data: Record<string, unknown> = {}) => {
    const target = originOf(current.url);
    if (target) {
      frame?.contentWindow?.postMessage({ source: 'ai-kit-widget', type, ...data }, target);
    }
  };

  const api: ChatWidget = {
    open: () => setOpened(true),
    close: () => setOpened(false),
    toggle: (next) => setOpened(next ?? !opened),
    notify: (notification) => {
      const input = typeof notification === 'string' ? { text: notification } : notification;
      const data = { ...input, text: input.text ?? input.content ?? '' };
      if (data.id && seenNotifications.has(data.id)) {
        return { hide: clearTeaser };
      }
      if (data.id) {
        seenNotifications.add(data.id);
      }
      if (opened || !current.notifications) {
        return { hide: () => {} };
      }
      const element = showTeaser(data);
      unreadCount += 1;
      applyState();
      const timeout = data.timeout === false ? 0 : (data.timeout ?? current.notificationTimeout);
      if (timeout > 0) {
        later(() => dropTeaser(element), timeout);
      }
      return { hide: () => dropTeaser(element) };
    },
    hide: () => {
      hidden = true;
      applyVars();
    },
    show: () => {
      hidden = false;
      applyVars();
    },
    navigate: (url) => {
      api.setOptions({ url });
      setOpened(true);
    },
    send: (type, data) => send(type, data),
    options: {},
    clearNotifications: () => clearTeaser(),
    unread: (count) => {
      unreadCount = Math.max(0, Math.trunc(count));
      applyState();
    },
    setOptions: (next) => {
      const before = current;
      current = resolveOptions(next, current);
      if (frame && current.url !== before.url) {
        frame.remove();
        frame = null;
        if (opened) {
          mountFrame();
        }
      }
      if (!allowedHere() && (opened || actionsOpened)) {
        opened = false;
        actionsOpened = false;
      }
      render();
      if (current.openAfter !== before.openAfter && !opened && !touched) {
        startTimer();
      }
    },
    on: (event, listener) => {
      const set = listeners.get(event) ?? new Set();
      set.add(listener);
      listeners.set(event, set);
      return () => set.delete(listener);
    },
    destroy: () => {
      destroyed = true;
      timers.forEach(clearTimeout);
      timers.clear();
      shadow.removeEventListener('click', onClick);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', onResize);
      host.remove();
      listeners.clear();
    },
  };

  api.options = new Proxy({} as ChatWidgetOptions, {
    get: (_target, key: string) => (current as Record<string, unknown>)[key],
    set: (_target, key: string, value: unknown) => {
      api.setOptions({ [key]: value } as ChatWidgetOptions);
      return true;
    },
    has: (_target, key: string) => key in current,
    ownKeys: () => Reflect.ownKeys(current),
    getOwnPropertyDescriptor: (_target, key: string) => ({
      value: (current as Record<string, unknown>)[key],
      enumerable: true,
      configurable: true,
    }),
  });

  render();
  shadow.addEventListener('click', onClick);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('message', onMessage);
  window.addEventListener('resize', onResize);
  (document.body ?? document.documentElement).append(host);
  startTimer();

  return api;
}

export { DEFAULT_LABELS };
