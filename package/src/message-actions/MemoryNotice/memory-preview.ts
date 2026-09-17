export function memoryPreview(text: string): string {
  const line =
    text
      .trim()
      .split('\n')[0]
      ?.replace(/^\s*(?:#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+|\[[ xX]\]\s+)*/, '') ?? '';
  return line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(`+)(.*?)\1/g, '$2')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/(^|[^\w*])[*_]([^*_\s](?:.*?[^*_\s])?)[*_](?=[^\w*]|$)/g, '$1$2')
    .replace(/<[^>]+>/g, '')
    .trim();
}
