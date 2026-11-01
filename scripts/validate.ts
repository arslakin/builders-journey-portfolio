import { fileURLToPath } from 'node:url';
import * as path from 'node:path';

import { reportsPassed, type ValidationReport } from './validation/types.ts';
import {
  runBuiltAssetSecretValidation,
  runClientConfigurationValidation,
  runContentValidation,
  runDeploymentClaimValidation,
  runProductionValidation,
  runSourceSecretValidation,
  runStaticOutputValidation,
} from './validation/validators.ts';

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);

const validationCommands = [
  'assets',
  'config',
  'content',
  'deployment-claims',
  'output',
  'production',
  'source',
] as const;

type ValidationCommand = (typeof validationCommands)[number];
type ValidationRunner = () => Promise<readonly ValidationReport[]>;

function isValidationCommand(value: string): value is ValidationCommand {
  return validationCommands.some((command) => command === value);
}

const runners: Record<ValidationCommand, ValidationRunner> = {
  assets: async () => [await runBuiltAssetSecretValidation(repositoryRoot)],
  config: async () => [await runClientConfigurationValidation(repositoryRoot)],
  content: async () => [await runContentValidation()],
  'deployment-claims': async () => [
    await runDeploymentClaimValidation(repositoryRoot),
  ],
  output: () => Promise.resolve([runStaticOutputValidation()]),
  production: () => runProductionValidation(repositoryRoot),
  source: async () => [await runSourceSecretValidation(repositoryRoot)],
};

function formatLocation(report: ValidationReport, findingIndex: number): string {
  const finding = report.findings[findingIndex];
  if (finding === undefined) {
    return 'validation input';
  }

  return finding.location.line === null
    ? finding.location.displayPath
    : `${finding.location.displayPath}:${String(finding.location.line)}`;
}

function printReports(reports: readonly ValidationReport[]): void {
  for (const report of reports) {
    if (report.findings.length === 0) {
      console.log(`PASS ${report.name}`);
      continue;
    }

    console.error(`FAIL ${report.name}`);
    report.findings.forEach((finding, index) => {
      console.error(
        `  [${finding.code}] ${finding.message} (${formatLocation(report, index)})`,
      );
    });
  }
}

async function main(): Promise<void> {
  const requestedCommand = process.argv[2] ?? 'production';
  if (!isValidationCommand(requestedCommand)) {
    console.error(
      'Unknown validation command. Use production, config, content, output, deployment-claims, source, or assets.',
    );
    process.exitCode = 2;
    return;
  }

  const reports = await runners[requestedCommand]();
  printReports(reports);

  if (!reportsPassed(reports)) {
    process.exitCode = 1;
  }
}

try {
  await main();
} catch {
  // Do not serialize unexpected errors because they may contain environment or
  // file content. Focused diagnostics above contain only static messages and
  // safe locations.
  console.error('Validation could not complete safely.');
  process.exitCode = 1;
}
