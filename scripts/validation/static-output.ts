import viteConfiguration from '../../vite.config.ts';

import { EXPECTED_STATIC_OUTPUT_DIRECTORY } from './policy.ts';
import {
  createFinding,
  createLocation,
  createReport,
  type ValidationFinding,
  type ValidationReport,
} from './types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function validateStaticOutputConfiguration(
  configuration: unknown = viteConfiguration,
): ValidationReport {
  const findings: ValidationFinding[] = [];
  const location = createLocation('vite.config.ts', 'configuration');
  const build = isRecord(configuration) ? configuration['build'] : undefined;

  if (
    !isRecord(build) ||
    build['outDir'] !== EXPECTED_STATIC_OUTPUT_DIRECTORY
  ) {
    findings.push(createFinding('OUT001', location));
  }

  if (!isRecord(build) || build['emptyOutDir'] !== true) {
    findings.push(createFinding('OUT002', location));
  }

  return createReport('static output configuration', findings);
}
