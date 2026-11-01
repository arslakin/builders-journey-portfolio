import { loadClientConfiguration, validateClientConfiguration } from './client-configuration.ts';
import { validateProductionContent } from './content-validation.ts';
import { validateDeploymentCompletionClaims } from './deployment-claims.ts';
import {
  collectBuiltAssetTextFiles,
  collectRepositoryTextFiles,
} from './file-system.ts';
import { EXPECTED_STATIC_OUTPUT_DIRECTORY } from './policy.ts';
import { scanFilesForSecretsAndClientConfiguration } from './secret-scan.ts';
import { validateStaticOutputConfiguration } from './static-output.ts';
import { createReport, type ValidationReport } from './types.ts';

export async function runClientConfigurationValidation(
  repositoryRoot: string,
): Promise<ValidationReport> {
  const loaded = await loadClientConfiguration(
    repositoryRoot,
    'production',
  );
  return validateClientConfiguration(loaded, 'production');
}

export function runStaticOutputValidation(): ValidationReport {
  return validateStaticOutputConfiguration();
}

export function runContentValidation(): Promise<ValidationReport> {
  return validateProductionContent();
}

export async function runDeploymentClaimValidation(
  repositoryRoot: string,
): Promise<ValidationReport> {
  const collected = await collectRepositoryTextFiles(repositoryRoot);
  const claimReport = validateDeploymentCompletionClaims(collected.files);
  return createReport(claimReport.name, [
    ...collected.findings,
    ...claimReport.findings,
  ]);
}

export async function runSourceSecretValidation(
  repositoryRoot: string,
): Promise<ValidationReport> {
  const collected = await collectRepositoryTextFiles(repositoryRoot);
  const scanReport = scanFilesForSecretsAndClientConfiguration(
    collected.files,
    'tracked-source secret and client configuration scan',
  );
  return createReport(scanReport.name, [
    ...collected.findings,
    ...scanReport.findings,
  ]);
}

export async function runBuiltAssetSecretValidation(
  repositoryRoot: string,
): Promise<ValidationReport> {
  const collected = await collectBuiltAssetTextFiles(
    repositoryRoot,
    EXPECTED_STATIC_OUTPUT_DIRECTORY,
  );
  const scanReport = scanFilesForSecretsAndClientConfiguration(
    collected.files,
    'built-asset secret and client configuration scan',
  );
  return createReport(scanReport.name, [
    ...collected.findings,
    ...scanReport.findings,
  ]);
}

export async function runProductionValidation(
  repositoryRoot: string,
): Promise<readonly ValidationReport[]> {
  const [clientConfiguration, content, deploymentClaims, sourceScan] =
    await Promise.all([
      runClientConfigurationValidation(repositoryRoot),
      runContentValidation(),
      runDeploymentClaimValidation(repositoryRoot),
      runSourceSecretValidation(repositoryRoot),
    ]);

  return [
    clientConfiguration,
    runStaticOutputValidation(),
    content,
    deploymentClaims,
    sourceScan,
  ];
}
