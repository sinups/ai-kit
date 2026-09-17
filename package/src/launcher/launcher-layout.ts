import { getFirstFocusable } from '../primitives/Wizard/wizard-focus';

export type ChatLauncherPosition = 'bottom-right' | 'bottom-left';

export type ChatLauncherOffset = number | { x: number; y: number };

export type ChatLauncherMode = 'compact' | 'tight' | 'fullscreen';

export const LAUNCHER_BUTTON_SIZE = 56;
export const LAUNCHER_TIGHT_OFFSET = 12;
export const LAUNCHER_MIN_PANEL_HEIGHT = 360;

export function resolveLauncherOffset(offset: ChatLauncherOffset): { x: number; y: number } {
  return typeof offset === 'number' ? { x: offset, y: offset } : offset;
}

export interface LauncherLayoutInput {
  /** Width of the box the launcher is placed in: the window, or the container without a portal */
  availableWidth: number;
  availableHeight: number;
  panelWidth: number;
  panelHeight: number;
  offset: ChatLauncherOffset;
  mobileFullScreen: boolean;
  /** Available width below which the panel always opens full screen */
  fullScreenBreakpoint: number;
}

export interface LauncherLayout {
  mode: ChatLauncherMode;
  offset: { x: number; y: number };
  panelWidth: number;
  panelHeight: number;
}

/** Panel mode and size for the available box; the open panel takes the place of the hidden button in its corner */
export function getLauncherLayout({
  availableWidth,
  availableHeight,
  panelWidth,
  panelHeight,
  offset,
  mobileFullScreen,
  fullScreenBreakpoint,
}: LauncherLayoutInput): LauncherLayout {
  const requested = resolveLauncherOffset(offset);
  const mode: ChatLauncherMode =
    panelWidth + 2 * requested.x > availableWidth ? 'tight' : 'compact';
  const applied =
    mode === 'tight'
      ? {
          x: Math.min(requested.x, LAUNCHER_TIGHT_OFFSET),
          y: Math.min(requested.y, LAUNCHER_TIGHT_OFFSET),
        }
      : requested;
  const width = Math.max(0, Math.min(panelWidth, availableWidth - 2 * applied.x));
  const height = Math.max(0, Math.min(panelHeight, availableHeight - 2 * applied.y));
  const doesNotFit =
    panelWidth + 2 * applied.x > availableWidth ||
    height < Math.min(panelHeight, LAUNCHER_MIN_PANEL_HEIGHT);

  if (mobileFullScreen && (availableWidth < fullScreenBreakpoint || doesNotFit)) {
    return {
      mode: 'fullscreen',
      offset: requested,
      panelWidth: availableWidth,
      panelHeight: availableHeight,
    };
  }
  return { mode, offset: applied, panelWidth: width, panelHeight: height };
}

/** CSS variables that place the button and the panel */
export function getLauncherVars(
  position: ChatLauncherPosition,
  layout: LauncherLayout
): Record<string, string> {
  return {
    '--launcher-offset-x': `${layout.offset.x}px`,
    '--launcher-offset-y': `${layout.offset.y}px`,
    '--launcher-panel-width': `${layout.panelWidth}px`,
    '--launcher-panel-height': `${layout.panelHeight}px`,
    '--launcher-button-size': `${LAUNCHER_BUTTON_SIZE}px`,
    '--launcher-origin': position === 'bottom-left' ? 'bottom left' : 'bottom right',
  };
}

/** Element to focus when the panel opens: an explicit autofocus target, then the composer, then the first focusable element, then the panel itself */
export function getLauncherFocusTarget(
  panel: HTMLElement | null,
  body: HTMLElement | null
): HTMLElement | null {
  if (!panel) {
    return null;
  }
  const scope = body ?? panel;
  return (
    scope.querySelector<HTMLElement>('[data-autofocus]:not(:disabled)') ??
    scope.querySelector<HTMLElement>('textarea:not(:disabled)') ??
    getFirstFocusable(scope) ??
    panel
  );
}

function isScrollContainer(element: HTMLElement): boolean {
  const { overflowY } = getComputedStyle(element);
  return overflowY === 'auto' || overflowY === 'scroll';
}

/** Outermost vertical scroll container inside the panel body, found breadth first so nested code blocks and cards are skipped */
export function findLauncherFeed(body: HTMLElement | null): HTMLElement | null {
  const queue = body ? Array.from(body.children) : [];
  while (queue.length > 0) {
    const element = queue.shift() as HTMLElement;
    if (isScrollContainer(element)) {
      return element;
    }
    queue.push(...Array.from(element.children));
  }
  return null;
}
