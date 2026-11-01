import { readFile } from 'node:fs/promises';
import * as path from 'node:path';

import { safeRelativePath } from './file-system.ts';
import {
  environmentFileNamesForMode,
  isForbiddenPublicClientKey,
  isPublicClientKey,
  PUBLIC_CLIENT_CONFIGURATION,
  PUBLIC_CLIENT_KEY_PREFIX,
  type ClientEnvironmentMode,
  type PublicClientConfigurationRule,
} from './policy.ts';
import {
  createFinding,
  createLocation,
  createReport,
  type SafeValidationLocation,
  type ValidationFinding,
  type ValidationReport,
} from './types.ts';

export interface ClientConfigurationEntry {
  readonly key: string;
  readonly location: SafeValidationLocation;
  readonly value: string;
}

export interface LoadedClientConfiguration {
  readonly entries: readonly ClientConfigurationEntry[];
  readonly findings: readonly ValidationFinding[];
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  );
}

function parseEnvironmentFile(
  content: string,
  displayPath: string,
): LoadedClientConfiguration {
  const entries: ClientConfigurationEntry[] = [];
  const findings: ValidationFinding[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      return;
    }

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      trimmedLine,
    );

    if (match === null) {
      if (trimmedLine.startsWith(PUBLIC_CLIENT_KEY_PREFIX)) {
        findings.push(
          createFinding(
            'CFG006',
            createLocation(displayPath, 'configuration', index + 1),
          ),
        );
      }
      return;
    }

    const key = match[1];
    const value = match[2];
    if (key === undefined || value === undefined) {
      return;
    }

    entries.push({
      key,
      location: createLocation(displayPath, 'configuration', index + 1),
      value: value.trim(),
    });
  });

  return { entries, findings };
}

export async function loadClientConfiguration(
  repositoryRoot: string,
  mode: ClientEnvironmentMode,
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<LoadedClientConfiguration> {
  const entries: ClientConfigurationEntry[] = [];
  const findings: ValidationFinding[] = [];

  for (const fileName of environmentFileNamesForMode(mode)) {
    const absolutePath = path.join(repositoryRoot, fileName);

    try {
      const parsed = parseEnvironmentFile(
        await readFile(absolutePath, 'utf8'),
        safeRelativePath(repositoryRoot, absolutePath),
      );
      entries.push(...parsed.entries);
      findings.push(...parsed.findings);
    } catch (error) {
      if (!isMissingFileError(error)) {
        findings.push(
          createFinding(
            'FS001',
            createLocation(
              safeRelativePath(repositoryRoot, absolutePath),
              'configuration',
            ),
          ),
        );
      }
    }
  }

  for (const key of Object.keys(environment).sort()) {
    const value = environment[key];
    if (value !== undefined && key.startsWith(PUBLIC_CLIENT_KEY_PREFIX)) {
      entries.push({
        key,
        location: createLocation('process environment', 'environment'),
        value,
      });
    }
  }

  return { entries, findings };
}

function safelyValidateValue(
  rule: PublicClientConfigurationRule,
  value: string,
): boolean {
  try {
    return rule.validateValue(value);
  } catch {
    return false;
  }
}

export function validateClientConfiguration(
  loaded: LoadedClientConfiguration,
  mode: ClientEnvironmentMode,
  policy: readonly PublicClientConfigurationRule[] = PUBLIC_CLIENT_CONFIGURATION,
): ValidationReport {
  const findings: ValidationFinding[] = [...loaded.findings];
  const policyLocation = createLocation(
    'scripts/validation/policy.ts',
    'configuration',
  );
  const rulesByKey = new Map<string, PublicClientConfigurationRule>();

  for (const rule of policy) {
    if (!isPublicClientKey(rule.key) || rulesByKey.has(rule.key)) {
      findings.push(createFinding('CFG005', policyLocation));
      continue;
    }

    if (isForbiddenPublicClientKey(rule.key)) {
      findings.push(createFinding('CFG002', policyLocation));
      continue;
    }

    rulesByKey.set(rule.key, rule);
  }

  const effectiveEntries = new Map<string, ClientConfigurationEntry>();
  for (const entry of loaded.entries) {
    if (!entry.key.startsWith(PUBLIC_CLIENT_KEY_PREFIX)) {
      continue;
    }

    if (isForbiddenPublicClientKey(entry.key)) {
      findings.push(createFinding('CFG002', entry.location));
      continue;
    }

    const rule = rulesByKey.get(entry.key);
    if (rule === undefined) {
      findings.push(createFinding('CFG001', entry.location));
      continue;
    }

    effectiveEntries.set(entry.key, entry);
  }

  for (const [key, rule] of rulesByKey) {
    const entry = effectiveEntries.get(key);
    const isRequired = rule.requiredIn.includes(mode);

    if (entry === undefined) {
      if (isRequired) {
        findings.push(createFinding('CFG003', policyLocation));
      }
      continue;
    }

    if (!safelyValidateValue(rule, entry.value)) {
      findings.push(createFinding('CFG004', entry.location));
    }
  }

  return createReport('production client configuration', findings);
}
