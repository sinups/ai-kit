import { getTurnSummarySegments } from './turn-summary';

describe('turn-summary', () => {
  it('builds the summary segments', () => {
    expect(
      getTurnSummarySegments({
        durationMs: 123_000,
        tokens: 40_000,
        tokenBudget: 100_000,
        backgroundTasks: 2,
      })
    ).toEqual(['Took 2m 3s', '40k / 100k', '2 tasks left running']);
    expect(getTurnSummarySegments({ durationMs: 5000, tokens: 1200 })).toEqual([
      'Took 5s',
      '1.2k tokens',
    ]);
  });
});
