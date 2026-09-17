require('@testing-library/jest-dom');
const { configure } = require('@testing-library/react');

// Layouts measure their container before rendering the final tree; on shared CI runners that first measure can take longer than the default 1s.
configure({ asyncUtilTimeout: 5000 });

// jsdom cannot parse modern CSS (container queries, light-dark, @layer) that Mantine and the kit inject at runtime.
const consoleError = console.error;
console.error = (...args) => {
  const [first] = args;
  const message = first instanceof Error ? first.message : String(first);
  if (message.includes('Could not parse CSS stylesheet')) {
    return;
  }
  consoleError(...args);
};

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
