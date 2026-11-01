import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  commandDescriptors,
  commandShortcuts,
  emptyCommandGuidance,
  initialCommandExplorerState,
  interpretCommand,
  isSupportedCommand,
  supportedCommands,
  unsupportedCommandGuidance,
  type CommandDescriptor,
  type CommandExplorerState,
  type CommandFeedback,
  type CommandNavigationEffect,
  type CommandNavigationTarget,
  type CommandResult,
  type CommandTransition,
  type SupportedCommand,
} from './commands.ts';
import type { VerifiedText, VerifiedValue } from './verified.ts';

const expectedOrder = [
  'help',
  'journey',
  'skills',
  'projects',
  'superpower',
] as const;

const expectedDescriptors = [
  { command: 'help', description: 'List the available commands.' },
  {
    command: 'journey',
    description: 'Show the Teaching, Cloud, and AI journey stages.',
  },
  {
    command: 'skills',
    description: 'Go to the Skills / Tech Superpowers section.',
  },
  {
    command: 'projects',
    description: 'Go to the Projects / Achievements section.',
  },
  {
    command: 'superpower',
    description: 'Show the tech superpower statement.',
  },
] as const;

describe('supported command registry', () => {
  it('defines exactly the five commands in registry order', () => {
    expect(supportedCommands).toEqual(expectedOrder);
    expectTypeOf<SupportedCommand>().toEqualTypeOf<
      'help' | 'journey' | 'skills' | 'projects' | 'superpower'
    >();
  });

  it('accepts each exact command', () => {
    for (const command of expectedOrder) {
      expect(isSupportedCommand(command)).toBe(true);
    }
  });

  it.each([
    '',
    ' ',
    'Help',
    'HELP',
    ' help',
    'help ',
    'help\n',
    'Skills',
    'project',
    'toString',
    'constructor',
  ])('rejects the non-exact value %j', (value) => {
    expect(isSupportedCommand(value)).toBe(false);
  });
});

describe('command descriptors', () => {
  it('lists each command exactly once in registry order with neutral descriptions', () => {
    expect(commandDescriptors).toEqual(expectedDescriptors);
    expect(commandDescriptors.map(({ command }) => command)).toEqual(expectedOrder);
    expectTypeOf(commandDescriptors).toExtend<readonly CommandDescriptor[]>();
  });

  it('gives every command one concise non-empty description', () => {
    for (const { description } of commandDescriptors) {
      expect(description.trim()).toBe(description);
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThanOrEqual(80);
    }
  });

  it('is immutable at runtime', () => {
    expect(Object.isFrozen(commandDescriptors)).toBe(true);
    expect(commandDescriptors.every((descriptor) => Object.isFrozen(descriptor))).toBe(true);
  });
});

describe('command shortcuts', () => {
  it('registers exactly one shortcut per supported command', () => {
    expect(commandShortcuts).toEqual(expectedOrder);
    expect(new Set(commandShortcuts).size).toBe(supportedCommands.length);
    expectTypeOf(commandShortcuts).toEqualTypeOf<typeof supportedCommands>();
  });
});

describe('command state, results, feedback, and effects', () => {
  it('defines every successful result as local typed data', () => {
    expectTypeOf<CommandResult>().toEqualTypeOf<
      | {
          readonly kind: 'help';
          readonly commands: readonly CommandDescriptor[];
        }
      | { readonly kind: 'journey' }
      | {
          readonly kind: 'navigation';
          readonly target: 'skills' | 'projects';
        }
      | {
          readonly kind: 'superpower';
          readonly text: VerifiedValue<VerifiedText>;
        }
    >();
  });

  it('defines unsupported and empty feedback as a closed union', () => {
    expectTypeOf<CommandFeedback>().toEqualTypeOf<
      | {
          readonly kind: 'unsupported';
          readonly submitted: string;
          readonly guidance: 'Use help to list available commands.';
        }
      | {
          readonly kind: 'empty';
          readonly guidance: 'Enter a command or choose a shortcut.';
        }
    >();
  });

  it('starts with no result, no feedback, and no submission', () => {
    expect(initialCommandExplorerState).toEqual({
      lastResult: null,
      feedback: null,
      submittedOnce: false,
    });
    expect(Object.isFrozen(initialCommandExplorerState)).toBe(true);
    expectTypeOf<CommandExplorerState>().toEqualTypeOf<{
      readonly lastResult: CommandResult | null;
      readonly feedback: CommandFeedback | null;
      readonly submittedOnce: boolean;
    }>();
  });

  it('fixes the exact feedback guidance text', () => {
    expect(unsupportedCommandGuidance).toBe('Use help to list available commands.');
    expect(emptyCommandGuidance).toBe('Enter a command or choose a shortcut.');
  });

  it('limits declarative navigation effects to skills and projects', () => {
    expectTypeOf<CommandNavigationTarget>().toEqualTypeOf<'skills' | 'projects'>();
    expectTypeOf<CommandNavigationEffect>().toEqualTypeOf<{
      readonly kind: 'navigate';
      readonly target: 'skills' | 'projects';
    }>();
    expectTypeOf<CommandTransition>().toEqualTypeOf<{
      readonly state: CommandExplorerState;
      readonly effect?: CommandNavigationEffect;
    }>();
  });
});

const approvedSuperpowerStatement = {
  value: 'Approved superpower test statement.' as VerifiedText,
  verification: {
    approvedByOwner: true,
    sourceNote: 'Synthetic unit-test fixture.',
  },
} satisfies VerifiedValue<VerifiedText>;

describe('command interpreter smoke behavior', () => {
  it('handles every supported command with only its local result and declared effect', () => {
    const transitions = supportedCommands.map((command) =>
      interpretCommand(
        command,
        initialCommandExplorerState,
        approvedSuperpowerStatement,
      ),
    );

    expect(transitions).toEqual([
      {
        state: {
          lastResult: { kind: 'help', commands: commandDescriptors },
          feedback: null,
          submittedOnce: true,
        },
      },
      {
        state: {
          lastResult: { kind: 'journey' },
          feedback: null,
          submittedOnce: true,
        },
      },
      {
        state: {
          lastResult: { kind: 'navigation', target: 'skills' },
          feedback: null,
          submittedOnce: true,
        },
        effect: { kind: 'navigate', target: 'skills' },
      },
      {
        state: {
          lastResult: { kind: 'navigation', target: 'projects' },
          feedback: null,
          submittedOnce: true,
        },
        effect: { kind: 'navigate', target: 'projects' },
      },
      {
        state: {
          lastResult: {
            kind: 'superpower',
            text: approvedSuperpowerStatement,
          },
          feedback: null,
          submittedOnce: true,
        },
      },
    ]);

    const superpowerResult = transitions[4]?.state.lastResult;
    expect(superpowerResult?.kind).toBe('superpower');
    if (superpowerResult?.kind === 'superpower') {
      expect(superpowerResult.text).toBe(approvedSuperpowerStatement);
    }
  });

  it('preserves the successful result and distinguishes empty from whitespace-only input', () => {
    const previous = interpretCommand(
      'journey',
      initialCommandExplorerState,
      approvedSuperpowerStatement,
    ).state;

    const empty = interpretCommand('', previous, approvedSuperpowerStatement);
    const whitespace = interpretCommand('   ', previous, approvedSuperpowerStatement);

    expect(empty).toEqual({
      state: {
        lastResult: previous.lastResult,
        feedback: { kind: 'empty', guidance: emptyCommandGuidance },
        submittedOnce: true,
      },
    });
    expect(whitespace).toEqual({
      state: {
        lastResult: previous.lastResult,
        feedback: {
          kind: 'unsupported',
          submitted: '   ',
          guidance: unsupportedCommandGuidance,
        },
        submittedOnce: true,
      },
    });
    expect(empty.state.lastResult).toBe(previous.lastResult);
    expect(whitespace.state.lastResult).toBe(previous.lastResult);
    expect(empty.effect).toBeUndefined();
    expect(whitespace.effect).toBeUndefined();
  });

  it('uses the same deterministic transition for typed and shortcut values', () => {
    const typed = interpretCommand(
      'skills',
      initialCommandExplorerState,
      approvedSuperpowerStatement,
    );
    const shortcut = interpretCommand(
      commandShortcuts[2],
      initialCommandExplorerState,
      approvedSuperpowerStatement,
    );

    expect(shortcut).toEqual(typed);
  });
});
