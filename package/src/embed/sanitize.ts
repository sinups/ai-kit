const SAFE_SCHEMES = [
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
  'viber:',
  'skype:',
  'tg:',
  'whatsapp:',
];

const SAFE_TAGS = new Set([
  'svg',
  'g',
  'defs',
  'title',
  'desc',
  'path',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'rect',
  'text',
  'tspan',
  'use',
  'symbol',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'stop',
]);

/** Keeps only links a widget may open; anything else, `javascript:` included, is dropped */
export function safeHref(href: string | undefined): string | undefined {
  if (!href) {
    return undefined;
  }
  if (href.startsWith('/') || href.startsWith('#') || href.startsWith('?')) {
    return href;
  }
  try {
    return SAFE_SCHEMES.includes(new URL(href, window.location.href).protocol) ? href : undefined;
  } catch {
    return undefined;
  }
}

function scrub(node: Element): void {
  for (const child of Array.from(node.children)) {
    if (!SAFE_TAGS.has(child.tagName.toLowerCase())) {
      child.remove();
      continue;
    }
    for (const attribute of Array.from(child.attributes)) {
      const name = attribute.name.toLowerCase();
      const isLink = name === 'href' || name === 'xlink:href';
      if (name.startsWith('on') || (isLink && !safeHref(attribute.value))) {
        child.removeAttribute(attribute.name);
      }
    }
    scrub(child);
  }
}

/**
 * Icon markup that may come from a remote config: an image URL is checked as a link, and inline
 * SVG is parsed and rebuilt from a list of tags and attributes instead of patched with regular
 * expressions, so scripts, handlers and foreign elements cannot survive
 */
export function safeIcon(icon: string | undefined): string | undefined {
  if (!icon) {
    return undefined;
  }
  if (!icon.trim().startsWith('<')) {
    return safeHref(icon);
  }
  if (typeof DOMParser === 'undefined') {
    return undefined;
  }
  const parsed = new DOMParser().parseFromString(icon, 'image/svg+xml');
  const root = parsed.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') {
    return undefined;
  }
  scrub(root);
  for (const attribute of Array.from(root.attributes)) {
    if (attribute.name.toLowerCase().startsWith('on')) {
      root.removeAttribute(attribute.name);
    }
  }
  return root.outerHTML;
}

/** Drops a color the browser cannot parse, so a remote config cannot smuggle CSS through it */
export function safeColor(color: string | undefined): string | undefined {
  if (!color) {
    return undefined;
  }
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return color.includes(';') || color.includes('}') ? undefined : color;
  }
  return CSS.supports('background', color) ? color : undefined;
}
