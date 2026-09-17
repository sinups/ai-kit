export type CompletionToken = {
  trigger: string;
  query: string;
  start: number;
  end: number;
};

function isLineStart(text: string, index: number): boolean {
  return index === 0 || text[index - 1] === '\n';
}

export function findCompletionToken(
  text: string,
  caret: number,
  triggers: string[]
): CompletionToken | null {
  if (caret < 0 || caret > text.length || triggers.length === 0) {
    return null;
  }

  let start = caret;
  while (start > 0 && !/\s/.test(text[start - 1])) {
    start -= 1;
  }

  const word = text.slice(start, caret);
  const trigger = [...triggers]
    .filter((candidate) => candidate.length > 0 && word.startsWith(candidate))
    .sort((a, b) => b.length - a.length)[0];

  if (!trigger) {
    return null;
  }
  if (trigger === '/' && !isLineStart(text, start)) {
    return null;
  }

  let end = caret;
  while (end < text.length && !/\s/.test(text[end])) {
    end += 1;
  }

  return { trigger, query: word.slice(trigger.length), start, end };
}

export function applyCompletion(
  text: string,
  token: CompletionToken,
  value: string
): { text: string; caret: number } {
  const insertion = `${token.trigger}${value} `;
  const rest = text.slice(token.end).replace(/^ /, '');
  return {
    text: `${text.slice(0, token.start)}${insertion}${rest}`,
    caret: token.start + insertion.length,
  };
}
