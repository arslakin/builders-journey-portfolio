import { portfolioContentSource } from '../../src/content/portfolio.ts';
import {
  validatePortfolioContentSource,
  type ContentValidationDiagnostic,
} from '../../src/domain/content-validation.ts';
import {
  createFinding,
  createLocation,
  createReport,
  type ValidationFinding,
  type ValidationReport,
} from './types.ts';

export interface ProductionContentValidationAdapter {
  readonly validate: () =>
    | Promise<readonly ValidationFinding[]>
    | readonly ValidationFinding[];
}

function locationForContentDiagnostic(
  diagnostic: ContentValidationDiagnostic,
): ReturnType<typeof createLocation> {
  const sourceFile = diagnostic.path.startsWith('projects')
    ? 'src/content/projects.ts'
    : 'src/content/portfolio.ts';

  return createLocation(
    `${sourceFile}#${diagnostic.path}`,
    'repository',
  );
}

/** Real production adapter over the same centralized source used by the app. */
export const productionContentValidationAdapter = Object.freeze({
  validate: (): readonly ValidationFinding[] => {
    const result = validatePortfolioContentSource(portfolioContentSource);
    if (result.status === 'valid') {
      return Object.freeze([]);
    }

    return Object.freeze(
      result.diagnostics.map((diagnostic) =>
        createFinding(
          diagnostic.code,
          locationForContentDiagnostic(diagnostic),
        ),
      ),
    );
  },
}) satisfies ProductionContentValidationAdapter;

export async function validateProductionContent(
  adapter: ProductionContentValidationAdapter | null = productionContentValidationAdapter,
): Promise<ValidationReport> {
  if (adapter === null) {
    return createReport('verified content', [
      createFinding(
        'CNT001',
        createLocation('src/content', 'repository'),
      ),
    ]);
  }

  return createReport('verified content', await adapter.validate());
}
