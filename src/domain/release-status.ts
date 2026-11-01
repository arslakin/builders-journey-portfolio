// Release verification is a local aggregation of four required command outcomes.
// This module performs no command execution, I/O, logging, or environment access.

/** Required release checks in deterministic diagnostic order. */
export const requiredReleaseChecks = Object.freeze([
  'productionBuild',
  'lint',
  'automatedTests',
  'automatedAccessibility',
] as const);

export type ReleaseCheck = (typeof requiredReleaseChecks)[number];

/**
 * One required command outcome. Failure details must already be safe to report;
 * the aggregator preserves them without including command output or other data.
 */
export type ReleaseCheckOutcome =
  | { readonly status: 'passed' }
  | { readonly status: 'failed'; readonly detail: string };

/** Every outcome required to decide whether release verification passed. */
export interface ReleaseOutcomes {
  readonly productionBuild: ReleaseCheckOutcome;
  readonly lint: ReleaseCheckOutcome;
  readonly automatedTests: ReleaseCheckOutcome;
  readonly automatedAccessibility: ReleaseCheckOutcome;
}

/** A failed check paired with its original safe diagnostic detail. */
export interface ReleaseFailure {
  readonly check: ReleaseCheck;
  readonly detail: string;
}

type NonEmptyReadonlyArray<Value> = readonly [Value, ...Value[]];

/**
 * The aggregate result. A failed result always carries at least one individual
 * failure, while a passed result cannot carry stale failure diagnostics.
 */
export type ReleaseStatus =
  | {
      readonly status: 'passed';
      readonly failures: readonly [];
    }
  | {
      readonly status: 'failed';
      readonly failures: NonEmptyReadonlyArray<ReleaseFailure>;
    };

/**
 * Reports passed only when all four required outcomes pass. The function is
 * deterministic and does not mutate its input.
 */
export function aggregateReleaseStatus(outcomes: ReleaseOutcomes): ReleaseStatus {
  const failures: ReleaseFailure[] = [];

  for (const check of requiredReleaseChecks) {
    const outcome = outcomes[check];

    if (outcome.status === 'failed') {
      failures.push(
        Object.freeze({
          check,
          detail: outcome.detail,
        }),
      );
    }
  }

  const [firstFailure, ...remainingFailures] = failures;

  if (firstFailure === undefined) {
    const noFailures: [] = [];

    return Object.freeze({
      status: 'passed',
      failures: Object.freeze(noFailures),
    });
  }

  const nonEmptyFailures: [ReleaseFailure, ...ReleaseFailure[]] = [
    firstFailure,
    ...remainingFailures,
  ];

  return Object.freeze({
    status: 'failed',
    failures: Object.freeze(nonEmptyFailures),
  });
}
