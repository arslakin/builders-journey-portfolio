import type { VerifiedText, VerifiedValue } from "./verified.ts";

export const supportedCommands = [
  "help",
  "journey",
  "skills",
  "projects",
  "superpower",
] as const;

export type SupportedCommand = (typeof supportedCommands)[number];

export function isSupportedCommand(value: string): value is SupportedCommand {
  return supportedCommands.some((command) => command === value);
}

export interface CommandDescriptor {
  readonly command: SupportedCommand;
  readonly description: string;
}

const commandDescriptions = {
  help: "List the available commands.",
  journey: "Show the Teaching, Cloud, and AI journey stages.",
  skills: "Go to the Skills / Tech Superpowers section.",
  projects: "Go to the Projects / Achievements section.",
  superpower: "Show the tech superpower statement.",
} as const satisfies Record<SupportedCommand, string>;

export const commandDescriptors: readonly CommandDescriptor[] = Object.freeze(
  supportedCommands.map((command) =>
    Object.freeze({ command, description: commandDescriptions[command] }),
  ),
);

export const commandShortcuts: typeof supportedCommands = supportedCommands;

export type CommandNavigationTarget = "skills" | "projects";

export interface CommandNavigationEffect {
  readonly kind: "navigate";
  readonly target: CommandNavigationTarget;
}

export type CommandResult =
  | { readonly kind: "help"; readonly commands: readonly CommandDescriptor[] }
  | { readonly kind: "journey" }
  | { readonly kind: "navigation"; readonly target: CommandNavigationTarget }
  | {
      readonly kind: "superpower";
      readonly text: VerifiedValue<VerifiedText>;
    };

export const unsupportedCommandGuidance = "Use help to list available commands.";
export const emptyCommandGuidance = "Enter a command or choose a shortcut.";
export const pendingSuperpowerGuidance =
  "Owner-approved superpower content is pending.";

export type CommandFeedback =
  | {
      readonly kind: "unsupported";
      readonly submitted: string;
      readonly guidance: typeof unsupportedCommandGuidance;
    }
  | {
      readonly kind: "empty";
      readonly guidance: typeof emptyCommandGuidance;
    };

export interface CommandExplorerState {
  readonly lastResult: CommandResult | null;
  readonly feedback: CommandFeedback | null;
  readonly submittedOnce: boolean;
}

export const initialCommandExplorerState: CommandExplorerState = Object.freeze({
  lastResult: null,
  feedback: null,
  submittedOnce: false,
});

export interface CommandTransition {
  readonly state: CommandExplorerState;
  readonly effect?: CommandNavigationEffect;
}

export type AvailableContentCommandInterpretation =
  | {
      readonly kind: "transition";
      readonly transition: CommandTransition;
    }
  | {
      readonly kind: "content-unavailable";
      readonly command: "superpower";
      readonly guidance: typeof pendingSuperpowerGuidance;
      readonly state: CommandExplorerState;
    };

function successfulCommandTransition(
  result: CommandResult,
  effect?: CommandNavigationEffect,
): CommandTransition {
  const state: CommandExplorerState = {
    lastResult: result,
    feedback: null,
    submittedOnce: true,
  };

  return effect === undefined ? { state } : { state, effect };
}

function preservedResultTransition(
  previous: CommandExplorerState,
  feedback: CommandFeedback,
): CommandTransition {
  return {
    state: {
      lastResult: previous.lastResult,
      feedback,
      submittedOnce: true,
    },
  };
}

function interpretCommandWithoutSuperpower(
  raw: string,
  previous: CommandExplorerState,
): CommandTransition | null {
  if (raw === "") {
    return preservedResultTransition(previous, {
      kind: "empty",
      guidance: emptyCommandGuidance,
    });
  }

  if (!isSupportedCommand(raw)) {
    return preservedResultTransition(previous, {
      kind: "unsupported",
      submitted: raw,
      guidance: unsupportedCommandGuidance,
    });
  }

  switch (raw) {
    case "help":
      return successfulCommandTransition({
        kind: "help",
        commands: commandDescriptors,
      });
    case "journey":
      return successfulCommandTransition({ kind: "journey" });
    case "skills":
      return successfulCommandTransition(
        { kind: "navigation", target: "skills" },
        { kind: "navigate", target: "skills" },
      );
    case "projects":
      return successfulCommandTransition(
        { kind: "navigation", target: "projects" },
        { kind: "navigate", target: "projects" },
      );
    case "superpower":
      return null;
  }
}

export function interpretCommand(
  raw: string,
  previous: CommandExplorerState,
  superpowerStatement: VerifiedValue<VerifiedText>,
): CommandTransition {
  const transition = interpretCommandWithoutSuperpower(raw, previous);
  if (transition !== null) {
    return transition;
  }

  return successfulCommandTransition({
    kind: "superpower",
    text: superpowerStatement,
  });
}

/**
 * Keeps unavailable owner content outside CommandResult while preserving the
 * same pure interpreter for every command whose required content exists.
 */
export function interpretCommandForAvailableContent(
  raw: string,
  previous: CommandExplorerState,
  superpowerStatement: VerifiedValue<VerifiedText> | null,
): AvailableContentCommandInterpretation {
  const transition = interpretCommandWithoutSuperpower(raw, previous);
  if (transition !== null) {
    return { kind: "transition", transition };
  }

  if (superpowerStatement !== null) {
    return {
      kind: "transition",
      transition: successfulCommandTransition({
        kind: "superpower",
        text: superpowerStatement,
      }),
    };
  }

  return {
    kind: "content-unavailable",
    command: "superpower",
    guidance: pendingSuperpowerGuidance,
    state: {
      lastResult: previous.lastResult,
      feedback: null,
      submittedOnce: true,
    },
  };
}
