import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import * as path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadClientConfiguration,
  validateClientConfiguration,
  type ClientConfigurationEntry,
  type LoadedClientConfiguration,
} from '../../scripts/validation/client-configuration.ts';
import type { TextFileForValidation } from '../../scripts/validation/file-system.ts';
import {
  environmentFileNamesForMode,
  PUBLIC_CLIENT_KEY_PREFIX,
  type PublicClientConfigurationRule,
  type PublicClientKey,
} from '../../scripts/validation/policy.ts';
import { scanFilesForSecretsAndClientConfiguration } from '../../scripts/validation/secret-scan.ts';
import { validateStaticOutputConfiguration } from '../../scripts/validation/static-output.ts';
import {
  createLocation,
  reportsPassed,
  type ValidationReport,
} from '../../scripts/validation/types.ts';

const temporaryDirectories = new Set<string>();

async function createTemporaryRepository(): Promise<string> {
  const directory = await mkdtemp(
    path.join(tmpdir(), 'portfolio-validation-unit-'),
  );
  temporaryDirectories.add(directory);
  return directory;
}

function makePublicClientKey(suffixParts: readonly string[]): PublicClientKey {
  return `${PUBLIC_CLIENT_KEY_PREFIX}${suffixParts.join('_')}`;
}

function configurationEntry(
  key: string,
  value: string,
): ClientConfigurationEntry {
  return {
    key,
    location: createLocation('process environment', 'environment'),
    value,
  };
}

function loadedConfiguration(
  ...entries: readonly ClientConfigurationEntry[]
): LoadedClientConfiguration {
  return { entries, findings: [] };
}

function findingCodes(report: ValidationReport): readonly string[] {
  return report.findings.map(({ code }) => code);
}

function printableDiagnostics(report: ValidationReport): string {
  return report.findings
    .map(({ code, location, message }) => {
      const displayLocation =
        location.line === null
          ? location.displayPath
          : `${location.displayPath}:${String(location.line)}`;
      return `[${code}] ${message} (${displayLocation})`;
    })
    .join('\n');
}

afterEach(async () => {
  const directories = [...temporaryDirectories];
  temporaryDirectories.clear();
  await Promise.all(
    directories.map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe('client environment selection and policy validation', () => {
  it('accepts the zero-variable production baseline', async () => {
    const repositoryRoot = await createTemporaryRepository();

    const loaded = await loadClientConfiguration(
      repositoryRoot,
      'production',
      {},
    );
    const report = validateClientConfiguration(loaded, 'production');

    expect(loaded).toStrictEqual({ entries: [], findings: [] });
    expect(report.findings).toStrictEqual([]);
    expect(reportsPassed([report])).toBe(true);
  });

  it('accepts a public client key only when an explicit rule allowlists it', () => {
    const key = makePublicClientKey(['PUBLIC', 'LABEL']);
    const value = 'public-example-label';
    const loaded = loadedConfiguration(configurationEntry(key, value));
    const rule: PublicClientConfigurationRule = {
      key,
      requiredIn: ['production'],
      validateValue: (candidate) => candidate === value,
    };

    const allowlistedReport = validateClientConfiguration(
      loaded,
      'production',
      [rule],
    );
    const unlistedReport = validateClientConfiguration(
      loaded,
      'production',
      [],
    );

    expect(allowlistedReport.findings).toStrictEqual([]);
    expect(reportsPassed([allowlistedReport])).toBe(true);
    expect(findingCodes(unlistedReport)).toStrictEqual(['CFG001']);
    expect(reportsPassed([unlistedReport])).toBe(false);
  });

  it('rejects secret-shaped public client keys with non-authenticating values', () => {
    const forbiddenKey = makePublicClientKey(['CLIENT', 'SECRET']);
    const syntheticValue = 'not-a-real-browser-setting';

    const report = validateClientConfiguration(
      loadedConfiguration(configurationEntry(forbiddenKey, syntheticValue)),
      'production',
      [],
    );

    expect(findingCodes(report)).toStrictEqual(['CFG002']);
    expect(printableDiagnostics(report)).not.toContain(syntheticValue);
    expect(JSON.stringify(report)).not.toContain(syntheticValue);
    expect(reportsPassed([report])).toBe(false);
  });

  it('loads only the selected mode and never falls back across environments', async () => {
    const repositoryRoot = await createTemporaryRepository();
    const key = makePublicClientKey(['PUBLIC', 'LABEL']);
    const developmentValue = 'development-public-example';
    const productionValue = 'production-public-example';

    await writeFile(
      path.join(repositoryRoot, '.env.production'),
      `${key}=${productionValue}\n`,
      'utf8',
    );

    const developmentWithoutOwnFile = await loadClientConfiguration(
      repositoryRoot,
      'development',
      {},
    );
    expect(developmentWithoutOwnFile.entries).toStrictEqual([]);

    await writeFile(
      path.join(repositoryRoot, '.env.development'),
      `${key}=${developmentValue}\n`,
      'utf8',
    );

    const [development, production] = await Promise.all([
      loadClientConfiguration(repositoryRoot, 'development', {}),
      loadClientConfiguration(repositoryRoot, 'production', {}),
    ]);

    expect(environmentFileNamesForMode('development')).not.toContain(
      '.env.production',
    );
    expect(environmentFileNamesForMode('production')).not.toContain(
      '.env.development',
    );
    expect(
      development.entries.map(({ location, value }) => ({
        path: location.displayPath,
        value,
      })),
    ).toStrictEqual([
      { path: '.env.development', value: developmentValue },
    ]);
    expect(
      production.entries.map(({ location, value }) => ({
        path: location.displayPath,
        value,
      })),
    ).toStrictEqual([
      { path: '.env.production', value: productionValue },
    ]);
  });
});

describe('static output configuration validation', () => {
  it('requires one clean dist output directory', () => {
    const validReport = validateStaticOutputConfiguration({
      build: { emptyOutDir: true, outDir: 'dist' },
    });
    const invalidReport = validateStaticOutputConfiguration({
      build: { emptyOutDir: false, outDir: 'other-local-output' },
    });

    expect(validReport.findings).toStrictEqual([]);
    expect(reportsPassed([validReport])).toBe(true);
    expect(findingCodes(invalidReport)).toStrictEqual(['OUT001', 'OUT002']);
    expect(reportsPassed([invalidReport])).toBe(false);
  });
});

describe('safe validation diagnostics', () => {
  it('reports only static messages and safe locations, never rejected values', () => {
    const key = makePublicClientKey(['PUBLIC', 'LABEL']);
    const rejectedPublicValue = ['synthetic', 'rejected', 'public', 'value'].join(
      '-',
    );
    const rule: PublicClientConfigurationRule = {
      key,
      requiredIn: ['production'],
      validateValue: () => false,
    };
    const configurationReport = validateClientConfiguration(
      loadedConfiguration(configurationEntry(key, rejectedPublicValue)),
      'production',
      [rule],
    );

    const sensitiveAssignmentKey = ['pass', 'word'].join('');
    const suspectedValue = ['synthetic', 'diagnostic', 'only', 'value'].join('-');
    const fixtureContent = `${sensitiveAssignmentKey}="${suspectedValue}"`;
    const localFixture: TextFileForValidation = {
      absolutePath: path.join(tmpdir(), 'validation-only.example'),
      content: fixtureContent,
      locationKind: 'repository',
      relativePath: 'unit-fixtures/validation-only.example',
    };
    const scanReport = scanFilesForSecretsAndClientConfiguration(
      [localFixture],
      'local unit fixture scan',
    );

    expect(findingCodes(configurationReport)).toStrictEqual(['CFG004']);
    expect(findingCodes(scanReport)).toStrictEqual(['SCN001']);

    const diagnostics = [configurationReport, scanReport]
      .map(printableDiagnostics)
      .join('\n');
    expect(diagnostics).toContain('process environment');
    expect(diagnostics).toContain('unit-fixtures/validation-only.example:1');
    expect(diagnostics).not.toContain(rejectedPublicValue);
    expect(diagnostics).not.toContain(suspectedValue);
    expect(diagnostics).not.toContain(fixtureContent);
    expect(JSON.stringify([configurationReport, scanReport])).not.toContain(
      rejectedPublicValue,
    );
    expect(JSON.stringify([configurationReport, scanReport])).not.toContain(
      suspectedValue,
    );
  });
});
