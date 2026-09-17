export type AnsiColor = 'dark' | 'red' | 'green' | 'yellow' | 'blue' | 'grape' | 'cyan' | 'gray';

export interface AnsiStyle {
  fg?: AnsiColor;
  bg?: AnsiColor;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export interface AnsiSegment extends AnsiStyle {
  text: string;
}

const PALETTE: AnsiColor[] = ['dark', 'red', 'green', 'yellow', 'blue', 'grape', 'cyan', 'gray'];

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

const ESCAPE = new RegExp(
  `${ESC}\\[([0-9;?]*)([A-Za-z])|${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)|${ESC}[@-Z\\\\-_]`,
  'g'
);

function paletteColor(index: number): AnsiColor | undefined {
  if (index >= 0 && index < 8) {
    return PALETTE[index];
  }
  if (index >= 8 && index < 16) {
    return PALETTE[index - 8];
  }
  return undefined;
}

function applySgr(style: AnsiStyle, params: string): AnsiStyle {
  const codes = params === '' ? [0] : params.split(';').map((code) => Number(code) || 0);
  const next: AnsiStyle = { ...style };
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    if (code === 0) {
      for (const key of Object.keys(next) as (keyof AnsiStyle)[]) {
        delete next[key];
      }
    } else if (code === 1) {
      next.bold = true;
    } else if (code === 2) {
      next.dim = true;
    } else if (code === 3) {
      next.italic = true;
    } else if (code === 4) {
      next.underline = true;
    } else if (code === 22) {
      delete next.bold;
      delete next.dim;
    } else if (code === 23) {
      delete next.italic;
    } else if (code === 24) {
      delete next.underline;
    } else if ((code >= 30 && code <= 37) || (code >= 90 && code <= 97)) {
      next.fg = PALETTE[code % 10];
    } else if (code === 39) {
      delete next.fg;
    } else if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
      next.bg = PALETTE[code % 10];
    } else if (code === 49) {
      delete next.bg;
    } else if (code === 38 || code === 48) {
      const key = code === 38 ? 'fg' : 'bg';
      if (codes[i + 1] === 5) {
        const color = paletteColor(codes[i + 2]);
        if (color) {
          next[key] = color;
        } else {
          delete next[key];
        }
        i += 2;
      } else if (codes[i + 1] === 2) {
        delete next[key];
        i += 4;
      }
    }
  }
  return next;
}

function sameStyle(a: AnsiStyle, b: AnsiStyle) {
  return (
    a.fg === b.fg &&
    a.bg === b.bg &&
    !!a.bold === !!b.bold &&
    !!a.dim === !!b.dim &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline
  );
}

/** Keeps what a terminal would show after carriage returns: text after the last `\r` of each line */
function resolveCarriageReturns(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => {
      const trimmed = line.endsWith('\r') ? line.slice(0, -1) : line;
      const index = trimmed.lastIndexOf('\r');
      return index === -1 ? trimmed : trimmed.slice(index + 1);
    })
    .join('\n');
}

/** Splits terminal output into lines of styled segments; SGR colors map to Mantine colors, other escapes are dropped */
export function parseAnsiLines(text: string): AnsiSegment[][] {
  const lines: AnsiSegment[][] = [[]];
  let style: AnsiStyle = {};

  const pushText = (chunk: string) => {
    const parts = chunk.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([]);
      }
      if (!part) {
        return;
      }
      const line = lines[lines.length - 1];
      const last = line[line.length - 1];
      if (last && sameStyle(last, style)) {
        last.text += part;
      } else {
        line.push({ ...style, text: part });
      }
    });
  };

  const source = resolveCarriageReturns(text);
  let cursor = 0;
  for (const match of source.matchAll(ESCAPE)) {
    pushText(source.slice(cursor, match.index));
    if (match[2] === 'm') {
      style = applySgr(style, match[1]);
    }
    cursor = match.index! + match[0].length;
  }
  pushText(source.slice(cursor));
  return lines;
}

export function stripAnsi(text: string): string {
  return text.replace(ESCAPE, '');
}

export function hasAnsi(text: string): boolean {
  return text.includes(ESC);
}
