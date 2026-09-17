import {
  canBrowseNewer,
  canBrowseOlder,
  getSearchablePrompts,
  INITIAL_PROMPT_HISTORY_STATE,
  navigatePromptHistory,
} from './prompt-history';

const HISTORY = ['first', 'second', 'third'];

describe('input/prompt-history', () => {
  it('browses older entries and back to the draft', () => {
    const up1 = navigatePromptHistory(HISTORY, INITIAL_PROMPT_HISTORY_STATE, 'older', 'draft')!;
    expect(up1.value).toBe('third');
    const up2 = navigatePromptHistory(HISTORY, up1.state, 'older', up1.value)!;
    const up3 = navigatePromptHistory(HISTORY, up2.state, 'older', up2.value)!;
    expect(up3.value).toBe('first');
    expect(navigatePromptHistory(HISTORY, up3.state, 'older', up3.value)).toBeNull();

    const down1 = navigatePromptHistory(HISTORY, up3.state, 'newer', up3.value)!;
    expect(down1.value).toBe('second');
    const down2 = navigatePromptHistory(HISTORY, down1.state, 'newer', down1.value)!;
    const down3 = navigatePromptHistory(HISTORY, down2.state, 'newer', down2.value)!;
    expect(down3.value).toBe('draft');
    expect(down3.state.index).toBeNull();
    expect(navigatePromptHistory(HISTORY, down3.state, 'newer', 'draft')).toBeNull();
    expect(navigatePromptHistory([], INITIAL_PROMPT_HISTORY_STATE, 'older', '')).toBeNull();
  });

  it('decides when arrows browse history', () => {
    expect(canBrowseOlder('', 0, 0)).toBe(true);
    expect(canBrowseOlder('text', 0, 0)).toBe(true);
    expect(canBrowseOlder('text', 2, 2)).toBe(false);
    expect(canBrowseOlder('text', 0, 4)).toBe(false);
    expect(canBrowseNewer('one\ntwo', 5, 5)).toBe(true);
    expect(canBrowseNewer('one\ntwo', 1, 1)).toBe(false);
    expect(canBrowseNewer('one', 0, 3)).toBe(false);
  });

  it('lists unique prompts newest first', () => {
    expect(getSearchablePrompts(['a', 'b', 'a', ' ', 'c'])).toEqual(['c', 'a', 'b']);
  });
});
