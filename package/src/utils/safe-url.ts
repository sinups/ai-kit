export function isSafeHttpUrl(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

const BLOCKED_LINK_SCHEMES = ['javascript', 'vbscript', 'data', 'blob', 'file'];

function withoutControls(url: string): string {
  return Array.from(url)
    .filter((char) => char.charCodeAt(0) > 0x20)
    .join('');
}

/** Scheme of a URL as a browser reads it, lower case; `null` for a relative URL */
export function readUrlScheme(url: string): string | null {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(withoutControls(url));
  return match ? match[1].toLowerCase() : null;
}

/** Whether a link may be rendered: anything but `javascript:`, `vbscript:`, `data:`, `blob:` and `file:` */
export function isSafeLinkUrl(url: string): boolean {
  const scheme = readUrlScheme(url);
  return scheme === null || !BLOCKED_LINK_SCHEMES.includes(scheme);
}

/** Whether an address may reach `src` or a download link: relative, `http(s)`, or `data:` image, audio or video */
export function isSafeMediaUrl(url: string): boolean {
  const scheme = readUrlScheme(url);
  if (scheme === 'data') {
    return /^data:(image|audio|video)\/[\w.+-]+[;,]/i.test(withoutControls(url));
  }
  return scheme === null || scheme === 'http' || scheme === 'https';
}
