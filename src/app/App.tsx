import { useCallback } from "react";

import { Certifications } from "../components/Certifications.tsx";
import { CommandExplorer } from "../components/CommandExplorer.tsx";
import { JourneyExperience } from "../components/JourneyExperience.tsx";
import { SiteNavigation } from "../components/SiteNavigation.tsx";
import { portfolioContentSource } from "../content/portfolio.ts";
import { validatePortfolioContentSource } from "../domain/content-validation.ts";
import {
  builderChallengeName,
  portfolioOwnerName,
  portfolioTitle,
  type PortfolioContent,
} from "../domain/identity.ts";
import {
  navigationItems,
  type PortfolioSectionId,
} from "../domain/navigation.ts";
import {
  placeholderProjectLinkLabel,
  requiredProjectNames,
  toProjectViewModels,
  type ProjectViewModel,
} from "../domain/project.ts";
import {
  navigateToSection,
  type SectionNavigationResult,
} from "../hooks/navigateToSection.ts";
import { useReducedMotion } from "../hooks/useReducedMotion.ts";

const contentValidation = validatePortfolioContentSource(portfolioContentSource);
const resolvedContent: PortfolioContent | null =
  contentValidation.status === "valid" ? contentValidation.value : null;

interface PendingNoticeProps {
  readonly message: string;
}

function PendingNotice({ message }: PendingNoticeProps) {
  return (
    <div className="pending-notice" role="note">
      <span className="pending-notice__label">Content pending</span>
      <p>{message}</p>
    </div>
  );
}

function AboutContentView({ content }: { readonly content: PortfolioContent }) {
  return (
    <div className="about-copy">
      <p>{content.about.teaching.value}</p>
      <p>{content.about.cloudEngineering.value}</p>
      <p>{content.about.artificialIntelligence.value}</p>
      <p>{content.about.connection.value}</p>
    </div>
  );
}

function SkillsContentView({ content }: { readonly content: PortfolioContent }) {
  return (
    <div className="skill-grid">
      {content.skillCategories.map((category) => (
        <article className="skill-card" key={category.id}>
          <h3>{category.label.value}</h3>
          <ul>
            {category.skills.map((skill, index) => (
              <li key={category.id + "-skill-" + String(index)}>
                {skill.value}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function ProjectCard({ project }: { readonly project: ProjectViewModel }) {
  return (
    <article className="project-card">
      <p className="project-card__index" aria-hidden="true">
        Project record
      </p>
      <h3>{project.name}</h3>
      <div className="project-card__field">
        <span>Description</span>
        <p>{project.description}</p>
      </div>
      <div className="project-card__field">
        <span>Technologies</span>
        <ul className="tag-list">
          {project.technologies.map((technology, index) => (
            <li key={project.id + "-technology-" + String(index)}>
              {technology}
            </li>
          ))}
        </ul>
      </div>
      {project.achievement === undefined ? null : (
        <div className="project-card__field">
          <span>Verified achievement</span>
          <p>{project.achievement}</p>
        </div>
      )}
      <div className="project-card__field">
        <span>Destination</span>
        {project.link.operable ? (
          <a href={project.link.href}>{project.link.label}</a>
        ) : (
          <span className="placeholder-link">{project.link.label}</span>
        )}
      </div>
    </article>
  );
}

function PendingProjectCards() {
  return (
    <div className="project-grid">
      {requiredProjectNames.map((name) => (
        <article className="project-card project-card--pending" key={name}>
          <p className="project-card__index">Required project record</p>
          <h3>{name}</h3>
          <p className="pending-copy">
            Owner-approved description and technology details are pending. No
            project claims have been inferred.
          </p>
          <div className="project-card__field">
            <span>Destination</span>
            <span className="placeholder-link">
              {placeholderProjectLinkLabel}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export function App() {
  const prefersReducedMotion = useReducedMotion();
  const handleNavigate = useCallback(
    (target: PortfolioSectionId): SectionNavigationResult =>
      navigateToSection(target, prefersReducedMotion),
    [prefersReducedMotion],
  );

  const projectViewModels =
    resolvedContent === null
      ? null
      : toProjectViewModels(resolvedContent.projects);

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="site-header__inner">
          <span className="site-header__owner">{portfolioOwnerName}</span>
          <SiteNavigation items={navigationItems} onNavigate={handleNavigate} />
        </div>
      </header>

      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero__rule" aria-hidden="true" />
          <p className="hero__eyebrow">{builderChallengeName}</p>
          <h1 id="page-title">{portfolioTitle}</h1>
          <p className="hero__owner">{portfolioOwnerName}</p>
          <p className="hero__summary">
            Educator. Information science student. Entrepreneur and builder.
            I bring over a decade of teaching experience to projects in learning,
            AI, cloud technology and cultural heritage.
          </p>
          <a className="text-link" href="#about">
            Begin the journey <span aria-hidden="true">↓</span>
          </a>
        </section>

        <div className="content-status" role="note">
          <span className="content-status__marker" aria-hidden="true" />
          <div>
            <strong>Teaching, building, connecting</strong>
            <p>
              From the classroom to cloud projects and RojKilim, my work connects
              people, ideas and practical tools. Explore my story, browse the
              projects, or try the command explorer below.
            </p>
          </div>
        </div>

        <section className="section" aria-labelledby="about">
          <div className="section-heading">
            <p className="section-kicker">01 / Foundation</p>
            <h2 id="about" tabIndex={-1}>
              About
            </h2>
          </div>
          {resolvedContent === null ? (
            <PendingNotice message="Owner-approved About copy connecting teaching, cloud engineering, and artificial intelligence has not been supplied." />
          ) : (
            <AboutContentView content={resolvedContent} />
          )}
          <JourneyExperience
            stages={resolvedContent?.journeyStages ?? null}
            idPrefix="about-journey"
          />
        </section>

        <section className="section" aria-labelledby="skills">
          <div className="section-heading">
            <p className="section-kicker">02 / Capabilities</p>
            <h2 id="skills" tabIndex={-1}>
              Skills / Tech Superpowers
            </h2>
          </div>
          {resolvedContent === null ? (
            <PendingNotice message="Owner-approved skill categories and skill items have not been supplied. This section intentionally lists no inferred capabilities." />
          ) : (
            <SkillsContentView content={resolvedContent} />
          )}
          <Certifications />
        </section>

        <section className="section" aria-labelledby="projects">
          <div className="section-heading">
            <p className="section-kicker">03 / Selected work</p>
            <h2 id="projects" tabIndex={-1}>
              Projects / Achievements
            </h2>
          </div>
          {projectViewModels === null ? (
            <>
              <PendingNotice message="The required project names are known, but owner-approved descriptions, technologies, achievements, and destination URLs have not been supplied." />
              <PendingProjectCards />
            </>
          ) : (
            <div className="project-grid">
              {projectViewModels.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>

        <CommandExplorer
          journeyStages={resolvedContent?.journeyStages ?? null}
          superpowerStatement={resolvedContent?.superpowerStatement ?? null}
          onNavigate={handleNavigate}
        />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div>
            <p className="site-footer__name">{portfolioOwnerName}</p>
            <p>{portfolioTitle}</p>
          </div>
          <p className="site-footer__status">
            Deployment verified on AWS Amplify Hosting.
            <a href="https://production.de88a9ko9s0fe.amplifyapp.com/">
              Open the live portfolio
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
