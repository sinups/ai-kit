export const ERROR_MESSAGE_MAX_CHARS = 600;
export const ERROR_MESSAGE_MAX_LINES = 6;

export interface TruncatedErrorMessage {
  text: string;
  truncated: boolean;
}

/** Shortens a long error to its first lines or characters, cutting at a word boundary when one is close */
export function truncateErrorMessage(
  message: string,
  maxChars: number = ERROR_MESSAGE_MAX_CHARS,
  maxLines: number = ERROR_MESSAGE_MAX_LINES
): TruncatedErrorMessage {
  const lines = message.split('\n');
  let text = lines.length > maxLines ? lines.slice(0, maxLines).join('\n') : message;
  if (text.length > maxChars) {
    const cut = text.slice(0, maxChars);
    const boundary = cut.search(/\s\S*$/);
    text = boundary > maxChars * 0.8 ? cut.slice(0, boundary) : cut;
  }
  if (text === message) {
    return { text, truncated: false };
  }
  return { text: `${text.replace(/\s+$/, '')}…`, truncated: true };
}
