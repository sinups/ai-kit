import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Collapse, UnstyledButton } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import type { JsonSchema } from '../primitives/SchemaView/schema';
import { ShortcutHint } from '../primitives/ShortcutHint/ShortcutHint';
import { cx } from '../utils/cx';
import { readApprovalParams, type ApprovalParam } from './approval-params';
import classes from './ToolApprovalCard.module.css';

/** Tool or server named in the request: a name and, for a server, its mark */
export type ToolApprovalCardTarget = {
  name: string;
  /** Icon shown before the name, for example the logo of the MCP server */
  icon?: React.ReactNode;
};

export type ToolApprovalCardDecision = 'declined' | 'once' | 'always';

export interface ToolApprovalCardLabels {
  /** Sentence of the request, `{agent}`, `{tool}` and `{server}` are replaced */
  sentence: string;
  /** Sentence used when no server is given, `{agent}` and `{tool}` are replaced */
  sentenceWithoutServer: string;
  /** Who asks, `The agent` by default */
  agent: string;
  /** Refuse button, `Decline` by default */
  decline: string;
  /** Approve once button, `Allow once` by default */
  allowOnce: string;
  /** Approve from now on button, `Always allow` by default */
  alwaysAllow: string;
  /** Accessible name of the toggle that opens the arguments, `Arguments of the call` by default */
  params: string;
}

export const DEFAULT_TOOL_APPROVAL_CARD_LABELS: ToolApprovalCardLabels = {
  sentence: '{agent} wants to use {tool} from {server}',
  sentenceWithoutServer: '{agent} wants to use {tool}',
  agent: 'The agent',
  decline: 'Decline',
  allowOnce: 'Allow once',
  alwaysAllow: 'Always allow',
  params: 'Arguments of the call',
};

export interface ToolApprovalCardProps {
  /** Tool the agent wants to call */
  tool: ToolApprovalCardTarget;
  /** Server the tool belongs to, for example the MCP server */
  server?: ToolApprovalCardTarget;
  /** Arguments of the call: the input of the tool, or lines prepared by the host */
  params?: unknown;
  /** Input schema of the tool: gives the order and the titles of the arguments */
  schema?: JsonSchema;
  /** Locale of numbers and dates, the locale of the runtime by default */
  locale?: string;
  /** Anything shown under the arguments, for example the rule that caused the prompt */
  children?: React.ReactNode;
  /** Arguments are open at mount, `true` by default */
  defaultExpanded?: boolean;
  /** Controlled state of the arguments */
  expanded?: boolean;
  /** Called when the reader opens or closes the arguments */
  onExpandedChange?: (expanded: boolean) => void;
  /** Called when the call is refused */
  onDecline?: () => void;
  /** Called when the call is allowed this one time */
  onAllowOnce?: () => void;
  /** Called when the call is allowed from now on; the button is left out without it */
  onAlwaysAllow?: () => void;
  /** Decision made elsewhere: the buttons stop responding and the chosen one stays marked */
  decision?: ToolApprovalCardDecision | null;
  /** Blocks the buttons while the host is busy with the answer */
  disabled?: boolean;
  /** Esc refuses, Mod+Enter allows once and Shift+Mod+Enter allows always, `true` by default */
  shortcuts?: boolean;
  /** Overrides of the default English labels */
  labels?: Partial<ToolApprovalCardLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

const PLACEHOLDER = /(\{agent\}|\{tool\}|\{server\})/;

function isParamList(value: unknown): value is ApprovalParam[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) => typeof item === 'object' && item !== null && 'label' in item && 'value' in item
    )
  );
}

/**
 * Standalone request to run a tool: one sentence naming the tool and the server it comes from, the
 * arguments of the call under it, and the three answers with their keyboard shortcuts. Use it where
 * the call has not started yet and the reader decides whether it may; `ToolApprovalFooter` is the
 * compact form that lives under a tool card.
 */
export const ToolApprovalCard = memo(function ToolApprovalCard({
  tool,
  server,
  params,
  schema,
  locale,
  children,
  defaultExpanded = true,
  expanded: expandedProp,
  onExpandedChange,
  onDecline,
  onAllowOnce,
  onAlwaysAllow,
  decision: decisionProp,
  disabled = false,
  shortcuts = true,
  labels: labelsProp,
  className,
  style,
}: ToolApprovalCardProps) {
  const labels = { ...DEFAULT_TOOL_APPROVAL_CARD_LABELS, ...labelsProp };
  const [ownExpanded, setOwnExpanded] = useState(defaultExpanded);
  const [ownDecision, setOwnDecision] = useState<ToolApprovalCardDecision | null>(null);
  const expanded = expandedProp ?? ownExpanded;
  const decision = decisionProp !== undefined ? decisionProp : ownDecision;

  const rows = useMemo(
    () => (isParamList(params) ? params : readApprovalParams(params, { schema, locale })),
    [params, schema, locale]
  );
  const hasParams = rows.length > 0 || Boolean(children);

  const answer = (next: ToolApprovalCardDecision, callback?: () => void) => {
    if (decision || disabled) {
      return;
    }
    if (decisionProp === undefined) {
      setOwnDecision(next);
    }
    callback?.();
  };

  const answerRef = useRef(answer);
  answerRef.current = answer;

  useEffect(() => {
    if (!shortcuts || decision || disabled || typeof document === 'undefined') {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.isComposing) {
        return;
      }
      if (event.key === 'Escape' && onDecline) {
        event.preventDefault();
        answerRef.current('declined', onDecline);
        return;
      }
      if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) {
        return;
      }
      if (event.shiftKey && onAlwaysAllow) {
        event.preventDefault();
        answerRef.current('always', onAlwaysAllow);
        return;
      }
      if (!event.shiftKey && onAllowOnce) {
        event.preventDefault();
        answerRef.current('once', onAllowOnce);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shortcuts, decision, disabled, onDecline, onAllowOnce, onAlwaysAllow]);

  const toggle = () => {
    const next = !expanded;
    if (expandedProp === undefined) {
      setOwnExpanded(next);
    }
    onExpandedChange?.(next);
  };

  const template = server ? labels.sentence : labels.sentenceWithoutServer;
  const sentence = template
    .split(PLACEHOLDER)
    .filter(Boolean)
    .map((part, index) => {
      if (part === '{agent}') {
        return <React.Fragment key={index}>{labels.agent}</React.Fragment>;
      }
      if (part === '{tool}') {
        return (
          <span key={index} className={classes.chip} data-part="tool">
            {tool.icon}
            {tool.name}
          </span>
        );
      }
      if (part === '{server}' && server) {
        return (
          <span key={index} className={classes.chip} data-part="server">
            {server.icon}
            {server.name}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  const plainSentence = template
    .replace('{agent}', labels.agent)
    .replace('{tool}', tool.name)
    .replace('{server}', server?.name ?? '');

  const button = (
    kind: ToolApprovalCardDecision,
    label: string,
    keys: string,
    callback: (() => void) | undefined,
    primary?: boolean
  ) =>
    callback ? (
      <UnstyledButton
        className={cx(classes.button, primary && classes.primary)}
        data-answer={kind}
        data-chosen={decision === kind || undefined}
        disabled={Boolean(decision) || disabled}
        onClick={() => answer(kind, callback)}
      >
        {label}
        {shortcuts && !decision && <ShortcutHint keys={keys} className={classes.keys} />}
      </UnstyledButton>
    ) : null;

  return (
    <Box
      className={cx(classes.root, className)}
      style={style}
      data-decided={decision || undefined}
      role="group"
      aria-label={plainSentence}
    >
      <div className={classes.header}>
        <p className={classes.sentence}>{sentence}</p>
        {hasParams && (
          <UnstyledButton
            className={classes.toggle}
            aria-label={labels.params}
            aria-expanded={expanded}
            onClick={toggle}
          >
            <IconChevronDown size={16} data-expanded={expanded || undefined} />
          </UnstyledButton>
        )}
      </div>
      {hasParams && (
        <Collapse expanded={expanded}>
          <div className={classes.params}>
            {rows.length > 0 && (
              <dl className={classes.list}>
                {rows.map((row) => (
                  <React.Fragment key={row.path}>
                    <dt className={classes.name}>{row.label}</dt>
                    <dd className={classes.value}>{row.value}</dd>
                  </React.Fragment>
                ))}
              </dl>
            )}
            {children}
          </div>
        </Collapse>
      )}
      <div className={classes.actions}>
        {button('declined', labels.decline, 'escape', onDecline)}
        <div className={classes.allow}>
          {button('once', labels.allowOnce, 'mod+enter', onAllowOnce)}
          {button('always', labels.alwaysAllow, 'shift+mod+enter', onAlwaysAllow, true)}
        </div>
      </div>
    </Box>
  );
});

ToolApprovalCard.displayName = 'ToolApprovalCard';
