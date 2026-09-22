import { BUILT_IN_ICONS } from './icons';
import { safeColor, safeHref, safeIcon } from './sanitize';

export type ChatWidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

export type ChatWidgetDevices = 'all' | 'mobile' | 'desktop';

export type ChatWidgetIconAnimation = 'none' | 'circle' | 'coin' | 'flip';

export type ChatWidgetSize = 'small' | 'medium' | 'large' | number;

export type WidgetCoordinate = 'top' | 'bottom' | 'left' | 'right' | number;

/** `[vertical, horizontal]`: a word picks the edge, a number is the distance from it, negative counts from the opposite edge */
export type WidgetLocation = [WidgetCoordinate, WidgetCoordinate];

export interface LegacyWidgetOptions {
  /** Address of the chat page, the same as `url` */
  shard?: string;
  /** `[vertical, horizontal]`, words or pixels; sets `position` and `offset` at once */
  location?: WidgetLocation;
  /** `[url, size]`, the image of the second face of the button */
  glyph?: [string, string];
  /** The same as `iconAnimation` */
  animation?: ChatWidgetIconAnimation;
  /** The same as `pulse` */
  pulsation?: boolean;
  /** The same as `openAfter` */
  start?: number;
  /** The same as `openAfterOnMobile` */
  startOnMobile?: boolean;
  /** The same as `devices` */
  device?: ChatWidgetDevices;
  /** The same as `mobileHeight` */
  mobileWindowHeight?: number;
  /** The same as `notificationTimeout` */
  timeout?: number;
  /** The same as `actions`, with `name` for the id and `tooltip` for the label */
  multiButton?: Array<{
    name: string;
    tooltip?: string;
    href?: string;
    icon?: string;
    color?: string;
    iconColor?: string;
    unread?: number;
    opensChat?: boolean;
  }>;
}

export interface ChatWidgetAction {
  /** Identity of the action, reported by the `action` event */
  id: string;
  /** Text of the tooltip and the accessible name */
  label: string;
  /** Inline SVG, an image URL or the name of a built-in icon */
  icon?: string;
  /** Opens the link instead of calling back */
  href?: string;
  /** Target of the link, for example `_blank` */
  target?: string;
  /** Background of the round button: any CSS background, a gradient included; the widget color by default */
  color?: string;
  /** Color of the icon on this button, white by default when `color` is set */
  iconColor?: string;
  /** Opens the chat panel */
  opensChat?: boolean;
  /** Count shown as a badge on the action */
  unread?: number;
}

export interface ChatWidgetLabels {
  open: string;
  close: string;
  actions: string;
  closeActions: string;
  panel: string;
  unread: string;
  dismissNotification: string;
}

const SIZES: Record<string, number> = { small: 48, medium: 60, large: 72 };

const ICON_ALIASES: Record<string, string> = { 'chat-icon': 'chat' };

/** Accepts the options of the original widget tag next to the ones of this package */
export function fromLegacy(options: ChatWidgetOptions & LegacyWidgetOptions): ChatWidgetOptions {
  const {
    shard,
    location,
    glyph,
    animation,
    pulsation,
    start,
    startOnMobile,
    device,
    mobileWindowHeight,
    timeout,
    multiButton,
    ...rest
  } = options;
  const placement = location ? fromLocation(location) : undefined;

  return withoutUndefined({
    ...rest,
    url: rest.url ?? shard,
    position: rest.position ?? placement?.position,
    offset: rest.offset ?? placement?.offset,
    avatar: rest.avatar ?? glyph?.[0],
    iconAnimation: rest.iconAnimation ?? animation,
    pulse: rest.pulse ?? pulsation,
    openAfter: rest.openAfter ?? start,
    openAfterOnMobile: rest.openAfterOnMobile ?? startOnMobile,
    devices: rest.devices ?? device,
    mobileHeight: rest.mobileHeight ?? mobileWindowHeight,
    notificationTimeout: rest.notificationTimeout ?? timeout,
    actions:
      rest.actions ??
      multiButton?.map((item) => ({
        id: item.name,
        label: item.tooltip ?? item.name,
        icon: item.icon,
        href: item.href,
        color: item.color,
        iconColor: item.iconColor,
        unread: item.unread,
        opensChat: item.opensChat ?? !item.href,
      })),
  });
}

function edgeOf(
  value: WidgetCoordinate,
  [start, end]: [string, string]
): { edge: string; distance?: number } {
  if (typeof value === 'number') {
    return value < 0 ? { edge: end, distance: -value } : { edge: start, distance: value };
  }
  return { edge: value === start ? start : end };
}

/** Turns `location` into the corner and the distances: words pick the edge, numbers also set how far from it */
export function fromLocation(location: WidgetLocation): {
  position: ChatWidgetPosition;
  offset?: { x: number; y: number };
} {
  const vertical = edgeOf(location[0], ['top', 'bottom']);
  const horizontal = edgeOf(location[1], ['left', 'right']);
  const position = `${vertical.edge}-${horizontal.edge}` as ChatWidgetPosition;
  return vertical.distance === undefined && horizontal.distance === undefined
    ? { position }
    : { position, offset: { x: horizontal.distance ?? 30, y: vertical.distance ?? 30 } };
}

function withoutUndefined(options: ChatWidgetOptions): ChatWidgetOptions {
  return Object.fromEntries(
    Object.entries(options).filter(([, value]) => value !== undefined)
  ) as ChatWidgetOptions;
}

export interface ChatWidgetOptions {
  /** Address of the chat page shown in the panel */
  url?: string;
  /** Address of a JSON file with the same options, fetched and merged over these ones */
  configUrl?: string;
  /** Identity of the widget in a configuration service, used with `configEndpoint` */
  appId?: string;
  /** Base address of the configuration service, `<endpoint>/<appId>.json` is fetched */
  configEndpoint?: string;
  /** Corner of the viewport, `bottom-right` by default */
  position?: ChatWidgetPosition;
  /** `[vertical, horizontal]` in words or pixels, a shorthand for `position` with `offset` */
  location?: WidgetLocation;
  /** Distance from the viewport edges in px */
  offset?: number | { x: number; y: number };
  /** Accent of the button and the actions */
  color?: string;
  /** `small`, `medium`, `large` or a diameter in px, `medium` by default */
  size?: ChatWidgetSize;
  /** `chat`, `circle`, `dots`, `send`, inline SVG or an image URL */
  icon?: string;
  /** Color of the icon on the button, picked from the background by default */
  iconColor?: string;
  /** Image URL for the second face of the button */
  avatar?: string;
  /** How the button alternates between the icon and the avatar while it is closed */
  iconAnimation?: ChatWidgetIconAnimation;
  /** Slow rings around the closed button */
  pulse?: boolean;
  /** Opens the panel after this many milliseconds, `0` keeps it closed */
  openAfter?: number;
  /** Whether the timer also opens the panel on a narrow screen, `false` by default */
  openAfterOnMobile?: boolean;
  /** Remembers that the visitor closed the widget and skips the timer next time */
  remember?: boolean;
  /** Shows the widget only on these devices */
  devices?: ChatWidgetDevices;
  /** Width in px below which the screen counts as narrow, `520` by default */
  mobileBreakpoint?: number;
  /** Panel size in px */
  panelWidth?: number;
  panelHeight?: number;
  /** Height of the panel on a narrow screen in percent, `100` by default */
  mobileHeight?: number;
  /** Title of the panel header, hides the header when empty */
  title?: string;
  /** Actions that fan out of the button */
  actions?: ChatWidgetAction[];
  /** Diameter of an action button in px, `48` by default */
  actionSize?: number;
  /** Space between the action buttons in px, `12` by default */
  actionGap?: number;
  /** Order the actions appear in, `sequence` by default */
  actionsMotion?: 'sequence' | 'together';
  /** Color scheme of the widget frame, `auto` by default */
  theme?: 'light' | 'dark' | 'auto';
  /** Stacking order, `2147483000` by default */
  zIndex?: number;
  /** Loads the chat page on the first open instead of on start, `true` by default */
  defer?: boolean;
  /** Shows the bubbles of `notify`, `true` by default */
  notifications?: boolean;
  /** Shows the unread count on the button, `true` by default */
  indicator?: boolean;
  /** Milliseconds a bubble lives when the call does not say otherwise, `12000` by default */
  notificationTimeout?: number;
  /** How many bubbles stay on screen at once, `3` by default */
  notificationLimit?: number;
  /** CSS added inside the shadow root of the widget */
  css?: string;
  /** Overrides of the default English labels */
  labels?: Partial<ChatWidgetLabels>;
}

export type ResolvedOptions = Required<
  Omit<
    ChatWidgetOptions,
    | 'offset'
    | 'labels'
    | 'actions'
    | 'url'
    | 'avatar'
    | 'title'
    | 'size'
    | 'configUrl'
    | 'appId'
    | 'configEndpoint'
  >
> & {
  size: number;
  url: string;
  avatar: string;
  title: string;
  offset: { x: number; y: number };
  labels: ChatWidgetLabels;
  actions: ChatWidgetAction[];
  ownActionSize?: number;
  ownActionGap?: number;
};

export const MAX_ACTIONS = 9;

export const DEFAULT_LABELS: ChatWidgetLabels = {
  open: 'Open chat',
  close: 'Close chat',
  actions: 'Show ways to get in touch',
  closeActions: 'Hide ways to get in touch',
  panel: 'Chat',
  unread: 'unread',
  dismissNotification: 'Dismiss',
};

const DEFAULTS = {
  url: '',
  position: 'bottom-right',
  color: '#2f6fed',
  size: 60,
  icon: 'chat',
  iconColor: '',
  avatar: '',
  iconAnimation: 'none',
  pulse: false,
  openAfter: 0,
  openAfterOnMobile: false,
  remember: true,
  devices: 'all',
  mobileBreakpoint: 520,
  panelWidth: 380,
  panelHeight: 640,
  mobileHeight: 100,
  title: '',
  actionSize: 0,
  actionGap: 0,
  actionsMotion: 'sequence',
  theme: 'auto',
  zIndex: 2147483000,
  defer: true,
  notifications: true,
  indicator: true,
  notificationTimeout: 12000,
  notificationLimit: 3,
  css: '',
} as const;

function resolveIcon(icon: string): string {
  const named = ICON_ALIASES[icon] ?? icon;
  return BUILT_IN_ICONS[named] ? named : (safeIcon(named) ?? 'chat');
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Fills in the defaults, keeps the numbers inside their limits and cuts the fan to `MAX_ACTIONS` */
export function resolveOptions(
  input: ChatWidgetOptions & LegacyWidgetOptions,
  previous?: ResolvedOptions
): ResolvedOptions {
  const options = fromLegacy(input);
  const base =
    previous ??
    ({
      ...DEFAULTS,
      offset: { x: 30, y: 30 },
      labels: DEFAULT_LABELS,
      actions: [],
    } as unknown as ResolvedOptions);
  const merged = { ...base, ...options } as ResolvedOptions;
  const offset =
    typeof options.offset === 'number'
      ? { x: options.offset, y: options.offset }
      : (options.offset ?? base.offset);
  const size = clamp(
    typeof merged.size === 'string' ? (SIZES[merged.size] ?? 60) : merged.size,
    40,
    96
  );
  const ownActionSize = options.actionSize ?? previous?.ownActionSize;
  const ownActionGap = options.actionGap ?? previous?.ownActionGap;
  const actionSize = ownActionSize ? clamp(ownActionSize, 36, 80) : size;

  return {
    ...merged,
    offset,
    size,
    actionSize,
    actionGap: ownActionGap ? clamp(ownActionGap, 0, 40) : Math.round(actionSize / 6),
    ownActionSize,
    ownActionGap,
    icon: resolveIcon(merged.icon),
    iconColor: safeColor(merged.iconColor) ?? '',
    avatar: safeHref(merged.avatar) ?? '',
    color: safeColor(merged.color) ?? '#2f6fed',
    mobileHeight: clamp(merged.mobileHeight, 40, 100),
    openAfter: Math.max(0, merged.openAfter),
    zIndex: Number.isFinite(merged.zIndex) ? merged.zIndex : 2147483000,
    mobileBreakpoint: clamp(merged.mobileBreakpoint, 0, 2000),
    notificationLimit: clamp(merged.notificationLimit, 1, 5),
    labels: { ...base.labels, ...options.labels },
    actions: (options.actions ?? base.actions).slice(0, MAX_ACTIONS).map((action) => ({
      ...action,
      href: safeHref(action.href),
      icon: safeIcon(action.icon),
      color: safeColor(action.color),
      iconColor: safeColor(action.iconColor),
    })),
  };
}

const NUMBER_OPTIONS = new Set([
  'size',
  'actionSize',
  'actionGap',
  'openAfter',
  'mobileBreakpoint',
  'mobileHeight',
  'panelWidth',
  'panelHeight',
  'zIndex',
  'notificationTimeout',
  'notificationLimit',
  'offset',
]);

const BOOLEAN_OPTIONS = new Set([
  'pulse',
  'openAfterOnMobile',
  'remember',
  'defer',
  'notifications',
  'indicator',
]);

const JSON_OPTIONS = new Set(['actions', 'multiButton', 'labels', 'location', 'offset']);

function parseValue(key: string, value: string): unknown {
  if (BOOLEAN_OPTIONS.has(key)) {
    return value !== 'false';
  }
  if (JSON_OPTIONS.has(key) && (value.startsWith('[') || value.startsWith('{'))) {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return undefined;
    }
  }
  if (NUMBER_OPTIONS.has(key)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return value;
}

/** Reads `data-*` attributes of a script tag as options, so a page can configure the widget without code */
export function optionsFromDataset(dataset: Record<string, string | undefined>): ChatWidgetOptions {
  const options: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(dataset)) {
    if (value === undefined || key === 'aiKitWidget') {
      continue;
    }
    const parsed = parseValue(key, value);
    if (parsed !== undefined) {
      options[key] = parsed;
    }
  }
  return options as ChatWidgetOptions;
}
