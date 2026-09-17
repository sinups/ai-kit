import React, { useMemo } from 'react';
import type { DiffLine } from '../types/timeline';
import { cx } from '../utils/cx';
import { overlaySegments } from '../utils/highlight-overlay';
import { getTokenStyle, useHighlightedLines, type SyntaxHighlighter } from '../utils/highlighter';
import { diffLines } from '../utils/line-diff';
import classes from './DiffView.module.css';

export interface DiffViewProps {
  /** Content before the change */
  oldText: string;
  /** Content after the change */
  newText: string;
  /** Highlights the changed words inside replaced lines, `false` by default */
  wordHighlight?: boolean;
  /** Wraps long lines instead of scrolling horizontally, `false` by default */
  wrapLines?: boolean;
  /** Colors the code with this highlighter, plain text when omitted */
  highlighter?: SyntaxHighlighter;
  /** Language passed to `highlighter`, for example `ts` */
  language?: string;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

type Segment = { text: string; changed: boolean };

type Row = {
  type: DiffLine['type'];
  number: number;
  segments: Segment[];
};

function commonPrefix(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}

function commonSuffix(a: string, b: string, limit: number) {
  let i = 0;
  while (
    i < a.length - limit &&
    i < b.length - limit &&
    a[a.length - 1 - i] === b[b.length - 1 - i]
  ) {
    i++;
  }
  return i;
}

const BOUNDARY = /[\s()[\]{}<>,;:.'"`=+\-*/|&!?]/;

function snapPrefix(text: string, prefix: number) {
  let i = prefix;
  while (i > 0 && !BOUNDARY.test(text[i - 1])) {
    i--;
  }
  return i;
}

function snapSuffix(text: string, suffix: number) {
  let i = suffix;
  while (i > 0 && !BOUNDARY.test(text[text.length - i])) {
    i--;
  }
  return i;
}

function splitChanged(text: string, prefix: number, suffix: number): Segment[] {
  const segments: Segment[] = [];
  if (prefix > 0) {
    segments.push({ text: text.slice(0, prefix), changed: false });
  }
  const middle = text.slice(prefix, text.length - suffix);
  if (middle) {
    segments.push({ text: middle, changed: true });
  }
  if (suffix > 0) {
    segments.push({ text: text.slice(text.length - suffix), changed: false });
  }
  return segments;
}

function stripTrailingNewline(text: string) {
  return text.endsWith('\n') ? text.slice(0, -1) : text;
}

function plain(text: string): Segment[] {
  return [{ text, changed: false }];
}

/** Builds rows with line numbers and inline highlight for replaced fragments */
function buildRows(lines: DiffLine[], wordHighlight: boolean): Row[] {
  const rows: Row[] = [];
  let oldNo = 1;
  let newNo = 1;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.type === 'context') {
      rows.push({ type: 'context', number: newNo, segments: plain(line.content) });
      oldNo++;
      newNo++;
      i++;
      continue;
    }

    let removeEnd = i;
    while (removeEnd < lines.length && lines[removeEnd].type === 'remove') {
      removeEnd++;
    }
    let addEnd = removeEnd;
    while (addEnd < lines.length && lines[addEnd].type === 'add') {
      addEnd++;
    }

    const removed = lines.slice(i, removeEnd);
    const added = lines.slice(removeEnd, addEnd);
    const pairCount = wordHighlight ? Math.min(removed.length, added.length) : 0;

    removed.forEach((removedLine, index) => {
      let segments = plain(removedLine.content);
      if (index < pairCount) {
        const addedLine = added[index];
        const rawPrefix = commonPrefix(removedLine.content, addedLine.content);
        const rawSuffix = commonSuffix(removedLine.content, addedLine.content, rawPrefix);
        const prefix = snapPrefix(removedLine.content, rawPrefix);
        const suffix = snapSuffix(removedLine.content, rawSuffix);
        if (prefix + suffix > 0 && prefix + suffix < removedLine.content.length) {
          segments = splitChanged(removedLine.content, prefix, suffix);
        }
      }
      rows.push({ type: 'remove', number: oldNo++, segments });
    });

    added.forEach((addedLine, index) => {
      let segments = plain(addedLine.content);
      if (index < pairCount) {
        const removedLine = removed[index];
        const rawPrefix = commonPrefix(removedLine.content, addedLine.content);
        const rawSuffix = commonSuffix(removedLine.content, addedLine.content, rawPrefix);
        const prefix = snapPrefix(addedLine.content, rawPrefix);
        const suffix = snapSuffix(addedLine.content, rawSuffix);
        if (prefix + suffix > 0 && prefix + suffix < addedLine.content.length) {
          segments = splitChanged(addedLine.content, prefix, suffix);
        }
      }
      rows.push({ type: 'add', number: newNo++, segments });
    });

    i = addEnd;
  }

  return rows;
}

/** Unified line diff with line numbers, gutter markers and inline change highlight, replaces `@pierre/diffs` */
export function DiffView({
  oldText,
  newText,
  wordHighlight = false,
  wrapLines = false,
  highlighter,
  language,
  className,
  style,
}: DiffViewProps) {
  const oldCode = stripTrailingNewline(oldText);
  const newCode = stripTrailingNewline(newText);
  const rows = useMemo(
    () => buildRows(diffLines(oldCode, newCode), wordHighlight),
    [oldCode, newCode, wordHighlight]
  );
  const { lines: oldLines } = useHighlightedLines(oldCode, language, highlighter);
  const { lines: newLines } = useHighlightedLines(newCode, language, highlighter);
  const digits = String(rows.reduce((max, row) => (row.number > max ? row.number : max), 1)).length;

  return (
    <div
      className={cx(classes.root, className)}
      data-wrap={wrapLines || undefined}
      style={{ '--ae-diff-digits': digits, ...style } as React.CSSProperties}
    >
      {rows.map((row, index) => (
        <div key={index} className={classes.line} data-type={row.type}>
          <span className={classes.gutter} />
          <span className={classes.number}>{row.number}</span>
          <span className={classes.content}>
            {(row.type === 'remove' ? oldLines : newLines)
              ? overlaySegments(
                  (row.type === 'remove' ? oldLines : newLines)?.[row.number - 1],
                  row.segments.map((segment) => ({ text: segment.text, mark: segment.changed }))
                ).map((piece, pieceIndex) =>
                  piece.mark ? (
                    <mark
                      key={pieceIndex}
                      className={classes.highlight}
                      style={piece.token ? getTokenStyle(piece.token) : undefined}
                    >
                      {piece.text}
                    </mark>
                  ) : (
                    <span
                      key={pieceIndex}
                      style={piece.token ? getTokenStyle(piece.token) : undefined}
                    >
                      {piece.text}
                    </span>
                  )
                )
              : row.segments.map((segment, segmentIndex) =>
                  segment.changed ? (
                    <mark key={segmentIndex} className={classes.highlight}>
                      {segment.text}
                    </mark>
                  ) : (
                    <React.Fragment key={segmentIndex}>{segment.text}</React.Fragment>
                  )
                )}
          </span>
        </div>
      ))}
    </div>
  );
}
