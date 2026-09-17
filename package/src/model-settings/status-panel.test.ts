import { countMcpStatuses } from './status-panel';

describe('model-settings/status-panel', () => {
  it('counts servers per status in a stable order', () => {
    expect(
      countMcpStatuses([
        { name: 'a', status: 'error' },
        { name: 'b', status: 'success' },
        { name: 'c', status: 'success' },
        { name: 'd', status: 'needs-auth' },
      ])
    ).toEqual([
      { status: 'success', count: 2 },
      { status: 'needs-auth', count: 1 },
      { status: 'error', count: 1 },
    ]);
    expect(countMcpStatuses([])).toEqual([]);
  });
});
