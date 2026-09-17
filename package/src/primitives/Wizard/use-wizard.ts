import { useCallback, useMemo, useRef, useState } from 'react';
import {
  canNavigateTo,
  findFirstInvalidStep,
  getVisibleSteps,
  hasWizardErrors,
  normalizeWizardErrors,
  resolveActiveIndex,
  withoutErrorKeys,
  type WizardErrors,
  type WizardStep,
  type WizardStepContext,
} from './wizard-state';

function removeId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : ids;
}

export type WizardNextResult = 'invalid' | 'next' | 'complete';

export interface UseWizardOptions<V> {
  /** All steps in order, including conditional ones */
  steps: WizardStep<V>[];
  /** Values used when `values` is not controlled */
  initialValues: V;
  /** Controlled values */
  values?: V;
  /** Called with the next values on every change */
  onValuesChange?: (values: V) => void;
  /** Allows jumping to any visible step and finishing from any step, for editing existing values */
  nonLinear?: boolean;
  /** Blocks every navigation while the host is doing work outside the wizard */
  busy?: boolean;
}

export interface UseWizardReturn<V> {
  /** Steps visible for the current values */
  steps: WizardStep<V>[];
  /** Active step, `undefined` only when no step is visible */
  activeStep: WizardStep<V> | undefined;
  /** Index of the active step among visible steps */
  activeIndex: number;
  values: V;
  setValue: <K extends keyof V>(key: K, value: V[K]) => void;
  setValues: (patch: Partial<V>) => void;
  /** Errors of the last failed validation */
  errors: WizardErrors;
  /** Ids of steps that passed validation and were not edited since */
  completedStepIds: string[];
  /** Ids of optional steps skipped without validation */
  skippedStepIds: string[];
  isFirst: boolean;
  isLast: boolean;
  /** True while an async `validate` is running */
  isSubmitting: boolean;
  /** Validates the active step and moves forward, resolves to `complete` on the last step */
  next: () => Promise<WizardNextResult>;
  /** Validates every visible step in order; moves to the first invalid step, or resolves to `complete` */
  finish: () => Promise<WizardNextResult>;
  /** Whether any visible step can be reached and the wizard can be finished from any step */
  nonLinear: boolean;
  /** Moves past an optional step without validation, resolves to `complete` on the last step */
  skip: () => WizardNextResult;
  back: () => void;
  /** Moves to a visited step, returns false when the step cannot be reached */
  goTo: (stepId: string) => boolean;
  canGoTo: (stepId: string) => boolean;
  /** Context passed to `step.render` */
  context: WizardStepContext<V>;
}

export function useWizard<V>({
  steps,
  initialValues,
  values: controlledValues,
  onValuesChange,
  nonLinear = false,
  busy = false,
}: UseWizardOptions<V>): UseWizardReturn<V> {
  const [uncontrolledValues, setUncontrolledValues] = useState(initialValues);
  const values = controlledValues ?? uncontrolledValues;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const [activeId, setActiveId] = useState<string | null>(() => {
    return getVisibleSteps(steps, initialValues)[0]?.id ?? null;
  });
  const [errors, setErrors] = useState<WizardErrors>({});
  const [completedStepIds, setCompletedStepIds] = useState<string[]>([]);
  const [skippedStepIds, setSkippedStepIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const isLocked = () => submittingRef.current || busyRef.current;

  const visible = useMemo(() => getVisibleSteps(steps, values), [steps, values]);
  const activeIndex = resolveActiveIndex(steps, visible, activeId);
  const activeStep = visible[activeIndex];
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex === visible.length - 1;

  const applyValues = useCallback(
    (patch: Partial<V>) => {
      const nextValues = { ...valuesRef.current, ...patch };
      valuesRef.current = nextValues;
      if (controlledValues === undefined) {
        setUncontrolledValues(nextValues);
      }
      onValuesChange?.(nextValues);
      setErrors((prev) => withoutErrorKeys(prev, Object.keys(patch)));
      if (activeStep) {
        setCompletedStepIds((prev) => removeId(prev, activeStep.id));
        setSkippedStepIds((prev) => removeId(prev, activeStep.id));
      }
    },
    [controlledValues, onValuesChange, activeStep]
  );

  const setValue = useCallback(
    <K extends keyof V>(key: K, value: V[K]) =>
      applyValues({ [key]: value } as unknown as Partial<V>),
    [applyValues]
  );

  const canGoTo = useCallback(
    (stepId: string) =>
      !busy &&
      canNavigateTo(
        visible,
        activeIndex,
        [...completedStepIds, ...skippedStepIds],
        stepId,
        nonLinear
      ),
    [visible, activeIndex, completedStepIds, skippedStepIds, nonLinear, busy]
  );

  const goTo = useCallback(
    (stepId: string) => {
      if (isLocked() || !canGoTo(stepId)) {
        return false;
      }
      setErrors({});
      setActiveId(stepId);
      return true;
    },
    [canGoTo]
  );

  const back = useCallback(() => {
    if (isLocked() || activeIndex <= 0) {
      return;
    }
    setErrors({});
    setActiveId(visible[activeIndex - 1].id);
  }, [visible, activeIndex]);

  const advanceFrom = useCallback(
    (stepId: string): WizardNextResult => {
      const nextVisible = getVisibleSteps(steps, valuesRef.current);
      const nextIndex = nextVisible.findIndex((step) => step.id === stepId) + 1;
      if (nextIndex === 0 || nextIndex >= nextVisible.length) {
        return 'complete';
      }
      setActiveId(nextVisible[nextIndex].id);
      return 'next';
    },
    [steps]
  );

  const skip = useCallback((): WizardNextResult => {
    if (isLocked() || !activeStep?.optional) {
      return 'invalid';
    }
    setErrors({});
    setCompletedStepIds((prev) => removeId(prev, activeStep.id));
    setSkippedStepIds((prev) => (prev.includes(activeStep.id) ? prev : [...prev, activeStep.id]));
    return advanceFrom(activeStep.id);
  }, [activeStep, advanceFrom]);

  const next = useCallback(async (): Promise<WizardNextResult> => {
    if (isLocked() || !activeStep) {
      return 'invalid';
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const stepErrors = normalizeWizardErrors(await activeStep.validate?.(valuesRef.current));
      setErrors(stepErrors);
      if (hasWizardErrors(stepErrors)) {
        return 'invalid';
      }
      setCompletedStepIds((prev) =>
        prev.includes(activeStep.id) ? prev : [...prev, activeStep.id]
      );
      setSkippedStepIds((prev) => removeId(prev, activeStep.id));
      return advanceFrom(activeStep.id);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [activeStep, advanceFrom]);

  const finish = useCallback(async (): Promise<WizardNextResult> => {
    if (isLocked()) {
      return 'invalid';
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const currentSteps = getVisibleSteps(steps, valuesRef.current);
      const failure = await findFirstInvalidStep(currentSteps, valuesRef.current);
      if (failure) {
        setActiveId(failure.stepId);
        setErrors(failure.errors);
        return 'invalid';
      }
      setErrors({});
      setSkippedStepIds([]);
      setCompletedStepIds(currentSteps.map((step) => step.id));
      return 'complete';
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [steps]);

  const context = useMemo<WizardStepContext<V>>(
    () => ({
      values,
      setValue,
      setValues: applyValues,
      errors,
      goTo: (stepId: string) => {
        goTo(stepId);
      },
      isFirst,
      isLast,
    }),
    [values, setValue, applyValues, errors, goTo, isFirst, isLast]
  );

  return {
    steps: visible,
    activeStep,
    activeIndex,
    values,
    setValue,
    setValues: applyValues,
    errors,
    completedStepIds: completedStepIds.filter((id) => visible.some((step) => step.id === id)),
    skippedStepIds: skippedStepIds.filter((id) => visible.some((step) => step.id === id)),
    isFirst,
    isLast,
    isSubmitting,
    next,
    finish,
    nonLinear,
    skip,
    back,
    goTo,
    canGoTo,
    context,
  };
}
