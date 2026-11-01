/** The only sections exposed by the portfolio's primary navigation. */
export const portfolioSectionIds = ['about', 'skills', 'projects'] as const;

export type PortfolioSectionId = (typeof portfolioSectionIds)[number];

export const portfolioSectionLabels = {
  about: 'About',
  skills: 'Skills / Tech Superpowers',
  projects: 'Projects / Achievements',
} as const satisfies Record<PortfolioSectionId, string>;

export type PortfolioSectionLabel =
  (typeof portfolioSectionLabels)[PortfolioSectionId];

export interface NavigationItem {
  readonly id: PortfolioSectionId;
  readonly label: PortfolioSectionLabel;
}

/** Shared immutable source for desktop and mobile navigation. */
export const navigationItems = [
  { id: 'about', label: portfolioSectionLabels.about },
  { id: 'skills', label: portfolioSectionLabels.skills },
  { id: 'projects', label: portfolioSectionLabels.projects },
] as const satisfies readonly NavigationItem[];
