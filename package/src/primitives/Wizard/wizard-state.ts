import type { ReactNode } from 'react';

export type WizardErrors = Record<string, string>;

export interface WizardStepContext<V> {
  /** Current values of the whole wizard */
  values: V;
  /** Sets one value */
  setValue: <K extends keyof V>(key: K, value: V[K]) => void;
  /** Merges a partial patch into the values */
  setValues: (patch: Partial<V>) => void;
  /** Errors returned by the last validation of the active step, keyed by field */
  errors: WizardErrors;
  /** Moves to a visited step, ignored for steps that were not reached yet */
  goTo: (stepId: string) => void;
  /** Whether the step is the first visible one */
  isFirst: boolean;
  /** Whether the step is the last visible one */
  isLast: boolean;
}

export interface WizardStep<V> {
  /** Stable step identifier */
  id: string;
  /** Step title shown in the stepper and the compact header */
  label: string;
  /** Secondary text under the label */
  description?: string;
  /** Icon shown in the stepper instead of the step number */
  icon?: ReactNode;
  /** Marks the step as optional in the stepper */
  optional?: boolean;
  /** Step is shown only when it returns true, always shown when omitted */
  when?: (values: V) => boolean;
  /** Returns field errors that block moving forward, `null` or `{}` when the step is valid */
  validate?: (values: V) => WizardErrors | null | Promise<WizardErrors | null>;
  /** Renders the step content */
  render: (ctx: WizardStepContext<V>) => ReactNode;
}

export function getVisibleSteps<V>(steps: WizardStep<V>[], values: V): WizardStep<V>[] {
  return steps.filter((step) => !step.when || step.when(values));
}

/** Index of the active step among visible steps; a hidden active step falls back to the closest visible step before it */
export function resolveActiveIndex<V>(
  steps: WizardStep<V>[],
  visible: WizardStep<V>[],
  activeId: string | null
): number {
  if (visible.length === 0) {
    return -1;
  }
  const visibleIndex = visible.findIndex((step) => step.id === activeId);
  if (visibleIndex !== -1) {
    return visibleIndex;
  }
  const originalIndex = steps.findIndex((step) => step.id === activeId);
  if (originalIndex === -1) {
    return 0;
  }
  let fallback = 0;
  visible.forEach((step, index) => {
    if (steps.indexOf(step) < originalIndex) {
      fallback = index;
    }
  });
  return fallback;
}

export function canNavigateTo<V>(
  visible: WizardStep<V>[],
  activeIndex: number,
  completedStepIds: readonly string[],
  targetId: string,
  nonLinear = false
): boolean {
  const targetIndex = visible.findIndex((step) => step.id === targetId);
  if (targetIndex === -1 || targetIndex === activeIndex) {
    return false;
  }
  if (nonLinear || targetIndex < activeIndex) {
    return true;
  }
  return visible
    .slice(activeIndex, targetIndex)
    .every((step) => completedStepIds.includes(step.id));
}

export function normalizeWizardErrors(errors: WizardErrors | null | undefined): WizardErrors {
  const result: WizardErrors = {};
  for (const [key, message] of Object.entries(errors ?? {})) {
    if (message) {
      result[key] = message;
    }
  }
  return result;
}

export function hasWizardErrors(errors: WizardErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function withoutErrorKeys(errors: WizardErrors, keys: readonly string[]): WizardErrors {
  if (!keys.some((key) => key in errors)) {
    return errors;
  }
  const next = { ...errors };
  for (const key of keys) {
    delete next[key];
  }
  return next;
}

export interface WizardStepFailure {
  stepId: string;
  errors: WizardErrors;
}

/** Validates steps in order and returns the first one with errors, `null` when all are valid */
export async function findFirstInvalidStep<V>(
  steps: WizardStep<V>[],
  values: V
): Promise<WizardStepFailure | null> {
  for (const step of steps) {
    const errors = normalizeWizardErrors(await step.validate?.(values));
    if (hasWizardErrors(errors)) {
      return { stepId: step.id, errors };
    }
  }
  return null;
}
