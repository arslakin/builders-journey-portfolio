import { describe, expect, it } from 'vitest';
import {
  initialJourneyState,
  journeyReducer,
  selectActiveJourneyContent,
  validateJourneyStages,
  type JourneyStageTuple,
} from './journey.ts';
import type { VerifiedText, VerifiedValue } from './verified.ts';

function verifiedText(value: string): VerifiedValue<VerifiedText> {
  return Object.freeze({
    value: value as VerifiedText,
    verification: Object.freeze({
      approvedByOwner: true,
      sourceNote: 'test-only fixture',
    }),
  });
}

const stages = Object.freeze([
  Object.freeze({
    id: 'teaching',
    label: 'Teaching',
    content: verifiedText('test-only-teaching-content'),
  }),
  Object.freeze({
    id: 'cloud',
    label: 'Cloud',
    content: verifiedText('test-only-cloud-content'),
  }),
  Object.freeze({
    id: 'ai',
    label: 'AI',
    content: verifiedText('test-only-ai-content'),
  }),
]) satisfies JourneyStageTuple;

describe('journey domain smoke', () => {
  it('validates the fixed stage order without replacing immutable records', () => {
    const result = validateJourneyStages(stages);

    expect(result.status).toBe('valid');
    if (result.status !== 'valid') {
      throw new Error('Expected the test-only journey tuple to be valid.');
    }

    expect(result.value.map(({ label }) => label)).toEqual([
      'Teaching',
      'Cloud',
      'AI',
    ]);
    expect(Object.isFrozen(result.value)).toBe(true);
    expect(result.value[0]).toBe(stages[0]);
  });

  it('returns field-path diagnostics without echoing rejected values', () => {
    const rejectedValue = 'test-only-do-not-echo';
    const result = validateJourneyStages([
      {
        ...stages[0],
        id: rejectedValue,
        label: rejectedValue,
        content: {
          value: rejectedValue,
          verification: {
            approvedByOwner: false,
            sourceNote: '',
          },
        },
      },
      stages[1],
      stages[2],
    ]);

    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') {
      throw new Error('Expected malformed test-only journey data to be rejected.');
    }

    expect(result.diagnostics.map(({ code }) => code)).toEqual([
      'JNY003',
      'JNY004',
      'JNY006',
      'JNY007',
    ]);
    expect(result.diagnostics.map(({ path }) => path).every(Boolean)).toBe(true);
    expect(JSON.stringify(result.diagnostics)).not.toContain(rejectedValue);
  });

  it('selects exact approved content and makes repeated activation idempotent', () => {
    const selected = journeyReducer(initialJourneyState, {
      type: 'activate',
      stage: 'ai',
    });

    expect(initialJourneyState.activeStage).toBe('teaching');
    expect(selected).toEqual({ activeStage: 'ai' });
    expect(selectActiveJourneyContent(stages, selected)).toBe(stages[2].content);
    expect(
      journeyReducer(selected, { type: 'activate', stage: 'ai' }),
    ).toBe(selected);
  });
});
