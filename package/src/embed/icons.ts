const svg = (paths: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const BUILT_IN_ICONS: Record<string, string> = {
  chat: svg('<path d="M20 15a2 2 0 0 1-2 2H8l-4 3V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/>'),
  circle: svg('<circle cx="12" cy="12" r="8"/>'),
  dots: svg(
    '<circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/>'
  ),
  send: svg('<path d="M21 3 3 10.5l7 3 3 7z"/><path d="m21 3-11 11"/>'),
  close: svg('<path d="m6 6 12 12"/><path d="m18 6-12 12"/>'),
};

/** A built-in icon name, inline SVG markup or an image URL */
export function renderIcon(icon: string): string {
  if (BUILT_IN_ICONS[icon]) {
    return BUILT_IN_ICONS[icon];
  }
  if (icon.trim().startsWith('<')) {
    return icon;
  }
  return `<img src="${escapeAttribute(icon)}" alt="" />`;
}

export function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Bold, code and links of a notification text, on top of escaped text so nothing else can be injected */
export function inlineMarkdown(text: string): string {
  return escapeText(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_match, label: string, href: string) => {
      return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
