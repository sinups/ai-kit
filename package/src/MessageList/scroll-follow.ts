export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export const STICK_THRESHOLD = 80;

export function isNearBottom(metrics: ScrollMetrics, threshold = STICK_THRESHOLD): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight < threshold;
}

/**
 * Whether the list keeps following the bottom after a scroll event. Being near the bottom always
 * sticks, because content that shrinks makes the browser clamp `scrollTop` without the user scrolling.
 */
export function getStickToBottom(
  wasSticky: boolean,
  previousScrollTop: number,
  metrics: ScrollMetrics,
  threshold = STICK_THRESHOLD
): boolean {
  if (isNearBottom(metrics, threshold)) {
    return true;
  }
  if (metrics.scrollTop < previousScrollTop) {
    return false;
  }
  return wasSticky && metrics.scrollTop === previousScrollTop;
}

export type TurnBounds = {
  /** Turn key */
  key: string;
  /** Top of the turn relative to the scroll container viewport */
  top: number;
  /** Bottom of the turn relative to the scroll container viewport */
  bottom: number;
  /** Bottom of the user prompt of the turn, `null` when the turn has no prompt */
  promptBottom: number | null;
};

/** Turn whose prompt has scrolled above the viewport while its answer still fills the top of it */
export function findStickyPromptTurn(turns: TurnBounds[], offset = 0): string | null {
  for (const turn of turns) {
    if (turn.promptBottom === null) {
      continue;
    }
    if (turn.top < offset && turn.bottom > offset && turn.promptBottom < offset) {
      return turn.key;
    }
  }
  return null;
}

/** Number of messages in `next` whose ids were not in `previous` */
export function countNewMessages(previousIds: ReadonlySet<string>, nextIds: string[]): number {
  return nextIds.reduce((count, id) => (previousIds.has(id) ? count : count + 1), 0);
}
