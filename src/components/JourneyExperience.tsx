import { useReducer } from "react";

import {
  initialJourneyState,
  journeyReducer,
  journeyStageLabels,
  journeyStageOrder,
  selectActiveJourneyContent,
  type JourneyStageTuple,
} from "../domain/journey.ts";

interface JourneyExperienceProps {
  readonly stages: JourneyStageTuple | null;
  readonly headingLevel?: 2 | 3;
  readonly idPrefix?: string;
}

export function JourneyExperience({
  stages,
  headingLevel = 3,
  idPrefix = "journey",
}: JourneyExperienceProps) {
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState);
  const activeLabel = journeyStageLabels[state.activeStage];
  const selectedContent =
    stages === null ? null : selectActiveJourneyContent(stages, state);
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const titleId = idPrefix + "-title";
  const contentId = idPrefix + "-content";

  return (
    <div className="journey" role="group" aria-labelledby={titleId}>
      <div className="section-heading section-heading--compact">
        <p className="section-kicker">Interactive journey</p>
        <Heading id={titleId}>Teaching → Cloud → AI</Heading>
      </div>

      <div
        className="journey__controls"
        role="group"
        aria-label="Journey stages"
      >
        {journeyStageOrder.map((stageId) => {
          const isActive = state.activeStage === stageId;
          return (
            <button
              key={stageId}
              type="button"
              className="journey__stage"
              aria-pressed={isActive}
              aria-controls={contentId}
              data-active={isActive ? "true" : "false"}
              onClick={() => {
                dispatch({ type: "activate", stage: stageId });
              }}
            >
              <span>{journeyStageLabels[stageId]}</span>
              <span className="journey__marker" aria-hidden="true">
                {isActive ? "Selected" : "Select"}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={contentId}
        className="journey__content"
        role="region"
        aria-label={activeLabel + " journey content"}
        aria-live="polite"
      >
        <p className="journey__active-label">Active stage: {activeLabel}</p>
        {selectedContent === null ? (
          <p className="pending-copy">
            Owner-approved content for {activeLabel} is pending. No journey
            details have been inferred.
          </p>
        ) : (
          <p>{selectedContent.value}</p>
        )}
      </div>
    </div>
  );
}
