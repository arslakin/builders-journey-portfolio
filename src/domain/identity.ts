import type { JourneyStageTuple } from './journey.ts';
import type { ProjectRecord } from './project.ts';
import type { VerifiedText, VerifiedValue } from './verified.ts';

/** Exact identity values required by the portfolio specification. */
export const portfolioTitle = "The Builder's Journey — From Teaching to Technology";
export const portfolioOwnerName = 'Azad Akin Arslan';
export const builderChallengeName =
  'AWS Student Builder Challenge: Build Your Tech Superpower';

export interface SiteIdentity {
  readonly title: typeof portfolioTitle;
  readonly ownerName: typeof portfolioOwnerName;
  readonly challengeName: typeof builderChallengeName;
  readonly presentationCopy?: VerifiedValue<VerifiedText>;
}

/** Fixed identity contains no optional, unverified presentation claim. */
export const siteIdentity = {
  title: portfolioTitle,
  ownerName: portfolioOwnerName,
  challengeName: builderChallengeName,
} as const satisfies SiteIdentity;

export interface AboutContent {
  readonly teaching: VerifiedValue<VerifiedText>;
  readonly cloudEngineering: VerifiedValue<VerifiedText>;
  readonly artificialIntelligence: VerifiedValue<VerifiedText>;
  readonly connection: VerifiedValue<VerifiedText>;
}

export interface SkillCategory {
  readonly id: string;
  readonly label: VerifiedValue<VerifiedText>;
  readonly skills: readonly VerifiedValue<VerifiedText>[];
}

/** Complete validated input expected by page composition. */
export interface PortfolioContent {
  readonly identity: SiteIdentity;
  readonly about: AboutContent;
  readonly skillCategories: readonly SkillCategory[];
  readonly journeyStages: JourneyStageTuple;
  readonly superpowerStatement: VerifiedValue<VerifiedText>;
  readonly projects: readonly ProjectRecord[];
}
