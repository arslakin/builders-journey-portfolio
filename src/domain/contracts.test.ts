import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  builderChallengeName,
  portfolioOwnerName,
  portfolioTitle,
  siteIdentity,
  type SiteIdentity,
} from './identity.ts';
import {
  journeyStageLabels,
  journeyStageOrder,
  type JourneyStage,
  type JourneyStageTuple,
} from './journey.ts';
import {
  navigationItems,
  portfolioSectionIds,
  type PortfolioSectionId,
} from './navigation.ts';
import {
  placeholderProjectLinkLabel,
  requiredProjectNames,
  type PlaceholderProjectLink,
  type ProjectRecord,
  type VerifiedProjectLink,
} from './project.ts';
import type {
  VerificationNote,
  VerifiedText,
  VerifiedUrl,
  VerifiedValue,
} from './verified.ts';

type CanCarryPlaceholderHref = {
  readonly kind: 'placeholder';
  readonly label: typeof placeholderProjectLinkLabel;
  readonly href: string;
} extends PlaceholderProjectLink
  ? true
  : false;

type CanCarryPlaceholderUrl = {
  readonly kind: 'placeholder';
  readonly label: typeof placeholderProjectLinkLabel;
  readonly url: VerifiedValue<VerifiedUrl>;
} extends PlaceholderProjectLink
  ? true
  : false;

type CanCarryVerifiedHref = {
  readonly kind: 'verified';
  readonly label: VerifiedValue<VerifiedText>;
  readonly url: VerifiedValue<VerifiedUrl>;
  readonly href: string;
} extends VerifiedProjectLink
  ? true
  : false;

type HasProjectField<Field extends PropertyKey> = Field extends keyof ProjectRecord
  ? true
  : false;

describe('verified content contracts', () => {
  it('keeps raw strings distinct from branded verified values', () => {
    expectTypeOf<VerifiedText>().toExtend<string>();
    expectTypeOf<VerifiedUrl>().toExtend<string>();
    expectTypeOf<string>().not.toEqualTypeOf<VerifiedText>();
    expectTypeOf<string>().not.toEqualTypeOf<VerifiedUrl>();
  });

  it('requires owner approval metadata on wrapped values', () => {
    expectTypeOf<VerificationNote>().toEqualTypeOf<{
      readonly approvedByOwner: true;
      readonly sourceNote: string;
    }>();
    expectTypeOf<VerifiedValue<VerifiedText>>().toEqualTypeOf<{
      readonly value: VerifiedText;
      readonly verification: VerificationNote;
    }>();
  });
});

describe('fixed identity and navigation contracts', () => {
  it('exports the exact required identity without optional claims', () => {
    expect(siteIdentity).toEqual({
      title: "The Builder's Journey — From Teaching to Technology",
      ownerName: 'Azad Akin Arslan',
      challengeName: 'AWS Student Builder Challenge: Build Your Tech Superpower',
    });
    expect(portfolioTitle).toBe(siteIdentity.title);
    expect(portfolioOwnerName).toBe(siteIdentity.ownerName);
    expect(builderChallengeName).toBe(siteIdentity.challengeName);
    expect('presentationCopy' in siteIdentity).toBe(false);
    expectTypeOf<SiteIdentity['title']>().toEqualTypeOf<typeof portfolioTitle>();
  });

  it('keeps one ordered section registry for both navigation presentations', () => {
    expect(portfolioSectionIds).toEqual(['about', 'skills', 'projects']);
    expect(navigationItems).toEqual([
      { id: 'about', label: 'About' },
      { id: 'skills', label: 'Skills / Tech Superpowers' },
      { id: 'projects', label: 'Projects / Achievements' },
    ]);
    expectTypeOf<PortfolioSectionId>().toEqualTypeOf<'about' | 'skills' | 'projects'>();
  });
});

describe('project contracts', () => {
  it('exposes the structural required-name and placeholder constants', () => {
    expect(requiredProjectNames).toEqual(['Dengbej AI', 'RojBer', 'RojAI', 'RojAnda']);
    expect(placeholderProjectLinkLabel).toBe('Link pending verification');
  });

  it('keeps source link states discriminated and destinations verified', () => {
    expectTypeOf<VerifiedProjectLink['url']>().toEqualTypeOf<
      VerifiedValue<VerifiedUrl>
    >();
    expectTypeOf<CanCarryPlaceholderHref>().toEqualTypeOf<false>();
    expectTypeOf<CanCarryPlaceholderUrl>().toEqualTypeOf<false>();
    expectTypeOf<CanCarryVerifiedHref>().toEqualTypeOf<false>();
  });

  it('does not expose unsupported claim or metric fields to renderers', () => {
    expectTypeOf<HasProjectField<'claim'>>().toEqualTypeOf<false>();
    expectTypeOf<HasProjectField<'claims'>>().toEqualTypeOf<false>();
    expectTypeOf<HasProjectField<'metric'>>().toEqualTypeOf<false>();
    expectTypeOf<HasProjectField<'metrics'>>().toEqualTypeOf<false>();
    expectTypeOf<ProjectRecord['achievement']>().toEqualTypeOf<
      VerifiedValue<VerifiedText> | undefined
    >();
  });
});

describe('journey contracts', () => {
  it('fixes the complete stage order and matching visible labels', () => {
    expect(journeyStageOrder).toEqual(['teaching', 'cloud', 'ai']);
    expect(journeyStageLabels).toEqual({
      teaching: 'Teaching',
      cloud: 'Cloud',
      ai: 'AI',
    });
    expectTypeOf<JourneyStageTuple>().toEqualTypeOf<
      readonly [JourneyStage<'teaching'>, JourneyStage<'cloud'>, JourneyStage<'ai'>]
    >();
  });
});
