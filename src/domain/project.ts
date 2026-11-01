import type { VerifiedText, VerifiedUrl, VerifiedValue } from './verified.ts';

/** Structurally required project names; this tuple supplies no project facts. */
export const requiredProjectNames = [
  'Dengbej AI',
  'RojBer',
  'RojAI',
  'RojAnda',
] as const;

export type RequiredProjectName = (typeof requiredProjectNames)[number];

export const placeholderProjectLinkLabel = 'Link pending verification';

export interface VerifiedProjectLink {
  readonly kind: 'verified';
  readonly label: VerifiedValue<VerifiedText>;
  readonly url: VerifiedValue<VerifiedUrl>;
  /** Source records use a verified URL; renderable href values are derived later. */
  readonly href?: never;
}

export interface PlaceholderProjectLink {
  readonly kind: 'placeholder';
  readonly label: typeof placeholderProjectLinkLabel;
  /** A placeholder cannot carry either source or rendered destination data. */
  readonly url?: never;
  readonly href?: never;
}

export type ProjectLinkState = VerifiedProjectLink | PlaceholderProjectLink;

/**
 * A centralized content record. Every renderable factual field is required to
 * carry verification metadata. Unsupported claim and metric fields are absent
 * from the contract, so presentation code typed against it cannot render them.
 */
export interface ProjectRecord {
  readonly id: string;
  readonly name: VerifiedValue<VerifiedText>;
  readonly description: VerifiedValue<VerifiedText>;
  readonly technologies: readonly VerifiedValue<VerifiedText>[];
  readonly achievement?: VerifiedValue<VerifiedText>;
  readonly link: ProjectLinkState;
}

export interface OperableProjectLinkViewModel {
  readonly operable: true;
  readonly label: VerifiedText;
  readonly href: VerifiedUrl;
}

export interface PlaceholderProjectLinkViewModel {
  readonly operable: false;
  readonly label: typeof placeholderProjectLinkLabel;
  /** Non-operable states never receive a destination during mapping. */
  readonly href?: never;
}

export type ProjectLinkViewModel =
  | OperableProjectLinkViewModel
  | PlaceholderProjectLinkViewModel;

/** Render-ready project data produced only from validated source records. */
export interface ProjectViewModel {
  readonly id: string;
  readonly name: VerifiedText;
  readonly description: VerifiedText;
  readonly technologies: readonly VerifiedText[];
  readonly achievement?: VerifiedText;
  readonly link: ProjectLinkViewModel;
}

function toProjectLinkViewModel(
  link: ProjectLinkState,
): ProjectLinkViewModel {
  if (link.kind === 'verified') {
    return Object.freeze({
      operable: true,
      label: link.label.value,
      href: link.url.value,
    });
  }

  return Object.freeze({
    operable: false,
    label: placeholderProjectLinkLabel,
  });
}

/**
 * Projects each source record exactly once in source order. Values and verified
 * destinations are copied unchanged; placeholders remain destination-free.
 */
export function toProjectViewModels(
  records: readonly ProjectRecord[],
): readonly ProjectViewModel[] {
  return Object.freeze(
    records.map((record) => {
      const baseViewModel = {
        id: record.id,
        name: record.name.value,
        description: record.description.value,
        technologies: Object.freeze(
          record.technologies.map((technology) => technology.value),
        ),
        link: toProjectLinkViewModel(record.link),
      } as const;

      return record.achievement === undefined
        ? Object.freeze(baseViewModel)
        : Object.freeze({
            ...baseViewModel,
            achievement: record.achievement.value,
          });
    }),
  );
}
