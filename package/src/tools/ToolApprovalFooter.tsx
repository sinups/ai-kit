import React, { memo, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Loader,
  Collapse,
  Group,
  Menu,
  Stack,
  Text,
  TextInput,
  type MantineColor,
} from '@mantine/core';
import { IconAlertCircle, IconChevronDown, IconRobot } from '@tabler/icons-react';
import { describeRule, validateRule } from '../permissions/permission-rule';
import { cx } from '../utils/cx';
import { getErrorMessage } from '../utils/error-message';
import classes from './ToolApprovalFooter.module.css';

export type ToolApprovalOption = {
  /** Scope passed to `onApprove`, for example `once`, `session` or `always` */
  value: string;
  /** Menu item label */
  label: string;
  /** Secondary text under the label */
  description?: string;
};

export type ToolApprovalRisk = 'low' | 'medium' | 'high';

export type ToolApprovalExplanation = {
  /** How risky the tool call is */
  risk: ToolApprovalRisk;
  /** Short explanation of what the call does and why it needs approval */
  explanation: string;
  /** Longer reasoning, collapsed until requested */
  reasoning?: string;
};

export type ToolApprovalRuleSuggestion = {
  /** Suggested permission rule, for example `Bash(npm run test:*)` */
  value: string;
  /** Called with the edited rule on every change */
  onChange?: (value: string) => void;
  /** Label of the `always` menu item added when `approveOptions` has none, `labels.alwaysAllow` by default */
  label?: string;
};

export type ToolApprovalRequester = {
  /** Name of the agent that requested the tool call */
  name: string;
  /** Badge color, `gray` by default */
  color?: MantineColor;
};

export interface ToolApprovalLabels {
  /** Approve button, `Next` by default */
  approve: string;
  /** Reject button, `Skip` by default */
  reject: string;
  /** Approve button text after approval, `Approved` by default */
  approved: string;
  /** Reject button text after rejection, `Skipped` by default */
  skipped: string;
  /** Status while an approved call starts, `Starting` by default */
  starting: string;
  /** Status while an approved call waits for its turn, `Waiting` by default */
  waiting: string;
  /** Status after rejection, `Canceled` by default */
  canceled: string;
  /** Feedback menu item, `Reject with feedback` by default */
  feedback: string;
  /** Feedback input placeholder, `Tell the agent what to do instead` by default */
  feedbackPlaceholder: string;
  /** Button that closes the feedback input, `Back` by default */
  feedbackBack: string;
  /** Button that sends the feedback, `Send` by default */
  feedbackSend: string;
  /** Accessible label of the menu toggle, `More approval options` by default */
  moreOptions: string;
  /** "Why?" button, `Why?` by default */
  explain: string;
  /** Risk badges, `Low risk`, `Medium risk` and `High risk` by default */
  risk: Partial<Record<ToolApprovalRisk, string>>;
  /** Button that expands the reasoning, `Show reasoning` by default */
  showReasoning: string;
  /** Button that collapses the reasoning, `Hide reasoning` by default */
  hideReasoning: string;
  /** Shown when `onExplain` rejects without a message, `Could not load the explanation` by default */
  explainError: string;
  /** Retry button of the explanation error, `Retry` by default */
  retry: string;
  /** Menu item added for `ruleSuggestion` when `approveOptions` has no `always` scope, `Always allow` by default */
  alwaysAllow: string;
  /** Accessible label of the rule input, `Permission rule` by default */
  ruleInput: string;
  /** Button that approves with the edited rule, `Confirm` by default */
  ruleConfirm: string;
  /** Button that closes the rule editor, `Back` by default */
  ruleBack: string;
  /** Prefix of `matchedRule`, `Asked because:` by default */
  matchedRule: string;
}

export const DEFAULT_TOOL_APPROVAL_LABELS: ToolApprovalLabels = {
  approve: 'Next',
  reject: 'Skip',
  approved: 'Approved',
  skipped: 'Skipped',
  starting: 'Starting',
  waiting: 'Waiting',
  canceled: 'Canceled',
  feedback: 'Reject with feedback',
  feedbackPlaceholder: 'Tell the agent what to do instead',
  feedbackBack: 'Back',
  feedbackSend: 'Send',
  moreOptions: 'More approval options',
  explain: 'Why?',
  risk: { low: 'Low risk', medium: 'Medium risk', high: 'High risk' },
  showReasoning: 'Show reasoning',
  hideReasoning: 'Hide reasoning',
  explainError: 'Could not load the explanation',
  retry: 'Retry',
  alwaysAllow: 'Always allow',
  ruleInput: 'Permission rule',
  ruleConfirm: 'Confirm',
  ruleBack: 'Back',
  matchedRule: 'Asked because:',
};

export type ToolApproval = {
  /** @deprecated Use `labels.approve` */
  approveLabel?: string;
  /** @deprecated Use `labels.reject` */
  rejectLabel?: string;
  /** Called once when the tool is approved; receives the scope picked from `approveOptions` */
  onApprove?: (scope?: string) => void;
  /** Called once when the reject button is clicked */
  onReject?: () => void;
  /** Approval scopes shown in a menu next to the approve button */
  approveOptions?: ToolApprovalOption[];
  /** Removes the footer from a tool card once its call has finished, `false` by default */
  hideWhenComplete?: boolean;
  /** Why confirmation is needed, shown until a decision is made */
  reason?: React.ReactNode;
  /** Adds a "Reject with feedback" menu item; called with the typed feedback on Enter */
  onRejectWithFeedback?: (feedback: string) => void;
  /** Loads a risk assessment shown under the footer by the "Why?" button; the result is cached */
  onExplain?: () => Promise<ToolApprovalExplanation>;
  /** Rule saved by the `always` scope; picking that scope opens an editor before approving */
  ruleSuggestion?: ToolApprovalRuleSuggestion;
  /** Permission rule that caused the prompt, shown after `labels.matchedRule` */
  matchedRule?: React.ReactNode;
  /** Worker agent that requested the tool call, shown as a badge */
  requestedBy?: ToolApprovalRequester;
  /** Overrides of the default English labels */
  labels?: Partial<ToolApprovalLabels>;
};

export interface ToolApprovalFooterProps extends ToolApproval {
  /** The tool call has not finished yet; after approval the footer shows "Starting..." while it is set */
  isPending?: boolean;
  /** The tool call finished, the footer is no longer needed and renders nothing */
  isComplete?: boolean;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

type Decision = 'approved' | 'rejected' | null;

type ExplainState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; result: ToolApprovalExplanation };

const RISK_COLORS: Record<ToolApprovalRisk, MantineColor> = {
  low: 'green',
  medium: 'yellow',
  high: 'red',
};

const ALWAYS_SCOPE = 'always';

type StatusLabels = { starting: string; waiting: string; canceled: string };

function getStatus(decision: Decision, isPending: boolean | undefined, labels: StatusLabels) {
  if (decision === 'approved') {
    return { label: isPending ? labels.starting : labels.waiting, dots: true };
  }
  if (decision === 'rejected') {
    return { label: labels.canceled, dots: false };
  }
  if (isPending) {
    return { label: labels.starting, dots: true };
  }
  return null;
}

/** Approve/reject footer rendered under tool cards that require confirmation */
export const ToolApprovalFooter = memo(function ToolApprovalFooter({
  isPending,
  isComplete = false,
  approveLabel,
  rejectLabel,
  onApprove,
  onReject,
  approveOptions,
  reason,
  onRejectWithFeedback,
  onExplain,
  ruleSuggestion,
  matchedRule,
  requestedBy,
  labels: labelsProp,
  className,
  style,
}: ToolApprovalFooterProps) {
  const labels = {
    ...DEFAULT_TOOL_APPROVAL_LABELS,
    ...labelsProp,
    risk: { ...DEFAULT_TOOL_APPROVAL_LABELS.risk, ...labelsProp?.risk },
  };
  const [decision, setDecision] = useState<Decision>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [explain, setExplain] = useState<ExplainState>({ kind: 'idle' });
  const [explainOpen, setExplainOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState(ruleSuggestion?.value ?? '');

  const approveText =
    decision === 'approved'
      ? labels.approved
      : (labelsProp?.approve ?? approveLabel ?? labels.approve);
  const rejectText =
    decision === 'rejected' ? labels.skipped : (labelsProp?.reject ?? rejectLabel ?? labels.reject);
  const options: ToolApprovalOption[] =
    ruleSuggestion && !approveOptions?.some((option) => option.value === ALWAYS_SCOPE)
      ? [
          ...(approveOptions ?? []),
          { value: ALWAYS_SCOPE, label: ruleSuggestion.label ?? labels.alwaysAllow },
        ]
      : (approveOptions ?? []);
  const hasMenu = Boolean(options.length || onRejectWithFeedback);
  const decided = Boolean(decision);
  const status = getStatus(decision, isPending, {
    starting: labels.starting,
    waiting: labels.waiting,
    canceled: labels.canceled,
  });
  const ruleValidation = validateRule(ruleDraft);

  const handleApprove = (scope?: string) => {
    if (decision) {
      return;
    }
    setDecision('approved');
    setRuleOpen(false);
    if (scope === undefined) {
      onApprove?.();
    } else {
      onApprove?.(scope);
    }
  };

  const pickOption = (scope: string) => {
    if (scope === ALWAYS_SCOPE && ruleSuggestion) {
      setRuleOpen(true);
      return;
    }
    handleApprove(scope);
  };

  const handleReject = () => {
    if (decision) {
      return;
    }
    setDecision('rejected');
    onReject?.();
  };

  const submitFeedback = () => {
    const text = feedback.trim();
    if (decision || !text) {
      return;
    }
    setDecision('rejected');
    setFeedbackOpen(false);
    onRejectWithFeedback?.(text);
  };

  const loadExplanation = async () => {
    if (!onExplain) {
      return;
    }
    setExplain({ kind: 'loading' });
    try {
      const result = await onExplain();
      setExplain({ kind: 'ready', result });
    } catch (error) {
      setExplain({
        kind: 'error',
        message: getErrorMessage(error, labels.explainError),
      });
    }
    setExplainOpen(true);
  };

  const toggleExplanation = () => {
    if (explain.kind === 'loading') {
      return;
    }
    if (explain.kind === 'idle') {
      void loadExplanation();
      return;
    }
    setExplainOpen((open) => !open);
  };

  const changeRule = (value: string) => {
    setRuleDraft(value);
    ruleSuggestion?.onChange?.(value);
  };

  if (isComplete) {
    return null;
  }

  if (feedbackOpen && !decision) {
    return (
      <Group
        className={cx(classes.root, className)}
        style={style}
        gap={10}
        wrap="nowrap"
        justify="space-between"
      >
        <TextInput
          size="xs"
          variant="unstyled"
          autoFocus
          flex={1}
          miw={0}
          aria-label={labels.feedback}
          placeholder={labels.feedbackPlaceholder}
          value={feedback}
          onChange={(event) => setFeedback(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitFeedback();
            }
            if (event.key === 'Escape') {
              setFeedbackOpen(false);
            }
          }}
        />
        <Group gap={4} wrap="nowrap">
          <Button
            unstyled
            className={cx(classes.button, classes.reject)}
            onClick={() => setFeedbackOpen(false)}
          >
            {labels.feedbackBack}
          </Button>
          <Button
            unstyled
            className={cx(classes.button, classes.approve)}
            onClick={submitFeedback}
            disabled={!feedback.trim()}
          >
            {labels.feedbackSend}
          </Button>
        </Group>
      </Group>
    );
  }

  if (ruleOpen && !decision) {
    const ruleError = ruleValidation.error;
    return (
      <Stack className={cx(classes.root, className)} style={style} gap={6}>
        <TextInput
          size="xs"
          autoFocus
          aria-label={labels.ruleInput}
          value={ruleDraft}
          error={ruleError}
          description={
            ruleValidation.rule
              ? describeRule({ behavior: 'allow', ...ruleValidation.rule })
              : undefined
          }
          inputWrapperOrder={['input', 'description', 'error']}
          classNames={{ input: classes.ruleInput }}
          onChange={(event) => changeRule(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (!ruleError) {
                handleApprove(ALWAYS_SCOPE);
              }
            }
            if (event.key === 'Escape') {
              setRuleOpen(false);
            }
          }}
        />
        <Group gap={4} wrap="nowrap" justify="flex-end">
          <Button
            unstyled
            className={cx(classes.button, classes.reject)}
            onClick={() => setRuleOpen(false)}
          >
            {labels.ruleBack}
          </Button>
          <Button
            unstyled
            className={cx(classes.button, classes.approve)}
            onClick={() => handleApprove(ALWAYS_SCOPE)}
            disabled={Boolean(ruleError)}
          >
            {labels.ruleConfirm}
          </Button>
        </Group>
      </Stack>
    );
  }

  let statusNode: React.ReactNode = null;
  if (status && (decided || !(reason || matchedRule))) {
    statusNode = (
      <span className={classes.status}>
        {status.label}
        {status.dots && (
          <span className={classes.dots} aria-hidden="true">
            <span className={classes.dot}>.</span>
            <span className={classes.dot}>.</span>
            <span className={classes.dot}>.</span>
          </span>
        )}
      </span>
    );
  } else if (reason || matchedRule) {
    statusNode = (
      <Stack gap={0} miw={0}>
        {reason && (
          <Text span truncate="end" className={classes.status}>
            {reason}
          </Text>
        )}
        {matchedRule && (
          <Text span truncate="end" className={classes.status}>
            {labels.matchedRule} {matchedRule}
          </Text>
        )}
      </Stack>
    );
  }

  const approveButton = (
    <Button
      unstyled
      className={cx(classes.button, classes.approve, hasMenu && classes.joined)}
      onClick={() => handleApprove()}
      disabled={decided}
    >
      {approveText}
    </Button>
  );

  const explanation = explain.kind === 'ready' ? explain.result : null;

  return (
    <Box className={cx(classes.root, className)} style={style}>
      <Box className={classes.row}>
        <Group gap={6} wrap="nowrap" className={classes.lead}>
          {requestedBy && (
            <Badge
              size="xs"
              variant="light"
              color={requestedBy.color ?? 'gray'}
              leftSection={<IconRobot size={10} />}
              className={classes.requester}
            >
              {requestedBy.name}
            </Badge>
          )}
          {statusNode}
        </Group>
        <Box className={classes.actions}>
          {onExplain && !decided && (
            <Button
              unstyled
              className={cx(classes.button, classes.reject)}
              onClick={toggleExplanation}
              data-loading={explain.kind === 'loading' || undefined}
              aria-busy={explain.kind === 'loading' || undefined}
              aria-expanded={explainOpen}
            >
              {explain.kind === 'loading' && <Loader size={10} color="currentColor" mr={4} />}
              {labels.explain}
            </Button>
          )}
          <Button
            unstyled
            className={cx(classes.button, classes.reject)}
            onClick={handleReject}
            disabled={decided}
          >
            {rejectText}
          </Button>
          {hasMenu ? (
            <Group gap={0} wrap="nowrap">
              {approveButton}
              <Menu position="top-end" disabled={decided}>
                <Menu.Target>
                  <Button
                    unstyled
                    disabled={decided}
                    aria-label={labels.moreOptions}
                    className={cx(classes.button, classes.approve, classes.toggle)}
                  >
                    <IconChevronDown size={12} stroke={2} />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {options.map((option) => (
                    <Menu.Item key={option.value} onClick={() => pickOption(option.value)}>
                      <Text size="xs">{option.label}</Text>
                      {option.description && (
                        <Text size="xs" c="dimmed">
                          {option.description}
                        </Text>
                      )}
                    </Menu.Item>
                  ))}
                  {onRejectWithFeedback && (
                    <>
                      {options.length > 0 && <Menu.Divider />}
                      <Menu.Item onClick={() => setFeedbackOpen(true)}>
                        <Text size="xs">{labels.feedback}</Text>
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          ) : (
            approveButton
          )}
        </Box>
      </Box>
      {onExplain && (
        <Collapse expanded={explainOpen && !decided}>
          <Stack gap={6} pt={6} pb={4}>
            {explain.kind === 'error' && (
              <Alert color="red" variant="light" p={10} icon={<IconAlertCircle size={14} />}>
                <Group gap={10} justify="space-between" wrap="nowrap">
                  <Text size="xs">{explain.message}</Text>
                  <Button
                    unstyled
                    onClick={loadExplanation}
                    className={cx(classes.button, classes.reject, classes.noShrink)}
                  >
                    {labels.retry}
                  </Button>
                </Group>
              </Alert>
            )}
            {explanation && (
              <>
                <Group gap={6} wrap="nowrap" align="flex-start">
                  <Badge
                    size="xs"
                    variant="light"
                    color={RISK_COLORS[explanation.risk]}
                    className={classes.noShrink}
                  >
                    {labels.risk[explanation.risk]}
                  </Badge>
                  <Text size="xs">{explanation.explanation}</Text>
                </Group>
                {explanation.reasoning && (
                  <>
                    <Button
                      unstyled
                      className={cx(classes.button, classes.reject, classes.reasoningToggle)}
                      onClick={() => setReasoningOpen((open) => !open)}
                      aria-expanded={reasoningOpen}
                    >
                      {reasoningOpen ? labels.hideReasoning : labels.showReasoning}
                    </Button>
                    <Collapse expanded={reasoningOpen}>
                      <Text size="xs" className={classes.reasoning}>
                        {explanation.reasoning}
                      </Text>
                    </Collapse>
                  </>
                )}
              </>
            )}
          </Stack>
        </Collapse>
      )}
    </Box>
  );
});

ToolApprovalFooter.displayName = 'ToolApprovalFooter';
