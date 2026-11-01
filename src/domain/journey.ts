import type { VerifiedText, VerifiedValue } from './verified.ts';

/** The complete Journey_Stage order, represented as a fixed tuple. */
export const journeyStageOrder = ['teaching', 'cloud', 'ai'] as const;

export type JourneyStageId = (typeof journeyStageOrder)[number];

export const journeyStageLabels = {
  teaching: 'Teaching',
  cloud: 'Cloud',
  ai: 'AI',
} as const satisfies Record<JourneyStageId, string>;

export type JourneyStageLabel = (typeof journeyStageLabels)[JourneyStageId];

/** A stage ID determines its one permitted visible label. */
export interface JourneyStage<StageId extends JourneyStageId = JourneyStageId> {
  readonly id: StageId;
  readonly label: (typeof journeyStageLabels)[StageId];
  readonly content: VerifiedValue<VerifiedText>;
}

/** Owner-approved stage records in the only valid presentation order. */
export type JourneyStageTuple = readonly [
  JourneyStage<'teaching'>,
  JourneyStage<'cloud'>,
  JourneyStage<'ai'>,
];

export interface JourneyState {
  readonly activeStage: JourneyStageId;
}

export type JourneyAction = {
  readonly type: 'activate';
  readonly stage: JourneyStageId;
};

/** Stable, content-free diagnostics returned by journey-stage validation. */
export const journeyValidationMessages = {
  JNY001: 'Journey stages must contain exactly three records.',
  JNY002: 'A journey stage record is required at this position.',
  JNY003: 'Journey stage IDs must follow teaching, cloud, ai order.',
  JNY004: 'Journey stage labels must follow Teaching, Cloud, AI order.',
  JNY005: 'Journey content must provide a non-empty owner-approved text value.',
  JNY006: 'Journey content must include owner approval metadata.',
  JNY007: 'Journey content must include a non-empty verification source note.',
} as const;

export type JourneyValidationCode = keyof typeof journeyValidationMessages;

export interface JourneyValidationDiagnostic {
  readonly code: JourneyValidationCode;
  readonly path: string;
  readonly message: (typeof journeyValidationMessages)[JourneyValidationCode];
}

type NonEmptyDiagnostics = readonly [
  JourneyValidationDiagnostic,
  ...JourneyValidationDiagnostic[],
];

/** A successful result carries the validated fixed tuple; failures carry no content. */
export type JourneyValidationResult =
  | {
      readonly status: 'valid';
      readonly value: JourneyStageTuple;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: 'invalid';
      readonly diagnostics: NonEmptyDiagnostics;
    };

const noJourneyDiagnostics: readonly [] = Object.freeze([]);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createJourneyDiagnostic(
  code: JourneyValidationCode,
  path: string,
): JourneyValidationDiagnostic {
  return Object.freeze({
    code,
    path,
    message: journeyValidationMessages[code],
  });
}

function validateJourneyContent(
  candidate: unknown,
  path: string,
  diagnostics: JourneyValidationDiagnostic[],
): void {
  if (!isRecord(candidate)) {
    diagnostics.push(createJourneyDiagnostic('JNY005', `${path}.content`));
    return;
  }

  const value = candidate['value'];
  if (typeof value !== 'string' || value.trim().length === 0) {
    diagnostics.push(createJourneyDiagnostic('JNY005', `${path}.content.value`));
  }

  const verification = candidate['verification'];
  if (!isRecord(verification) || verification['approvedByOwner'] !== true) {
    diagnostics.push(
      createJourneyDiagnostic(
        'JNY006',
        `${path}.content.verification.approvedByOwner`,
      ),
    );
  }

  if (
    !isRecord(verification) ||
    typeof verification['sourceNote'] !== 'string' ||
    verification['sourceNote'].trim().length === 0
  ) {
    diagnostics.push(
      createJourneyDiagnostic(
        'JNY007',
        `${path}.content.verification.sourceNote`,
      ),
    );
  }
}

/**
 * Validates the complete runtime boundary for Journey_Stage records.
 * Diagnostics identify only structural field paths and never include supplied content.
 */
export function validateJourneyStages(candidate: unknown): JourneyValidationResult {
  if (!Array.isArray(candidate)) {
    const diagnostics = Object.freeze([
      createJourneyDiagnostic('JNY001', 'journeyStages'),
    ] as const);

    return Object.freeze({
      status: 'invalid',
      diagnostics,
    });
  }

  const stages: readonly unknown[] = candidate;
  const diagnostics: JourneyValidationDiagnostic[] = [];

  if (stages.length !== journeyStageOrder.length) {
    diagnostics.push(createJourneyDiagnostic('JNY001', 'journeyStages'));
  }

  journeyStageOrder.forEach((expectedId, index) => {
    const path = `journeyStages[${String(index)}]`;
    const stage = stages[index];

    if (!isRecord(stage)) {
      diagnostics.push(createJourneyDiagnostic('JNY002', path));
      return;
    }

    if (stage['id'] !== expectedId) {
      diagnostics.push(createJourneyDiagnostic('JNY003', `${path}.id`));
    }

    if (stage['label'] !== journeyStageLabels[expectedId]) {
      diagnostics.push(createJourneyDiagnostic('JNY004', `${path}.label`));
    }

    validateJourneyContent(stage['content'], path, diagnostics);
  });

  const [firstDiagnostic, ...remainingDiagnostics] = diagnostics;
  if (firstDiagnostic !== undefined) {
    const nonEmptyDiagnostics: [
      JourneyValidationDiagnostic,
      ...JourneyValidationDiagnostic[],
    ] = [firstDiagnostic, ...remainingDiagnostics];

    return Object.freeze({
      status: 'invalid',
      diagnostics: Object.freeze(nonEmptyDiagnostics),
    });
  }

  const value = Object.freeze([
    stages[0] as JourneyStage<'teaching'>,
    stages[1] as JourneyStage<'cloud'>,
    stages[2] as JourneyStage<'ai'>,
  ]) satisfies JourneyStageTuple;

  return Object.freeze({
    status: 'valid',
    value,
    diagnostics: noJourneyDiagnostics,
  });
}

/** State used before any visitor activation. */
export const initialJourneyState = Object.freeze({
  activeStage: 'teaching',
}) satisfies JourneyState;

/**
 * Applies exact stage activation without mutating prior state. Repeating the
 * active stage returns the same object, making repeated activation idempotent.
 */
export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  if (action.stage === state.activeStage) {
    return state;
  }

  return Object.freeze({ activeStage: action.stage });
}

/**
 * Derives the displayed value directly from the validated immutable records.
 * No content is copied, transformed, cached in state, or replaced by fallback text.
 */
export function selectActiveJourneyContent(
  stages: JourneyStageTuple,
  state: JourneyState,
): VerifiedValue<VerifiedText> {
  switch (state.activeStage) {
    case 'teaching':
      return stages[0].content;
    case 'cloud':
      return stages[1].content;
    case 'ai':
      return stages[2].content;
  }
}
