export interface PromptHistoryState {
  /** Index of the shown history entry, `null` while editing the draft */
  index: number | null;
  /** Text that was in the field before browsing started */
  draft: string;
}

export const INITIAL_PROMPT_HISTORY_STATE: PromptHistoryState = { index: null, draft: '' };

export type PromptHistoryDirection = 'older' | 'newer';

/**
 * Moves through `history` (oldest first, newest last).
 * Returns `null` when there is nowhere to go, the field then keeps its default arrow behavior.
 */
export function navigatePromptHistory(
  history: readonly string[],
  state: PromptHistoryState,
  direction: PromptHistoryDirection,
  currentValue: string
): { state: PromptHistoryState; value: string } | null {
  if (history.length === 0) {
    return null;
  }
  if (direction === 'older') {
    if (state.index === null) {
      const index = history.length - 1;
      return { state: { index, draft: currentValue }, value: history[index] };
    }
    if (state.index <= 0) {
      return null;
    }
    const index = state.index - 1;
    return { state: { ...state, index }, value: history[index] };
  }
  if (state.index === null) {
    return null;
  }
  if (state.index >= history.length - 1) {
    return { state: { index: null, draft: '' }, value: state.draft };
  }
  const index = state.index + 1;
  return { state: { ...state, index }, value: history[index] };
}

/** Arrow up browses history in an empty field or with the caret at the very start */
export function canBrowseOlder(
  value: string,
  selectionStart: number,
  selectionEnd: number
): boolean {
  return value.length === 0 || (selectionStart === 0 && selectionEnd === 0);
}

/** Arrow down browses back while the caret is on the last line and nothing is selected */
export function canBrowseNewer(
  value: string,
  selectionStart: number,
  selectionEnd: number
): boolean {
  return selectionStart === selectionEnd && !value.slice(selectionEnd).includes('\n');
}

/** Unique prompts, newest first, for the search dialog */
export function getSearchablePrompts(history: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (let index = history.length - 1; index >= 0; index--) {
    const prompt = history[index].trim();
    if (prompt && !seen.has(prompt)) {
      seen.add(prompt);
      result.push(history[index]);
    }
  }
  return result;
}
