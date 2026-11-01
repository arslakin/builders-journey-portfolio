import { useRef, useState, type SyntheticEvent } from "react";

import {
  commandShortcuts,
  initialCommandExplorerState,
  interpretCommandForAvailableContent,
  type CommandExplorerState,
  type CommandResult,
} from "../domain/commands.ts";
import type { JourneyStageTuple } from "../domain/journey.ts";
import type { PortfolioSectionId } from "../domain/navigation.ts";
import type { VerifiedText, VerifiedValue } from "../domain/verified.ts";
import type { SectionNavigationResult } from "../hooks/navigateToSection.ts";
import { JourneyExperience } from "./JourneyExperience.tsx";

interface CommandExplorerProps {
  readonly journeyStages: JourneyStageTuple | null;
  readonly superpowerStatement: VerifiedValue<VerifiedText> | null;
  readonly onNavigate: (
    target: PortfolioSectionId,
  ) => SectionNavigationResult;
}

interface ResultViewProps {
  readonly result: CommandResult;
  readonly journeyStages: JourneyStageTuple | null;
}

function ResultView({ result, journeyStages }: ResultViewProps) {
  switch (result.kind) {
    case "help":
      return (
        <div className="command-result">
          <h3>Available commands</h3>
          <ul className="command-help-list">
            {result.commands.map((descriptor) => (
              <li key={descriptor.command}>
                <code>{descriptor.command}</code>
                <span>{descriptor.description}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "journey":
      return (
        <div className="command-result">
          <JourneyExperience
            stages={journeyStages}
            idPrefix="command-journey"
          />
        </div>
      );
    case "navigation":
      return (
        <p className="command-result">
          Moved to the {result.target === "skills" ? "Skills" : "Projects"}
          section.
        </p>
      );
    case "superpower":
      return (
        <blockquote className="command-result command-result--quote">
          {result.text.value}
        </blockquote>
      );
  }
}

export function CommandExplorer({
  journeyStages,
  superpowerStatement,
  onNavigate,
}: CommandExplorerProps) {
  const [inputValue, setInputValue] = useState("");
  const [state, setState] = useState<CommandExplorerState>(
    initialCommandExplorerState,
  );
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const submitCommand = (raw: string): void => {
    const interpretation = interpretCommandForAvailableContent(
      raw,
      state,
      superpowerStatement,
    );

    if (interpretation.kind === "content-unavailable") {
      setState(interpretation.state);
      setAvailabilityMessage(interpretation.guidance);
      inputRef.current?.focus();
      return;
    }

    const { transition } = interpretation;
    setState(transition.state);
    setAvailabilityMessage(null);

    if (transition.effect !== undefined) {
      const navigation = onNavigate(transition.effect.target);
      if (navigation.status === "missing-target") {
        setAvailabilityMessage(
          "The requested local section is temporarily unavailable.",
        );
      }
    }

    inputRef.current?.focus();
  };

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitCommand(inputValue);
  };

  return (
    <section className="section command-explorer" aria-labelledby="command-title">
      <div className="section-heading">
        <p className="section-kicker">Local command interface</p>
        <h2 id="command-title">Discover My Superpower</h2>
        <p>
          Use a command to navigate or inspect available portfolio content. No
          command sends data or makes a network request.
        </p>
      </div>

      {!state.submittedOnce ? (
        <p className="command-hint">
          Try <code>help</code>, or choose one of the shortcuts below.
        </p>
      ) : null}

      <form className="command-form" onSubmit={handleSubmit}>
        <label htmlFor="command-input">Command</label>
        <div className="command-form__row">
          <span className="command-prompt" aria-hidden="true">
            $
          </span>
          <input
            ref={inputRef}
            id="command-input"
            name="command"
            type="text"
            value={inputValue}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              setInputValue(event.currentTarget.value);
            }}
          />
          <button type="submit">Run command</button>
        </div>
      </form>

      <div
        className="command-shortcuts"
        role="group"
        aria-label="Command shortcuts"
      >
        {commandShortcuts.map((command) => (
          <button
            key={command}
            type="button"
            aria-label={"Run " + command + " command"}
            onClick={() => {
              submitCommand(command);
            }}
          >
            {command}
          </button>
        ))}
      </div>

      <div
        className="command-output"
        aria-live="polite"
        aria-atomic="true"
        data-testid="command-output"
      >
        {state.lastResult === null &&
        state.feedback === null &&
        availabilityMessage === null ? (
          <p className="command-output__idle">Command results appear here.</p>
        ) : null}

        {state.lastResult === null ? null : (
          <ResultView
            result={state.lastResult}
            journeyStages={journeyStages}
          />
        )}

        {state.feedback?.kind === "unsupported" ? (
          <p className="command-feedback">
            Unsupported command: <code>{state.feedback.submitted}</code>.{" "}
            {state.feedback.guidance}
          </p>
        ) : null}

        {state.feedback?.kind === "empty" ? (
          <p className="command-feedback">{state.feedback.guidance}</p>
        ) : null}

        {availabilityMessage === null ? null : (
          <p className="command-feedback">{availabilityMessage}</p>
        )}
      </div>
    </section>
  );
}
