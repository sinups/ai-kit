import React, { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Divider,
  Fieldset,
  Group,
  Menu,
  Progress,
  Stack,
  Stepper,
  Text,
  VisuallyHidden,
} from '@mantine/core';
import { useElementSize } from '@mantine/hooks';
import { IconAlertCircle, IconChevronDown } from '@tabler/icons-react';
import { cx } from '../../utils/cx';
import { getErrorMessage } from '../../utils/error-message';
import { useWizard, type WizardNextResult } from './use-wizard';
import { getFirstFocusable } from './wizard-focus';
import type { WizardStep } from './wizard-state';
import classes from './Wizard.module.css';

export interface WizardLabels {
  back: string;
  next: string;
  finish: string;
  cancel: string;
  skip: string;
  review: string;
  optional: string;
  /** Compact header counter, `{current}` and `{total}` are replaced */
  stepCounter: string;
  /** Shown when `onComplete` rejects without a message */
  error: string;
  /** Accessible label of the step menu in the compact header of a non-linear wizard */
  goToStep: string;
}

export interface WizardProps<V> {
  /** Steps in order, hidden ones are filtered with `step.when` */
  steps: WizardStep<V>[];
  /** Initial values when `values` is not controlled */
  initialValues: V;
  /** Controlled values */
  values?: V;
  /** Called with the next values on every change */
  onValuesChange?: (values: V) => void;
  /** Called after the last step passes validation, a rejected promise is shown in an alert */
  onComplete: (values: V) => void | Promise<void>;
  /** Called by the cancel button, the button is rendered only when set */
  onCancel?: () => void;
  /** Renders a final `Review` step with a summary of the values */
  review?: (values: V) => React.ReactNode;
  /** Overrides of the default English button and step labels */
  labels?: Partial<WizardLabels>;
  /** Blocks navigation, cancel and the step content while the host is busy, for example saving a draft */
  busy?: boolean;
  /** Allows jumping to any step and finishing from any step, every visible step is validated on finish */
  nonLinear?: boolean;
  /** Keeps the stepper and the action buttons in place and scrolls only the step content; the parent must limit the height, as `WizardModal` does */
  scrollContent?: boolean;
  /** `auto` shows a vertical stepper when the wizard is at least 640px wide and a compact header otherwise, `auto` by default */
  orientation?: 'auto' | 'horizontal' | 'vertical';
  /** Class name added to the root element */
  className?: string;
  /** Inline styles added to the root element */
  style?: React.CSSProperties;
}

export const DEFAULT_WIZARD_LABELS: WizardLabels = {
  back: 'Back',
  next: 'Next',
  finish: 'Finish',
  cancel: 'Cancel',
  skip: 'Skip',
  review: 'Review',
  optional: 'Optional',
  stepCounter: 'Step {current} of {total}',
  error: 'Something went wrong',
  goToStep: 'Go to step',
};

export const WIZARD_REVIEW_STEP_ID = 'wizard-review';

const VERTICAL_MIN_WIDTH = 640;

function WizardInner<V>({
  steps,
  initialValues,
  values,
  onValuesChange,
  onComplete,
  onCancel,
  review,
  labels: labelsProp,
  nonLinear = false,
  busy = false,
  scrollContent = false,
  orientation = 'auto',
  className,
  style,
}: WizardProps<V>) {
  const labels = { ...DEFAULT_WIZARD_LABELS, ...labelsProp };
  const { ref, width } = useElementSize<HTMLDivElement>();
  const [isCompleting, setIsCompleting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLParagraphElement>(null);
  const focusedStepIdRef = useRef<string | undefined>(undefined);
  const headingId = useId();

  const allSteps = useMemo<WizardStep<V>[]>(
    () =>
      review
        ? [
            ...steps,
            {
              id: WIZARD_REVIEW_STEP_ID,
              label: labels.review,
              render: (ctx) => review(ctx.values),
            },
          ]
        : steps,
    [steps, review, labels.review]
  );

  const wizard = useWizard({
    steps: allSteps,
    initialValues,
    values,
    onValuesChange,
    nonLinear,
    busy,
  });
  const { activeStep, activeIndex, isFirst, isLast } = wizard;
  const counter = labels.stepCounter
    .replace('{current}', String(activeIndex + 1))
    .replace('{total}', String(wizard.steps.length));
  const isPending = wizard.isSubmitting || isCompleting;
  const isLocked = isPending || busy;
  const layout =
    orientation === 'auto' ? (width >= VERTICAL_MIN_WIDTH ? 'vertical' : 'compact') : orientation;

  useEffect(() => {
    const stepId = activeStep?.id;
    const previousStepId = focusedStepIdRef.current;
    focusedStepIdRef.current = stepId;
    if (previousStepId === undefined || previousStepId === stepId) {
      return;
    }
    (getFirstFocusable(contentRef.current) ?? headingRef.current ?? contentRef.current)?.focus();
  }, [activeStep?.id]);

  const advance = async (move: () => WizardNextResult | Promise<WizardNextResult>) => {
    if (isLocked) {
      return;
    }
    setFailure(null);
    try {
      const result = await move();
      if (result !== 'complete') {
        return;
      }
      setIsCompleting(true);
      await onComplete(wizard.values);
    } catch (error) {
      setFailure(getErrorMessage(error, labels.error));
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBack = () => {
    setFailure(null);
    wizard.back();
  };

  const stepper = layout !== 'compact' && (
    <Stepper
      active={activeIndex}
      orientation={layout}
      size="sm"
      onStepClick={(index) => {
        const target = wizard.steps[index];
        if (target) {
          setFailure(null);
          wizard.goTo(target.id);
        }
      }}
      className={layout === 'vertical' ? classes.nav : undefined}
    >
      {wizard.steps.map((step, index) => {
        const unverified =
          nonLinear && index < activeIndex && !wizard.completedStepIds.includes(step.id);
        return (
          <Stepper.Step
            key={step.id}
            label={step.label}
            description={step.optional ? labels.optional : step.description}
            icon={step.icon}
            completedIcon={unverified ? (step.icon ?? index + 1) : undefined}
            color={unverified ? 'gray' : undefined}
            data-unverified={unverified || undefined}
            allowStepSelect={!isLocked && wizard.canGoTo(step.id)}
          />
        );
      })}
    </Stepper>
  );

  const body = (
    <Stack gap="md" className={classes.body}>
      {layout === 'compact' && activeStep && (
        <Stack gap={6}>
          <Group gap={6} wrap="nowrap">
            <Text size="xs" c="dimmed" className={classes.counter}>
              {counter}
            </Text>
            <Text size="xs" c="dimmed">
              ·
            </Text>
            <Text
              ref={headingRef}
              id={headingId}
              tabIndex={-1}
              size="sm"
              fw={500}
              truncate
              className={classes.focusTarget}
            >
              {activeStep.label}
            </Text>
            {nonLinear && (
              <Menu position="bottom-start" withinPortal>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    aria-label={labels.goToStep}
                    disabled={isLocked}
                  >
                    <IconChevronDown size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {wizard.steps.map((step, index) => (
                    <Menu.Item
                      key={step.id}
                      disabled={step.id === activeStep.id}
                      onClick={() => {
                        setFailure(null);
                        wizard.goTo(step.id);
                      }}
                    >
                      {index + 1}. {step.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
          <Progress
            size="xs"
            value={((activeIndex + 1) / wizard.steps.length) * 100}
            aria-label={counter}
          />
          {(activeStep.description || activeStep.optional) && (
            <Text size="xs" c="dimmed">
              {activeStep.optional ? labels.optional : activeStep.description}
            </Text>
          )}
        </Stack>
      )}

      {layout !== 'compact' && activeStep && (
        <VisuallyHidden id={headingId}>{activeStep.label}</VisuallyHidden>
      )}
      <Stack gap="md" className={classes.scrollArea} data-step-scroll>
        <Box
          ref={contentRef}
          tabIndex={-1}
          aria-labelledby={activeStep ? headingId : undefined}
          role="group"
          data-step={activeStep?.id}
          className={classes.focusTarget}
        >
          <Fieldset variant="unstyled" disabled={busy} className={classes.fieldset}>
            {activeStep?.render(wizard.context)}
          </Fieldset>
        </Box>

        {failure && (
          <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
            {failure}
          </Alert>
        )}
      </Stack>

      <Divider />
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Box>
          {onCancel && (
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              onClick={onCancel}
              disabled={isCompleting || busy}
            >
              {labels.cancel}
            </Button>
          )}
        </Box>
        <Group gap="xs" wrap="nowrap">
          {activeStep?.optional && (
            <Button
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => advance(wizard.skip)}
              disabled={isLocked}
            >
              {labels.skip}
            </Button>
          )}
          {!isFirst && (
            <Button variant="default" size="sm" onClick={handleBack} disabled={isLocked}>
              {labels.back}
            </Button>
          )}
          {nonLinear && !isLast ? (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => advance(wizard.next)}
                disabled={isLocked}
              >
                {labels.next}
              </Button>
              <Button
                size="sm"
                onClick={() => advance(wizard.finish)}
                loading={isPending}
                disabled={busy}
              >
                {labels.finish}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => advance(nonLinear ? wizard.finish : wizard.next)}
              loading={isPending}
              disabled={busy}
            >
              {isLast ? labels.finish : labels.next}
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );

  return (
    <Box
      ref={ref}
      className={cx(classes.root, className)}
      style={style}
      data-layout={layout}
      data-scroll-content={scrollContent || undefined}
    >
      <Box className={classes.frame}>
        {stepper}
        {body}
      </Box>
    </Box>
  );
}

/** Multi-step flow with per-step validation, conditional steps and an optional review step */
export const Wizard = memo(WizardInner) as unknown as (<V>(
  props: WizardProps<V>
) => React.ReactElement) & {
  displayName?: string;
};

Wizard.displayName = 'Wizard';
