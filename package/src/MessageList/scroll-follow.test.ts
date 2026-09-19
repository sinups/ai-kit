import {
  countNewMessages,
  createFollowState,
  findStickyPromptTurn,
  followAfterResize,
  followAfterScroll,
  hasContentBelow,
  holdAfterScroll,
  isNearBottom,
} from './scroll-follow';

const metrics = (scrollTop: number, scrollHeight = 2000, clientHeight = 600) => ({
  scrollTop,
  scrollHeight,
  clientHeight,
});

const following = (scrollTop: number, scrollHeight = 2000) =>
  createFollowState(metrics(scrollTop, scrollHeight), true);

const detached = (scrollTop: number, scrollHeight = 2000) =>
  createFollowState(metrics(scrollTop, scrollHeight), false);

describe('MessageList/scroll-follow', () => {
  it('detects the bottom within the threshold', () => {
    expect(isNearBottom(metrics(1400))).toBe(true);
    expect(isNearBottom(metrics(1330))).toBe(true);
    expect(isNearBottom(metrics(1300))).toBe(false);
  });

  it('keeps following when content grows under a viewport that sat at the bottom', () => {
    expect(followAfterScroll(following(1400), metrics(1400, 2400)).following).toBe(true);
  });

  it('stops following when content grows while the viewport is up in the transcript', () => {
    expect(followAfterScroll(detached(400), metrics(400, 2400)).following).toBe(false);
    expect(followAfterScroll(following(400), metrics(400, 2400)).following).toBe(false);
  });

  it('does not attach when content shrinks and the browser clamps scrollTop', () => {
    expect(followAfterScroll(detached(1400), metrics(1400, 1600)).following).toBe(false);
    expect(followAfterScroll(following(1400), metrics(1000, 1600)).following).toBe(true);
  });

  it('detaches on an upward scroll and re-attaches at the bottom', () => {
    expect(followAfterScroll(following(1400), metrics(900)).following).toBe(false);
    expect(followAfterScroll(detached(900), metrics(800)).following).toBe(false);
    expect(followAfterScroll(detached(1000), metrics(1400)).following).toBe(true);
  });

  it('keeps a downward scroll that has not reached the bottom yet attached', () => {
    expect(followAfterScroll(following(400), metrics(900)).following).toBe(true);
    expect(followAfterScroll(detached(400), metrics(900)).following).toBe(false);
  });

  it('pins on growth only', () => {
    expect(followAfterResize(following(1400), metrics(1400, 2400)).pin).toBe(true);
    expect(followAfterResize(following(1400), metrics(1400, 1600)).pin).toBe(false);
    expect(followAfterResize(detached(400), metrics(400, 2400)).pin).toBe(false);
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

  it('attaches a held list only by a scroll of the user, and detaches it by anything', () => {
    const detached = createFollowState(
      { scrollTop: 800, scrollHeight: 1400, clientHeight: 600 },
      false
    );
    const atBottom = createFollowState(
      { scrollTop: 800, scrollHeight: 1400, clientHeight: 600 },
      true
    );
    expect(holdAfterScroll(detached, atBottom, false).following).toBe(false);
    expect(holdAfterScroll(detached, atBottom, true).following).toBe(true);
    expect(holdAfterScroll(atBottom, { ...detached, scrollTop: 400 }, false).following).toBe(false);
    expect(holdAfterScroll(atBottom, atBottom, false).following).toBe(true);
  });

  it('tells content below the viewport', () => {
    expect(hasContentBelow({ scrollTop: 800, scrollHeight: 1400, clientHeight: 600 })).toBe(false);
    expect(hasContentBelow({ scrollTop: 800, scrollHeight: 3000, clientHeight: 600 })).toBe(true);
  });
});
