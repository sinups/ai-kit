export function setElementWidth(width: number, height = 600): () => void {
  const original = window.ResizeObserver;

  class FixedSizeObserver {
    private readonly callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe(target: Element) {
      const size = [{ inlineSize: width, blockSize: height }];
      const entry = {
        target,
        borderBoxSize: size,
        contentBoxSize: size,
        devicePixelContentBoxSize: size,
        contentRect: { x: 0, y: 0, top: 0, left: 0, width, height, bottom: height, right: width },
      } as unknown as ResizeObserverEntry;
      this.callback([entry], this as unknown as ResizeObserver);
    }

    unobserve() {}

    disconnect() {}
  }

  window.ResizeObserver = FixedSizeObserver as unknown as typeof ResizeObserver;
  return () => {
    window.ResizeObserver = original;
  };
}
