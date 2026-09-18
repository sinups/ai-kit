import { getToolApprovalOutcomeText } from './tool-approvals';

describe('approvals/outcome scope', () => {
  it('names the scope by the labels of the host', () => {
    expect(
      getToolApprovalOutcomeText({
        outcome: { decision: 'approved', scope: 'once' },
        labels: { approved: 'Разрешено', scopes: { once: 'один раз' } },
      })
    ).toBe('Разрешено · один раз');
  });

  it('prefers the scope labels over the label of the approve option', () => {
    expect(
      getToolApprovalOutcomeText({
        outcome: { decision: 'approved', scope: 'session' },
        approveOptions: [{ value: 'session', label: 'Разрешить в этом чате' }],
        labels: { approved: 'Разрешено', scopes: { session: 'в этом чате' } },
      })
    ).toBe('Разрешено · в этом чате');
  });

  it('falls back to the label of the matching approve option', () => {
    expect(
      getToolApprovalOutcomeText({
        outcome: { decision: 'approved', scope: 'session' },
        approveOptions: [{ value: 'session', label: 'до конца сессии' }],
        labels: { approved: 'Разрешено' },
      })
    ).toBe('Разрешено · до конца сессии');
  });

  it('keeps an unknown scope as it is', () => {
    expect(
      getToolApprovalOutcomeText({ outcome: { decision: 'approved', scope: 'project' } })
    ).toBe('Approved · project');
  });
});
