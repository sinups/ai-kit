import { getApproveModeLabel, getCollapsedPlanHeight, getPlanFileName } from './plan-approval';

describe('message-actions/plan-approval', () => {
  it('builds the plan file name', () => {
    expect(getPlanFileName({})).toBe('plan-working.md');
    expect(getPlanFileName({ id: ' auth ' })).toBe('plan-auth.md');
    expect(getPlanFileName({ id: 'notes.md' })).toBe('notes.md');
  });

  it('converts lines to the collapsed height', () => {
    expect(getCollapsedPlanHeight(8)).toBe(176);
    expect(getCollapsedPlanHeight(0, 20)).toBe(20);
  });

  it('resolves the approval mode label', () => {
    const options = [{ value: 'auto', label: 'Auto-accept edits' }];
    expect(getApproveModeLabel(options, 'auto')).toBe('Auto-accept edits');
    expect(getApproveModeLabel(options, 'custom')).toBe('custom');
    expect(getApproveModeLabel(options, undefined)).toBeUndefined();
    expect(getApproveModeLabel(undefined, 'auto')).toBe('auto');
  });
});
