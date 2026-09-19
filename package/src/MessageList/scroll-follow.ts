export type ScrollMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
};

export const STICK_THRESHOLD = 80;

export function isNearBottom(metrics: ScrollMetrics, threshold = STICK_THRESHOLD): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight < threshold;
}

/** Viewport position plus whether the list is currently pinned to the bottom */
export type FollowState = ScrollMetrics & { following: boolean };

export function createFollowState(metrics: ScrollMetrics, following: boolean): FollowState {
  return { ...metrics, following };
}

export function readMetrics(element: ScrollMetrics): ScrollMetrics {
  return {
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  };
}

function atBottom(metrics: ScrollMetrics, threshold: number): boolean {
  return metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop <= threshold;
}

/**
 * Following after a scroll event. The state is positional: it compares the new position against the
 * previous maximum, so growth that arrives with the same `scrollTop` keeps the list pinned while a
 * shrink, which the browser resolves by clamping `scrollTop`, never attaches it.
 */
export function followAfterScroll(
  state: FollowState,
  metrics: ScrollMetrics,
  threshold = STICK_THRESHOLD
): FollowState {
  if (metrics.scrollHeight < state.scrollHeight) {
    return { ...metrics, following: state.following };
  }
  if (metrics.scrollHeight > state.scrollHeight) {
    const wasAtBottom = atBottom(state, threshold);
    const movedUp = metrics.scrollTop < state.scrollTop;
    return { ...metrics, following: wasAtBottom && !movedUp };
  }
  if (atBottom(metrics, threshold)) {
    return { ...metrics, following: true };
  }
  if (metrics.scrollTop < state.scrollTop) {
    return { ...metrics, following: false };
  }
  return { ...metrics, following: state.following };
}

/**
 * Following in `prompt-top-hold`: only a scroll by the user attaches the list, so growth of the
 * answer, scroll anchoring and scrolls of the kit itself can detach it but never attach it.
 */
export function holdAfterScroll(
  previous: FollowState,
  next: FollowState,
  byUser: boolean
): FollowState {
  return byUser || previous.following || !next.following ? next : { ...next, following: false };
}

/** Whether part of the content lies below the viewport */
export function hasContentBelow(metrics: ScrollMetrics, threshold = STICK_THRESHOLD): boolean {
  return !isNearBottom(metrics, threshold);
}

/**
 * Following after the content box resized. `pin` is only ever true for growth: a tool card that
 * collapses shortens the content, and scrolling to the new bottom there reads as a jump.
 */
export function followAfterResize(
  state: FollowState,
  metrics: ScrollMetrics
): { state: FollowState; pin: boolean } {
  const pin = state.following && metrics.scrollHeight > state.scrollHeight;
  return { state: { ...metrics, following: state.following }, pin };
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

/**
 * Seen ids after the list changed. A message that took the place of a seen one whose id is gone —
 * an optimistic id replaced by the saved one, a placeholder reply by the stored answer — is the
 * same message, so it stays seen instead of counting as new.
 */
export function carrySeenIds(
  seen: ReadonlySet<string>,
  previousIds: string[],
  nextIds: string[]
): Set<string> {
  const carried = new Set(seen);
  const present = new Set(nextIds);
  nextIds.forEach((id, index) => {
    const before = previousIds[index];
    if (
      !seen.has(id) &&
      before !== undefined &&
      before !== id &&
      seen.has(before) &&
      !present.has(before)
    ) {
      carried.add(id);
    }
  });
  return carried;
}

/** Number of messages in `next` whose ids were not in `previous` */
export function countNewMessages(previousIds: ReadonlySet<string>, nextIds: string[]): number {
  return nextIds.reduce((count, id) => (previousIds.has(id) ? count : count + 1), 0);
}
