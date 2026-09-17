const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'button',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

export function getFirstFocusable(root: HTMLElement | null): HTMLElement | null {
  if (!root) {
    return null;
  }
  const candidates = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  for (const element of Array.from(candidates)) {
    if (!element.matches(':disabled') && element.getAttribute('aria-hidden') !== 'true') {
      return element;
    }
  }
  return null;
}
