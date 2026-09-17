import {
  countNewMessages,
  findStickyPromptTurn,
  getStickToBottom,
  isNearBottom,
} from './scroll-follow';

const metrics = (scrollTop: number, scrollHeight = 2000, clientHeight = 600) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

describe('scroll-follow', () => {
  it('detects the bottom within the threshold', () => {
    expect(isNearBottom(metrics(1400))).toBe(true);
    expect(isNearBottom(metrics(1330))).toBe(true);
    expect(isNearBottom(metrics(1300))).toBe(false);
  });

  it('keeps sticking when a collapsing block clamps scrollTop at the bottom', () => {
    expect(getStickToBottom(true, 1900, metrics(1400))).toBe(true);
  });

  it('stops sticking when the user scrolls up and resumes at the bottom', () => {
    expect(getStickToBottom(true, 1400, metrics(900))).toBe(false);
    expect(getStickToBottom(false, 900, metrics(1000))).toBe(false);
    expect(getStickToBottom(false, 1000, metrics(1400))).toBe(true);
  });

  it('finds the turn whose prompt scrolled out while its answer is on screen', () => {
    const turns = [
      { key: 'a', top: -900, bottom: -100, promptBottom: -850 },
      { key: 'b', top: -400, bottom: 500, promptBottom: -350 },
      { key: 'c', top: 500, bottom: 900, promptBottom: 540 },
    ];
    expect(findStickyPromptTurn(turns)).toBe('b');
    expect(findStickyPromptTurn([{ ...turns[1], promptBottom: 20 }])).toBeNull();
    expect(findStickyPromptTurn([{ ...turns[1], promptBottom: null }])).toBeNull();
  });

  it('counts messages that were not seen before', () => {
    expect(countNewMessages(new Set(['u1', 'a1']), ['u1', 'a1', 'u2', 'a2'])).toBe(2);
  });
});
