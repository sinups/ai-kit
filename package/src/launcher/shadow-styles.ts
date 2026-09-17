export const SHADOW_ROOT_CLASS = 'ae-shadow-root';

/** Rewrites document-level selectors so a stylesheet written for the page applies inside a shadow root container */
export function scopeCssToShadowRoot(css: string, rootClass = SHADOW_ROOT_CLASS): string {
  return css
    .replace(/:root\b/g, `.${rootClass}`)
    .replace(/(^|[\s,{}])html\b(?=[\s,{[:.])/g, `$1.${rootClass}`)
    .replace(/(^|[\s,{}])body\b(?=[\s,{[:.])/g, `$1.${rootClass}`);
}

/** Collects inline `<style>` text and stylesheet URLs from a document head */
export function collectDocumentStyles(doc: Document): { texts: string[]; urls: string[] } {
  const texts: string[] = [];
  const urls: string[] = [];
  doc.head.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
    if (node instanceof HTMLStyleElement) {
      texts.push(node.textContent ?? '');
    } else if (node instanceof HTMLLinkElement && node.href) {
      urls.push(node.href);
    }
  });
  return { texts, urls };
}
