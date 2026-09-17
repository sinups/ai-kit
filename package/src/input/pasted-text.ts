export interface PasteCollapseThreshold {
  /** Pastes with at least this many characters collapse, `10000` by default */
  chars?: number;
  /** Pastes with at least this many lines collapse, `50` by default */
  lines?: number;
}

export interface PastedText {
  /** Sequence number shown in the pill, starts at 1 */
  id: number;
  /** Full pasted text */
  text: string;
  /** Number of lines in `text` */
  lines: number;
}

export const DEFAULT_PASTE_COLLAPSE_THRESHOLD: Required<PasteCollapseThreshold> = {
  chars: 10_000,
  lines: 50,
};

export function countLines(text: string): number {
  if (!text) {
    return 0;
  }
  return text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').length;
}

export function shouldCollapsePaste(
  text: string,
  threshold: PasteCollapseThreshold | false | undefined
): boolean {
  if (threshold === false) {
    return false;
  }
  const { chars, lines } = { ...DEFAULT_PASTE_COLLAPSE_THRESHOLD, ...threshold };
  return text.length >= chars || countLines(text) >= lines;
}

export const DEFAULT_PASTE_LABEL = 'Pasted text #{id}';

/** Token kept in the field for a collapsed paste, `label` is the chip name with `{id}` */
export function getPastePlaceholder(id: number, label: string = DEFAULT_PASTE_LABEL): string {
  return `[${label.replace('{id}', String(id))}]`;
}

/** Inserts the placeholder of `paste` in place of the selection and returns the new text and caret */
export function insertPastePlaceholder(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  id: number,
  label?: string
): { text: string; caret: number } {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));
  const placeholder = getPastePlaceholder(id, label);
  return {
    text: value.slice(0, start) + placeholder + value.slice(end),
    caret: start + placeholder.length,
  };
}

/** Replaces placeholders with the pasted text; placeholders of unknown pastes stay as typed */
export function expandPastedText(
  value: string,
  pastes: readonly PastedText[],
  label?: string
): string {
  let result = value;
  for (const paste of pastes) {
    result = result.split(getPastePlaceholder(paste.id, label)).join(paste.text);
  }
  return result;
}

/** Pastes whose placeholder is still present in `value` */
export function prunePastes(
  value: string,
  pastes: readonly PastedText[],
  label?: string
): PastedText[] {
  const kept = pastes.filter((paste) => value.includes(getPastePlaceholder(paste.id, label)));
  return kept.length === pastes.length ? (pastes as PastedText[]) : kept;
}

export function removePastePlaceholder(value: string, id: number, label?: string): string {
  return value.split(getPastePlaceholder(id, label)).join('');
}

/** `Pasted text #1 · 240 lines`, `{id}` and `{lines}` are replaced */
export function formatPasteLabel(paste: PastedText, template: string): string {
  return template.replace('{id}', String(paste.id)).replace('{lines}', String(paste.lines));
}
