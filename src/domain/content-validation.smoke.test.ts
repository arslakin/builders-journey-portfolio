import { describe, expect, it } from 'vitest';

import { validateProductionContent } from '../../scripts/validation/content-validation.ts';
import {
  ownerApprovalRequiredReason,
  portfolioContentSource,
  type PortfolioContentSource,
} from '../content/portfolio.ts';
import { siteIdentity } from './identity.ts';
import type { JourneyStageTuple } from './journey.ts';
import {
  placeholderProjectLinkLabel,
  toProjectViewModels,
  type ProjectLinkState,
  type ProjectRecord,
} from './project.ts';
import {
  validatePortfolioContentSource,
  validateProjectRecords,
} from './content-validation.ts';
import type {
  VerifiedText,
  VerifiedUrl,
  VerifiedValue,
} from './verified.ts';

function verifiedText(value: string): VerifiedValue<VerifiedText> {
  return Object.freeze({
    value: value as VerifiedText,
    verification: Object.freeze({
      approvedByOwner: true,
      sourceNote: 'synthetic test-only source',
    }),
  });
}

function verifiedUrl(value: string): VerifiedValue<VerifiedUrl> {
  return Object.freeze({
    value: value as VerifiedUrl,
    verification: Object.freeze({
      approvedByOwner: true,
      sourceNote: 'synthetic test-only source',
    }),
  });
}

function projectRecord(
  id: string,
  name: string,
  link: ProjectLinkState,
): ProjectRecord {
  return Object.freeze({
    id,
    name: verifiedText(name),
    description: verifiedText(`synthetic description for ${id}`),
    technologies: Object.freeze([verifiedText(`synthetic technology for ${id}`)]),
    link,
  });
}

const verifiedLink = Object.freeze({
  kind: 'verified',
  label: verifiedText('Synthetic project destination'),
  url: verifiedUrl('https://example.invalid/projects/dengbej-ai'),
}) satisfies ProjectLinkState;

const placeholderLink = Object.freeze({
  kind: 'placeholder',
  label: placeholderProjectLinkLabel,
}) satisfies ProjectLinkState;

const validProjects = Object.freeze([
  projectRecord('project-dengbej-ai', 'Dengbej AI', verifiedLink),
  projectRecord('project-rojber', 'RojBer', placeholderLink),
  projectRecord('project-rojai', 'RojAI', placeholderLink),
  projectRecord('project-rojanda', 'RojAnda', placeholderLink),
] as const) satisfies readonly ProjectRecord[];

const validJourneyStages = Object.freeze([
  Object.freeze({
    id: 'teaching',
    label: 'Teaching',
    content: verifiedText('synthetic teaching stage'),
  }),
  Object.freeze({
    id: 'cloud',
    label: 'Cloud',
    content: verifiedText('synthetic cloud stage'),
  }),
  Object.freeze({
    id: 'ai',
    label: 'AI',
    content: verifiedText('synthetic AI stage'),
  }),
]) satisfies JourneyStageTuple;

const validSource = Object.freeze({
  identity: siteIdentity,
  about: Object.freeze({
    kind: 'verified',
    value: Object.freeze({
      teaching: verifiedText('synthetic teaching about content'),
      cloudEngineering: verifiedText('synthetic cloud about content'),
      artificialIntelligence: verifiedText('synthetic AI about content'),
      connection: verifiedText('synthetic connection content'),
    }),
  }),
  skillCategories: Object.freeze({
    kind: 'verified',
    value: Object.freeze([
      Object.freeze({
        id: 'synthetic-skill-category',
        label: verifiedText('Synthetic skill category'),
        skills: Object.freeze([verifiedText('Synthetic skill')]),
      }),
    ]),
  }),
  journeyStages: Object.freeze({
    kind: 'verified',
    value: validJourneyStages,
  }),
  superpowerStatement: Object.freeze({
    kind: 'verified',
    value: verifiedText('Synthetic superpower statement'),
  }),
  projects: validProjects,
  projectCollectionStatus: Object.freeze({ kind: 'complete' }),
}) satisfies PortfolioContentSource;

describe('content validation and project mapping smoke', () => {
  it('rejects the unresolved production source with field and cardinality paths', () => {
    const missing = { kind: 'unresolved' as const, reason: ownerApprovalRequiredReason };
    const result = validatePortfolioContentSource({ ...portfolioContentSource, about: missing, skillCategories: missing, journeyStages: missing, superpowerStatement: missing, projectCollectionStatus: missing, projects: [] });

    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') {
      throw new Error('Expected unresolved production content to be rejected.');
    }

    const paths = result.diagnostics.map(({ path }) => path);
    expect(paths).toEqual(
      expect.arrayContaining([
        'about',
        'skillCategories',
        'journeyStages',
        'superpowerStatement',
        'projectCollectionStatus',
        'projects.requiredProjectNames["Dengbej AI"]',
        'projects.requiredProjectNames["RojBer"]',
        'projects.requiredProjectNames["RojAI"]',
        'projects.requiredProjectNames["RojAnda"]',
      ]),
    );
    expect(JSON.stringify(result.diagnostics)).not.toContain(
      ownerApprovalRequiredReason,
    );
  });

  it('accepts a complete synthetic source and maps every project once in order', () => {
    const contentResult = validatePortfolioContentSource(validSource);
    const projectResult = validateProjectRecords(validProjects);
    const sourceSnapshot = JSON.stringify(validProjects);
    const viewModels = toProjectViewModels(validProjects);

    expect(contentResult.status).toBe('valid');
    expect(projectResult.status).toBe('valid');
    expect(viewModels.map(({ id }) => id)).toEqual(
      validProjects.map(({ id }) => id),
    );
    expect(viewModels.map(({ name }) => name)).toEqual(
      validProjects.map(({ name }) => name.value),
    );
    expect(viewModels[0]?.link).toEqual({
      operable: true,
      label: verifiedLink.label.value,
      href: verifiedLink.url.value,
    });
    expect(viewModels[1]?.link).toEqual({
      operable: false,
      label: placeholderProjectLinkLabel,
    });
    expect('href' in (viewModels[1]?.link ?? {})).toBe(false);
    expect(JSON.stringify(validProjects)).toBe(sourceSnapshot);
  });

  it('aggregates safe paths for independently malformed content', () => {
    const rejectedText = 'synthetic-value-must-not-appear-in-diagnostics';
    const rejectedUrl = 'synthetic-malformed-destination-must-not-appear';
    const corruptedSource = {
      ...validSource,
      journeyStages: {
        kind: 'verified',
        value: [validJourneyStages[1], validJourneyStages[0], validJourneyStages[2]],
      },
      projects: [
        {
          ...validProjects[0],
          description: {
            value: ' ',
            verification: {
              approvedByOwner: false,
              sourceNote: '',
            },
          },
          link: {
            ...verifiedLink,
            url: verifiedUrl(rejectedUrl),
          },
          metrics: [rejectedText],
        },
        {
          ...validProjects[1],
          id: validProjects[0].id,
          link: {
            kind: 'placeholder',
            label: placeholderProjectLinkLabel,
            href: rejectedUrl,
          },
        },
        validProjects[2],
        validProjects[3],
      ],
    };

    const result = validatePortfolioContentSource(corruptedSource);

    expect(result.status).toBe('invalid');
    if (result.status !== 'invalid') {
      throw new Error('Expected malformed synthetic content to be rejected.');
    }

    expect(result.diagnostics.map(({ code }) => code)).toEqual(
      expect.arrayContaining([
        'CNT004',
        'CNT005',
        'CNT006',
        'CNT008',
        'CNT010',
        'CNT011',
        'CNT012',
        'CNT015',
      ]),
    );
    const serializedDiagnostics = JSON.stringify(result.diagnostics);
    expect(serializedDiagnostics).not.toContain(rejectedText);
    expect(serializedDiagnostics).not.toContain(rejectedUrl);
  });

  it('accepts the resume-backed production source through the production adapter', async () => {
    const report = await validateProductionContent();
    expect(report.findings).toEqual([]);
  });
});
