import React, { memo, useMemo, useRef } from 'react';
import { compiler, MarkdownToJSX, RuleType } from 'markdown-to-jsx';
import { Box, Table as MantineTable, Stack } from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { CodeBlock } from '../CodeBlock/CodeBlock';
import { cx } from '../utils/cx';
import type { SyntaxHighlighter } from '../utils/highlighter';
import { closeUnfinishedMarkdown, hasOpenFence, splitMarkdownStream } from './markdown-stream';
import { shouldStackTable } from './table-layout';
import classes from './Markdown.module.css';

function fixNumberedListBreaks(text: string): string {
  return text.replace(/^(\d+)\.\s*\n+\s*\n*/gm, '$1. ');
}

const GFM_ALERT_RE = /^(\s*>\s*)\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gim;

/**
 * Rewrites GitHub alert markers (`> [!TIP]`) into a bold title line.
 * markdown-to-jsx throws on multi-line alert blockquotes when raw HTML parsing is disabled.
 */
function normalizeGfmAlerts(content: string): string {
  return content.replace(
    GFM_ALERT_RE,
    (_match, prefix: string, kind: string) =>
      `${prefix}**${kind.charAt(0)}${kind.slice(1).toLowerCase()}**`
  );
}

function normalizeCodeFenceLanguages(text: string): string {
  return text.replace(/^( {0,3})(`{3,}|~{3,})([^\n`]*)$/gm, (_match, indent, fence, langRaw) => {
    const lang = String(langRaw || '')
      .trim()
      .toLowerCase()
      .split(/\s+/)[0];
    if (!lang) {
      return `${indent}${fence}`;
    }
    return /^[a-z0-9][a-z0-9_+#.-]{0,31}$/.test(lang)
      ? `${indent}${fence}${lang}`
      : `${indent}${fence}text`;
  });
}

export type MarkdownProps = {
  /** Markdown source */
  content: string;
  /** Class name added to the root element */
  className?: string;
  textContrast?: 'normal' | 'high';
  /** Controls rendered in code blocks, `{ code: true }` by default */
  controls?: { code?: boolean };
  /** Wraps long lines in fenced code blocks instead of scrolling them horizontally, `false` by default */
  wrapLines?: boolean;
  /** Syntax highlighter for fenced code blocks */
  highlighter?: SyntaxHighlighter;
  /** Content is still arriving: finished blocks are parsed once and only the growing tail is re-parsed */
  streaming?: boolean;
  /** Shows tables with too many columns for the available width as one card per row, `false` by default */
  responsiveTables?: boolean;
};

function Anchor({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  children?: React.ReactNode;
}) {
  if (!href) {
    return <span>{children}</span>;
  }
  const isExternal = href.startsWith('http') || href.startsWith('mailto:');
  return (
    <a
      {...props}
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={classes.link}
    >
      {children}
    </a>
  );
}

function Table({ children, className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className={classes.tableWrapper}>
      <table {...props} className={cx(classes.table, className)}>
        {children}
      </table>
    </div>
  );
}

function ResponsiveTable({
  header,
  rows,
  children,
}: {
  header: React.ReactNode[];
  rows: React.ReactNode[][];
  children: React.ReactNode;
}) {
  const { ref, width } = useElementSize<HTMLDivElement>();
  const stacked = shouldStackTable(header.length, width);
  return (
    <div
      ref={ref}
      className={classes.tableContainer}
      data-measuring={width === 0 || undefined}
      data-stacked={stacked || undefined}
    >
      {stacked ? (
        <Stack gap={10} className={classes.stackedTable}>
          {rows.map((row, rowIndex) => (
            <MantineTable key={rowIndex} variant="vertical" withTableBorder layout="fixed" fz="sm">
              <MantineTable.Tbody>
                {header.map((cell, columnIndex) => (
                  <MantineTable.Tr key={columnIndex}>
                    <MantineTable.Th w="40%">{cell}</MantineTable.Th>
                    <MantineTable.Td>{row[columnIndex]}</MantineTable.Td>
                  </MantineTable.Tr>
                ))}
              </MantineTable.Tbody>
            </MantineTable>
          ))}
        </Stack>
      ) : (
        children
      )}
    </div>
  );
}

const OVERRIDES: MarkdownToJSX.Overrides = {
  h1: { props: { className: classes.h1 } },
  h2: { props: { className: classes.h2 } },
  h3: { props: { className: classes.h3 } },
  h4: { props: { className: classes.h4 } },
  p: { props: { className: classes.p } },
  ul: { props: { className: classes.ul } },
  ol: { props: { className: classes.ol } },
  li: { props: { className: classes.li } },
  strong: { props: { className: classes.strong } },
  a: Anchor,
  blockquote: { props: { className: classes.blockquote } },
  hr: { props: { className: classes.hr } },
  table: Table,
  th: { props: { className: classes.th } },
  td: { props: { className: classes.td } },
  code: { props: { className: classes.inlineCode } },
};

interface RenderOptions {
  showCopy: boolean;
  wrapLines: boolean;
  highlighter?: SyntaxHighlighter;
  streaming: boolean;
  responsiveTables: boolean;
}

function createOptions({
  showCopy,
  wrapLines,
  highlighter,
  streaming,
  responsiveTables,
}: RenderOptions): MarkdownToJSX.Options {
  return {
    disableParsingRawHTML: true,
    forceBlock: true,
    overrides: OVERRIDES,
    renderRule: (next, node, renderChildren, state) => {
      if (node.type === RuleType.codeBlock) {
        return (
          <CodeBlock
            key={state.key}
            code={node.text.replace(/\n$/, '')}
            language={node.lang}
            highlighter={highlighter}
            withCopy={showCopy}
            wrapLines={wrapLines}
            streaming={streaming}
          />
        );
      }
      if (responsiveTables && node.type === RuleType.table) {
        return (
          <ResponsiveTable
            key={state.key}
            header={node.header.map((cell) => renderChildren(cell, state))}
            rows={node.cells.map((row) => row.map((cell) => renderChildren(cell, state)))}
          >
            {next()}
          </ResponsiveTable>
        );
      }
      return next();
    },
  };
}

function normalizeMarkdown(content: string): string {
  return normalizeGfmAlerts(normalizeCodeFenceLanguages(fixNumberedListBreaks(content)));
}

const MarkdownChunk = memo(function MarkdownChunk({
  content,
  options,
}: {
  content: string;
  options: MarkdownToJSX.Options;
}) {
  return <>{compiler(content, options)}</>;
});

/** Renders assistant markdown with chat-tuned typography, highlighted code blocks and responsive tables */
export const Markdown = memo(function Markdown({
  content,
  className,
  controls,
  highlighter,
  wrapLines = false,
  streaming = false,
  responsiveTables = false,
}: MarkdownProps) {
  const showCopy = controls?.code !== false;
  const options = useMemo(
    () =>
      createOptions({
        showCopy,
        wrapLines,
        highlighter,
        responsiveTables,
        streaming: false,
      }),
    [showCopy, wrapLines, highlighter, responsiveTables]
  );
  const tailOptions = useMemo(
    () =>
      createOptions({
        showCopy,
        wrapLines,
        highlighter,
        responsiveTables,
        streaming: true,
      }),
    [showCopy, wrapLines, highlighter, responsiveTables]
  );
  const normalized = useMemo(() => normalizeMarkdown(content), [content]);
  // Re-parsing a finished stream as one document would remount every code block and table.
  const streamedRef = useRef(streaming);
  streamedRef.current ||= streaming;

  if (!streamedRef.current) {
    return (
      <Box className={cx(classes.root, className)}>
        <MarkdownChunk content={normalized} options={options} />
      </Box>
    );
  }

  const { stable, tail } = splitMarkdownStream(normalized);
  return (
    <Box className={cx(classes.root, className)} data-streaming={streaming || undefined}>
      {stable.map((block, index) => (
        <MarkdownChunk key={index} content={block} options={options} />
      ))}
      <MarkdownChunk
        key="tail"
        content={streaming ? closeUnfinishedMarkdown(tail) : tail}
        options={streaming && hasOpenFence(tail) ? tailOptions : options}
      />
    </Box>
  );
});

Markdown.displayName = 'Markdown';
