import { describe, expect, it } from 'vitest';
import {
  aggregateReleaseStatus,
  type ReleaseCheckOutcome,
  type ReleaseOutcomes,
} from './release-status.ts';

const passed = { status: 'passed' } as const satisfies ReleaseCheckOutcome;

function outcomesWith(
  changes: Partial<ReleaseOutcomes> = {},
): ReleaseOutcomes {
  return {
    productionBuild: passed,
    lint: passed,
    automatedTests: passed,
    automatedAccessibility: passed,
    ...changes,
  };
}

describe('release-status aggregation smoke', () => {
  it('reports passed when all four required outcomes pass', () => {
    expect(aggregateReleaseStatus(outcomesWith())).toEqual({
      status: 'passed',
      failures: [],
    });
  });

  it('reports a failed check with its safe diagnostic detail intact', () => {
    const detail = 'Lint exited unsuccessfully; inspect the local lint report.';

    expect(
      aggregateReleaseStatus(
        outcomesWith({ lint: { status: 'failed', detail } }),
      ),
    ).toEqual({
      status: 'failed',
      failures: [{ check: 'lint', detail }],
    });
  });
});
