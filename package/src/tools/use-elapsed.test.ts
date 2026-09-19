import type { ToolPart } from '../types';
import { getReportedDuration, getReportedRunDuration, getReportedStart } from './use-elapsed';

function part(extra: Partial<ToolPart>): ToolPart {
  return { type: 'tool-Thinking', toolCallId: 't1', state: 'output-available', ...extra };
}

describe('tools/reported timing', () => {
  it('reads the output first, then durationMs, then endedAt minus the start', () => {
    const custom = { startedAt: 1_000, durationMs: 5_000, endedAt: 9_000 };
    expect(
      getReportedDuration(
        part({ output: { duration_ms: 2_000 }, callProviderMetadata: { custom } })
      )
    ).toBe(2_000);
    expect(getReportedDuration(part({ output: 'text', callProviderMetadata: { custom } }))).toBe(
      5_000
    );
    expect(
      getReportedDuration(
        part({
          output: 'text',
          callProviderMetadata: { custom: { startedAt: 1_000, endedAt: 9_000 } },
        })
      )
    ).toBe(8_000);
  });

  it('needs a start for endedAt and ignores empty or backward times', () => {
    expect(
      getReportedDuration(part({ callProviderMetadata: { custom: { endedAt: 9_000 } } }))
    ).toBe(undefined);
    expect(
      getReportedDuration(
        part({ callProviderMetadata: { custom: { startedAt: 9_000, endedAt: 1_000 } } })
      )
    ).toBe(undefined);
    expect(getReportedDuration(part({ callProviderMetadata: { custom: { durationMs: 0 } } }))).toBe(
      undefined
    );
    expect(getReportedStart(part({ startedAt: 3_000 }))).toBe(3_000);
  });

  it('spans a run from the first start to the last end, else sums the durations', () => {
    const at = (startedAt: number, durationMs: number) =>
      part({ callProviderMetadata: { custom: { startedAt, durationMs } } });
    expect(getReportedRunDuration([at(1_000, 2_000), at(5_000, 3_000)])).toBe(7_000);
    expect(
      getReportedRunDuration([
        part({ output: { duration: 2_000 } }),
        part({ output: { totalDurationMs: 3_000 } }),
      ])
    ).toBe(5_000);
    expect(getReportedRunDuration([part({})])).toBe(undefined);
  });
});
