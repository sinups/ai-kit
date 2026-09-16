import React, { memo, useMemo } from 'react';
import { compiler, MarkdownToJSX, RuleType } from 'markdown-to-jsx';
import { Box, CopyButton, UnstyledButton } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { cx } from '../utils/cx';
import classes from './Markdown.module.css';

function fixNumberedListBreaks(text: string): string {
  return text.replace(/^(\d+)\.\s*\n+\s*\n*/gm, '$1. ');
}

const CODE_FENCE_LANGS = new Set([
  'bash',
  'diff',
  'html',
  'js',
  'json',
  'jsx',
  'md',
  'markdown',
  'sh',
  'shell',
  'text',
  'ts',
  'tsx',
  'yml',
  'yaml',
]);

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
  return text.replace(/```([^\n]*)/g, (_match, langRaw) => {
    const lang = String(langRaw || '')
      .trim()
      .toLowerCase();
    if (!lang) {
      return '```';
    }
    const normalized = lang.split(/\s+/)[0];
    return CODE_FENCE_LANGS.has(normalized) ? `\`\`\`${normalized}` : '```text';
  });
}

export type MarkdownProps = {
  content: string;
  className?: string;
  textContrast?: 'normal' | 'high';
  /** Controls rendered in code blocks, `{ code: true }` by default */
  controls?: { code?: boolean };
};

function FencedCode({
  lang,
  text,
  showCopy = true,
}: {
  lang?: string;
  text: string;
  showCopy?: boolean;
}) {
  return (
    <div className={classes.codeBlock}>
      <div className={classes.codeBlockHeader}>
        <span className={classes.codeBlockLang}>{lang || 'text'}</span>
        {showCopy && (
          <CopyButton value={text} timeout={2000}>
            {({ copied, copy }) => (
              <UnstyledButton
                className={classes.codeBlockCopy}
                onClick={copy}
                aria-label={copied ? 'Copied' : 'Copy code'}
                data-copied={copied || undefined}
              >
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </UnstyledButton>
            )}
          </CopyButton>
        )}
      </div>
      <pre className={classes.codeBlockBody}>
        <code className={lang ? `lang-${lang}` : undefined}>{text}</code>
      </pre>
    </div>
  );
}

function Anchor({
  href,
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) {
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

function createOptions(showCopy: boolean): MarkdownToJSX.Options {
  return {
    disableParsingRawHTML: true,
    forceBlock: true,
    overrides: OVERRIDES,
    renderRule: (next, node, _renderChildren, state) => {
      if (node.type === RuleType.codeBlock) {
        return <FencedCode key={state.key} lang={node.lang} text={node.text} showCopy={showCopy} />;
      }
      return next();
    },
  };
}

const OPTIONS_WITH_COPY = createOptions(true);
const OPTIONS_WITHOUT_COPY = createOptions(false);

/** Renders assistant markdown with chat-tuned typography and copyable code blocks */
export const Markdown = memo(function Markdown({ content, className, controls }: MarkdownProps) {
  const showCopy = controls?.code !== false;
  const rendered = useMemo(() => {
    const safeContent = normalizeGfmAlerts(
      normalizeCodeFenceLanguages(fixNumberedListBreaks(content))
    );
    return compiler(safeContent, showCopy ? OPTIONS_WITH_COPY : OPTIONS_WITHOUT_COPY);
  }, [content, showCopy]);
  return <Box className={cx(classes.root, className)}>{rendered}</Box>;
});

Markdown.displayName = 'Markdown';
