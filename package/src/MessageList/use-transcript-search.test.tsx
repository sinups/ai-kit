import { act, renderHook } from '@testing-library/react';
import { useTranscriptSearch } from './use-transcript-search';

class FakeHighlight {
  ranges: Range[];
  constructor(...ranges: Range[]) {
    this.ranges = ranges;
  }
}

function setup(text: string) {
  const root = document.createElement('div');
  root.textContent = text;
  const scroller = document.createElement('div');
  scroller.appendChild(root);
  document.body.appendChild(scroller);
  return {
    rootRef: { current: root },
    scrollRef: { current: scroller },
    root,
    scroller,
  };
}

describe('MessageList/useTranscriptSearch', () => {
  const registry = new Map<string, unknown>();
  const globals = globalThis as { CSS?: unknown; Highlight?: unknown };

  beforeEach(() => {
    registry.clear();
    globals.CSS = { highlights: registry };
    globals.Highlight = FakeHighlight;
    Range.prototype.getBoundingClientRect = () => ({ top: 900, bottom: 920 }) as DOMRect;
  });

  afterEach(() => {
    delete globals.CSS;
    delete globals.Highlight;
    document.body.innerHTML = '';
  });

  it('leaves the highlights of another open search alone', () => {
    const open = setup('alpha beta');
    const closed = setup('alpha');
    const searching = renderHook(() =>
      useTranscriptSearch({ enabled: true, contentKey: 1, ...open })
    );
    act(() => searching.result.current.setQuery('alpha'));
    expect(registry.has('ae-search-match')).toBe(true);

    const idle = renderHook(
      ({ contentKey }) => useTranscriptSearch({ enabled: false, contentKey, ...closed }),
      { initialProps: { contentKey: 1 } }
    );
    idle.rerender({ contentKey: 2 });
    idle.unmount();
    expect(registry.has('ae-search-match')).toBe(true);
    expect(registry.has('ae-search-active')).toBe(true);
  });

  it('scrolls to the active match on navigation but not when content streams in', () => {
    const { root, scroller, ...refs } = setup('token one');
    scroller.getBoundingClientRect = () => ({ top: 0, bottom: 300, height: 300 }) as DOMRect;
    const { result, rerender } = renderHook(
      ({ contentKey }) => useTranscriptSearch({ enabled: true, contentKey, ...refs }),
      { initialProps: { contentKey: 1 } }
    );
    act(() => result.current.setQuery('token'));
    expect(scroller.scrollTop).toBeGreaterThan(0);

    scroller.scrollTop = 0;
    root.textContent = 'token one token two';
    rerender({ contentKey: 2 });
    expect(result.current.total).toBe(2);
    expect(scroller.scrollTop).toBe(0);
    expect((registry.get('ae-search-active') as FakeHighlight).ranges[0].startContainer).toBe(
      root.firstChild
    );

    act(() => result.current.next());
    expect(scroller.scrollTop).toBeGreaterThan(0);
  });
  it('adds the highlight styles once, inside a shadow root when the transcript is in one', () => {
    const first = setup('alpha');
    const second = setup('alpha');
    for (const refs of [first, second]) {
      const { result } = renderHook(() =>
        useTranscriptSearch({ enabled: true, contentKey: 1, ...refs })
      );
      act(() => result.current.setQuery('alpha'));
    }
    expect(document.head.querySelectorAll('style[data-ai-kit-search-highlights]')).toHaveLength(1);

    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const root = document.createElement('div');
    root.textContent = 'alpha';
    shadow.appendChild(root);
    const shadowRefs = { rootRef: { current: root }, scrollRef: { current: root } };
    const { result } = renderHook(() =>
      useTranscriptSearch({ enabled: true, contentKey: 1, ...shadowRefs })
    );
    act(() => result.current.setQuery('alpha'));
    expect(shadow.querySelectorAll('style[data-ai-kit-search-highlights]')).toHaveLength(1);
  });
});
