import React, { memo, useState } from 'react';
import {
  Alert,
  Button,
  Divider,
  Group,
  Menu,
  Paper,
  Spoiler,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconFileDescription,
  IconPencil,
  IconX,
} from '@tabler/icons-react';
import { Markdown } from '../../Markdown/Markdown';
import { StatusBadge } from '../../primitives/StatusBadge/StatusBadge';
import type { Plan } from '../../tools/PlanTool';
import {
  getApproveModeLabel,
  getCollapsedPlanHeight,
  getPlanFileName,
  type PlanApproveOption,
} from '../plan-approval';
import type { PlanDecision } from '../types';
import { useAsyncAction } from '../use-async-action';
import classes from './PlanApproval.module.css';

export interface PlanApprovalLabels {
  showFull: string;
  showLess: string;
  empty: string;
  approve: string;
  approveWithEdits: string;
  reject: string;
  rejectWithFeedback: string;
  back: string;
  editsLabel: string;
  editsPlaceholder: string;
  feedbackLabel: string;
  feedbackPlaceholder: string;
  approved: string;
  approvedWithEdits: string;
  rejected: string;
  error: string;
  moreApproveOptions: string;
}

export const DEFAULT_PLAN_APPROVAL_LABELS: PlanApprovalLabels = {
  showFull: 'Show full plan',
  showLess: 'Show less',
  empty: 'No plan details provided.',
  approve: 'Approve',
  approveWithEdits: 'Approve with edits',
  reject: 'Reject',
  rejectWithFeedback: 'Reject with feedback',
  back: 'Back',
  editsLabel: 'Edits to the plan',
  editsPlaceholder: 'Describe what to change before the agent starts',
  feedbackLabel: 'Why is the plan rejected?',
  feedbackPlaceholder: 'Tell the agent what to do instead',
  approved: 'Approved',
  approvedWithEdits: 'Approved with edits',
  rejected: 'Rejected',
  error: 'Could not send the decision',
  moreApproveOptions: 'More approval options',
};

type Mode = 'idle' | 'edits' | 'reject';

export interface PlanApprovalProps {
  /** Plan in the same shape as `PlanTool`: `summary` is rendered as Markdown */
  plan: Plan;
  /** Approves the plan as is, with the picked `approveOptions` value when options are set; buttons show a loader until the promise settles */
  onApprove: (mode?: string) => void | Promise<void>;
  /** Approval modes such as auto-accept edits; the approve button uses the first one and a menu offers all of them */
  approveOptions?: PlanApproveOption[];
  /** Adds "Approve with edits", called with the trimmed edits */
  onApproveWithEdits?: (edits: string) => void | Promise<void>;
  /** Adds "Reject with feedback", called with the trimmed feedback */
  onReject?: (feedback: string) => void | Promise<void>;
  /** Decision already made, renders the final state instead of the actions */
  decision?: PlanDecision | null;
  /** Number of lines the plan is collapsed to, `8` by default */
  collapsedLines?: number;
  /** Overrides of the default English labels */
  labels?: Partial<PlanApprovalLabels>;
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

/** Plan review card: collapsible Markdown plan with approve, approve with edits and reject with feedback */
export const PlanApproval = memo(function PlanApproval({
  plan,
  onApprove,
  approveOptions,
  onApproveWithEdits,
  onReject,
  decision: decisionProp,
  collapsedLines = 8,
  labels: labelsProp,
  className,
  style,
}: PlanApprovalProps) {
  const labels = { ...DEFAULT_PLAN_APPROVAL_LABELS, ...labelsProp };
  const [mode, setMode] = useState<Mode>('idle');
  const [note, setNote] = useState('');
  const [internalDecision, setInternalDecision] = useState<PlanDecision | null>(null);
  const { pendingKey, error, run, clearError } = useAsyncAction(labels.error);
  const decision = decisionProp === undefined ? internalDecision : decisionProp;
  const isPending = pendingKey !== null;
  const summary = plan.summary?.trim() ?? '';
  const trimmedNote = note.trim();

  const decide = async (next: PlanDecision, action: () => void | Promise<void>) => {
    const ok = await run(next.kind, action);
    if (ok) {
      setInternalDecision(next);
      setMode('idle');
    }
  };

  const switchMode = (next: Mode) => {
    clearError();
    setNote('');
    setMode(next);
  };

  const approve = (approveMode?: string) =>
    decide(
      approveMode === undefined ? { kind: 'approved' } : { kind: 'approved', mode: approveMode },
      () => (approveMode === undefined ? onApprove() : onApprove(approveMode))
    );

  const approveButton = (
    <Button
      size="xs"
      leftSection={<IconCheck size={14} />}
      loading={pendingKey === 'approved'}
      disabled={isPending}
      onClick={() => approve(approveOptions?.[0]?.value)}
    >
      {labels.approve}
    </Button>
  );

  let footer: React.ReactNode;
  if (decision) {
    const edits = decision.kind === 'approved-with-edits' ? decision.edits : undefined;
    const feedback = decision.kind === 'rejected' ? decision.feedback : undefined;
    const modeLabel =
      decision.kind === 'rejected' ? undefined : getApproveModeLabel(approveOptions, decision.mode);
    const decisionLabel =
      decision.kind === 'approved'
        ? labels.approved
        : decision.kind === 'approved-with-edits'
          ? labels.approvedWithEdits
          : labels.rejected;
    footer = (
      <Stack gap="xs" role="status">
        <Group gap="xs">
          <StatusBadge
            status={decision.kind === 'rejected' ? 'error' : 'success'}
            label={modeLabel ? `${decisionLabel} · ${modeLabel}` : decisionLabel}
          />
        </Group>
        {(edits || feedback) && (
          <Stack gap={2} className={classes.note} data-tone={feedback ? 'danger' : 'info'}>
            <Text size="xs" c="dimmed">
              {feedback ? labels.feedbackLabel : labels.editsLabel}
            </Text>
            <Text size="sm" className={classes.noteText}>
              {edits || feedback}
            </Text>
          </Stack>
        )}
      </Stack>
    );
  } else if (mode !== 'idle') {
    const isEdits = mode === 'edits';
    footer = (
      <Stack gap="xs">
        <Textarea
          label={isEdits ? labels.editsLabel : labels.feedbackLabel}
          placeholder={isEdits ? labels.editsPlaceholder : labels.feedbackPlaceholder}
          autosize
          minRows={2}
          maxRows={8}
          autoFocus
          value={note}
          readOnly={isPending}
          onChange={(event) => setNote(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isPending) {
              switchMode('idle');
            }
          }}
        />
        <Group gap="xs" justify="flex-end">
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => switchMode('idle')}
            disabled={isPending}
          >
            {labels.back}
          </Button>
          {isEdits ? (
            <Button
              size="xs"
              leftSection={<IconPencil size={14} />}
              disabled={!trimmedNote}
              loading={isPending}
              onClick={() =>
                decide({ kind: 'approved-with-edits', edits: trimmedNote }, () =>
                  onApproveWithEdits?.(trimmedNote)
                )
              }
            >
              {labels.approveWithEdits}
            </Button>
          ) : (
            <Button
              size="xs"
              color="var(--ae-danger-fill)"
              leftSection={<IconX size={14} />}
              disabled={!trimmedNote}
              loading={isPending}
              onClick={() =>
                decide({ kind: 'rejected', feedback: trimmedNote }, () => onReject?.(trimmedNote))
              }
            >
              {labels.reject}
            </Button>
          )}
        </Group>
      </Stack>
    );
  } else {
    footer = (
      <Group gap="xs" justify="flex-end">
        {onReject && (
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => switchMode('reject')}
            disabled={isPending}
          >
            {labels.rejectWithFeedback}
          </Button>
        )}
        {onApproveWithEdits && (
          <Button
            size="xs"
            variant="subtle"
            color="gray"
            onClick={() => switchMode('edits')}
            disabled={isPending}
          >
            {labels.approveWithEdits}
          </Button>
        )}
        {approveOptions && approveOptions.length > 0 ? (
          <Button.Group>
            {approveButton}
            <Menu position="bottom-end" disabled={isPending}>
              <Menu.Target>
                <Button
                  size="xs"
                  px={6}
                  disabled={isPending}
                  aria-label={labels.moreApproveOptions}
                >
                  <IconChevronDown size={14} />
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                {approveOptions.map((option) => (
                  <Menu.Item key={option.value} onClick={() => approve(option.value)}>
                    <Text size="xs">{option.label}</Text>
                    {option.description && (
                      <Text size="xs" c="dimmed">
                        {option.description}
                      </Text>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Dropdown>
            </Menu>
          </Button.Group>
        ) : (
          approveButton
        )}
      </Group>
    );
  }

  return (
    <Paper withBorder radius="md" className={className} style={style}>
      <Stack gap={4} px="md" pt="sm" pb="xs">
        <Group gap={6} wrap="nowrap" c="dimmed">
          <IconFileDescription size={14} aria-hidden />
          <Text size="xs" c="dimmed" ff="monospace" truncate="end" miw={0}>
            {getPlanFileName(plan)}
          </Text>
        </Group>
        <Text size="sm" fw={500}>
          {plan.title}
        </Text>
      </Stack>
      <Stack gap={0} px="md" pb="sm">
        {summary ? (
          <Spoiler
            maxHeight={getCollapsedPlanHeight(collapsedLines)}
            showLabel={labels.showFull}
            hideLabel={labels.showLess}
            classNames={{ control: classes.spoilerControl }}
          >
            <Markdown content={summary} />
          </Spoiler>
        ) : (
          <Text size="sm" c="dimmed">
            {labels.empty}
          </Text>
        )}
      </Stack>
      <Divider />
      <Stack gap="xs" p="sm">
        {error && (
          <Alert color="red" variant="light" p="xs" icon={<IconAlertCircle size={16} />}>
            {error}
          </Alert>
        )}
        {footer}
      </Stack>
    </Paper>
  );
});

PlanApproval.displayName = 'PlanApproval';
