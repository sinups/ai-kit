import React, { memo, useState } from 'react';
import { Box, Button, CopyButton, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconChevronUp, IconCopy } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import { getTokenStyle, useHighlightedLines, type SyntaxHighlighter } from '../utils/highlighter';
import { countCodeLines, getCollapsedLineCount } from './code-lines';
import classes from './CodeBlock.module.css';

export interface CodeBlockLabels {
  copy: string;
  copied: string;
  showMore: (hiddenLines: number) => string;
  showLess: string;
}

export interface CodeBlockProps {
  /** Source code */
  code: string;
  /** Language passed to the highlighter and shown in the header, `text` by default */
  language?: string;
  /** Header text shown instead of the language, for example a file name */
  title?: React.ReactNode;
  /** Syntax highlighter, the code stays plain when omitted or when it returns `null` */
  highlighter?: SyntaxHighlighter;
  /** Shows line numbers */
  withLineNumbers?: boolean;
  /** Number of the first line, `1` by default */
  startLineNumber?: number;
  /** Wraps long lines instead of scrolling horizontally */
  wrap?: boolean;
  /** Shows the copy button, `true` by default */
  withCopy?: boolean;
  /** Collapses long code behind "Show N more lines" after this many lines, off by default */
  collapsedLines?: number | false;
  /** Code is still arriving: highlighting and collapsing wait until it is complete */
  streaming?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<CodeBlockLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const DEFAULT_LABELS: CodeBlockLabels = {
  copy: 'Copy code',
  copied: 'Copied',
  showMore: (count) => (count === 1 ? 'Show 1 more line' : `Show ${count} more lines`),
  showLess: 'Show less',
};

export const CodeBlock = memo(function CodeBlockView({
  code,
  language,
  title,
  highlighter,
  withLineNumbers = false,
  startLineNumber = 1,
  wrap = false,
  withCopy = true,
  collapsedLines = false,
  streaming = false,
  labels,
  className,
  style,
}: CodeBlockProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [expanded, setExpanded] = useState(false);
  const { lines: highlighted } = useHighlightedLines(
    code,
    language,
    streaming ? undefined : highlighter
  );

  const totalLines = countCodeLines(code);
  const visibleLimit =
    collapsedLines === false || streaming
      ? null
      : getCollapsedLineCount(totalLines, collapsedLines);
  const collapsed = visibleLimit !== null && !expanded;
  const needsLines = withLineNumbers || collapsed || highlighted !== null;

  let body: React.ReactNode = code;
  if (needsLines) {
    const rawLines = code.split('\n');
    const lineCount = collapsed ? visibleLimit : rawLines.length;
    const renderLine = (index: number) =>
      highlighted?.[index]
        ? highlighted[index].map((token, tokenIndex) => (
            <span key={tokenIndex} style={getTokenStyle(token)}>
              {token.content}
            </span>
          ))
        : rawLines[index];

    body = Array.from({ length: Math.min(lineCount, rawLines.length) }, (_, index) =>
      withLineNumbers ? (
        <span key={index} className={classes.line}>
          {renderLine(index)}
        </span>
      ) : (
        <React.Fragment key={index}>
          {index > 0 && '\n'}
          {renderLine(index)}
        </React.Fragment>
      )
    );
  }

  const gutter = `${String(startLineNumber + totalLines - 1).length + 1.5}em`;

  return (
    <div className={cx(classes.root, className)} style={style} data-code-block>
      <div className={classes.header}>
        <span className={classes.label}>{title ?? language ?? 'text'}</span>
        {withCopy && (
          <CopyButton value={code} timeout={2000}>
            {({ copied, copy }) => (
              <UnstyledButton
                className={classes.copy}
                onClick={copy}
                aria-label={copied ? text.copied : text.copy}
                data-copied={copied || undefined}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </UnstyledButton>
            )}
          </CopyButton>
        )}
      </div>
      <Box
        component="pre"
        className={classes.body}
        data-wrap={wrap || undefined}
        data-numbered={withLineNumbers || undefined}
        style={
          withLineNumbers
            ? ({
                '--ae-code-start': startLineNumber - 1,
                '--ae-code-gutter': gutter,
              } as React.CSSProperties)
            : undefined
        }
      >
        <code className={language ? `lang-${language}` : undefined}>{body}</code>
      </Box>
      {visibleLimit !== null && (
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          fullWidth
          className={classes.toggle}
          aria-expanded={expanded}
          leftSection={expanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? text.showLess : text.showMore(totalLines - visibleLimit)}
        </Button>
      )}
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
