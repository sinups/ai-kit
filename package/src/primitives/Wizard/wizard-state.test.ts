import {
  canNavigateTo,
  findFirstInvalidStep,
  getVisibleSteps,
  hasWizardErrors,
  normalizeWizardErrors,
  resolveActiveIndex,
  withoutErrorKeys,
  type WizardStep,
} from './wizard-state';

type Values = { kind: 'local' | 'remote' };

const render = () => null;
const STEPS: WizardStep<Values>[] = [
  { id: 'kind', label: 'Kind', render },
  { id: 'url', label: 'URL', when: (values) => values.kind === 'remote', render },
  { id: 'command', label: 'Command', when: (values) => values.kind === 'local', render },
  { id: 'name', label: 'Name', render },
];

const LOCAL: Values = { kind: 'local' };
const REMOTE: Values = { kind: 'remote' };

const ids = (steps: WizardStep<Values>[]) => steps.map((step) => step.id);

describe('primitives/wizard-state', () => {
  it('filters steps by `when`', () => {
    expect(ids(getVisibleSteps(STEPS, REMOTE))).toEqual(['kind', 'url', 'name']);
    expect(ids(getVisibleSteps(STEPS, LOCAL))).toEqual(['kind', 'command', 'name']);
  });

  it('resolves the active index and falls back when the active step is hidden', () => {
    const visible = getVisibleSteps(STEPS, LOCAL);
    expect(resolveActiveIndex(STEPS, visible, 'name')).toBe(2);
    expect(resolveActiveIndex(STEPS, visible, 'url')).toBe(0);
    expect(resolveActiveIndex(STEPS, visible, 'missing')).toBe(0);
    expect(resolveActiveIndex(STEPS, [], 'kind')).toBe(-1);
  });

  it('allows going back freely and forward only across completed steps', () => {
    const visible = getVisibleSteps(STEPS, REMOTE);
    expect(canNavigateTo(visible, 2, [], 'kind')).toBe(true);
    expect(canNavigateTo(visible, 2, [], 'name')).toBe(false);
    expect(canNavigateTo(visible, 0, ['kind'], 'url')).toBe(true);
    expect(canNavigateTo(visible, 0, ['kind'], 'name')).toBe(false);
    expect(canNavigateTo(visible, 0, ['kind', 'url'], 'name')).toBe(true);
    expect(canNavigateTo(visible, 0, ['kind', 'url'], 'command')).toBe(false);
  });

  it('allows any visible step when non-linear', () => {
    const visible = getVisibleSteps(STEPS, REMOTE);
    expect(canNavigateTo(visible, 0, [], 'name', true)).toBe(true);
    expect(canNavigateTo(visible, 0, [], 'url', true)).toBe(true);
    expect(canNavigateTo(visible, 0, [], 'kind', true)).toBe(false);
    expect(canNavigateTo(visible, 0, [], 'command', true)).toBe(false);
  });

  it('finds the first invalid step in order', async () => {
    const steps: WizardStep<Values>[] = [
      { id: 'a', label: 'A', render, validate: () => null },
      { id: 'b', label: 'B', render, validate: async () => ({ url: 'Bad url', empty: '' }) },
      { id: 'c', label: 'C', render, validate: () => ({ name: 'Required' }) },
    ];
    expect(await findFirstInvalidStep(steps, REMOTE)).toEqual({
      stepId: 'b',
      errors: { url: 'Bad url' },
    });
    expect(await findFirstInvalidStep(steps.slice(0, 1), REMOTE)).toBeNull();
  });

  it('normalizes and edits errors', () => {
    expect(normalizeWizardErrors(null)).toEqual({});
    const errors = normalizeWizardErrors({ name: 'Required', url: '' });
    expect(errors).toEqual({ name: 'Required' });
    expect(hasWizardErrors(errors)).toBe(true);
    expect(withoutErrorKeys(errors, ['url'])).toBe(errors);
    expect(withoutErrorKeys(errors, ['name'])).toEqual({});
  });
});
