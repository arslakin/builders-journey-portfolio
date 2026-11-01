import { describe, expect, expectTypeOf, it } from 'vitest';
import { siteIdentity, type PortfolioContent } from '../domain/identity.ts';
import {
  placeholderProjectLinkLabel,
  type PlaceholderProjectLink,
  type ProjectRecord,
} from '../domain/project.ts';
import {
  portfolioContentSource,
  type PortfolioContentSource,
} from './portfolio.ts';
import { placeholderProjectLink, projectRecords } from './projects.ts';

describe('centralized portfolio content source', () => {
  it('preserves the exact approved identity and one project collection', () => {
    expect(portfolioContentSource.identity).toBe(siteIdentity);
    expect(portfolioContentSource.projects).toBe(projectRecords);
    expect(Object.isFrozen(portfolioContentSource)).toBe(true);
    expect(Object.isFrozen(projectRecords)).toBe(true);

    expectTypeOf(portfolioContentSource).toExtend<PortfolioContentSource>();
    expectTypeOf(portfolioContentSource.identity).toExtend<
      PortfolioContent['identity']
    >();
    expectTypeOf(projectRecords).toEqualTypeOf<readonly ProjectRecord[]>();
    expectTypeOf(portfolioContentSource.projects).toEqualTypeOf<
      readonly ProjectRecord[]
    >();
  });

  it('supplies resume-backed content with source metadata', () => {
    expect(portfolioContentSource.about.kind).toBe('verified');
    expect(portfolioContentSource.skillCategories.kind).toBe('verified');
    expect(portfolioContentSource.journeyStages.kind).toBe('verified');
    expect(portfolioContentSource.superpowerStatement.kind).toBe('verified');
    expect(portfolioContentSource.projectCollectionStatus.kind).toBe('complete');
    expect(portfolioContentSource.about.value.teaching.verification.sourceNote).toContain('resume');
  });
});

describe('centralized project content', () => {
  it('includes six sourced projects with honest link states', () => {
    expect(projectRecords).toHaveLength(6);
    expect(projectRecords.every(record => record.description.verification.sourceNote.length > 0)).toBe(true);
  });

  it('provides the exact non-operable placeholder state for unavailable URLs', () => {
    expect(placeholderProjectLink).toEqual({
      kind: 'placeholder',
      label: placeholderProjectLinkLabel,
    });
    expect('url' in placeholderProjectLink).toBe(false);
    expect('href' in placeholderProjectLink).toBe(false);
    expect(Object.isFrozen(placeholderProjectLink)).toBe(true);
    expectTypeOf(placeholderProjectLink).toExtend<PlaceholderProjectLink>();
  });
});
