import * as path from 'node:path';

import { locationForTextFile, type TextFileForValidation } from './file-system.ts';
import {
  isForbiddenPublicClientKey,
  PUBLIC_CLIENT_CONFIGURATION,
} from './policy.ts';
import {
  createFinding,
  createReport,
  type ValidationFinding,
  type ValidationReport,
} from './types.ts';

const credentialValuePatterns = [
  /\b(?:A3T[A-Z0-9]|AKIA|ASIA)[A-Z0-9]{16}\b/,
  /-----BEGIN(?: [A-Z0-9]+)* PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  /\bnpm_[A-Za-z0-9]{36,}\b/,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
  /\bAIza[A-Za-z0-9_-]{30,}\b/,
  /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*\b/i,
  /https?:\/\/[^/\s:@]+:[^/\s@]+@/i,
] as const;

const assignedValuePattern =
  /^\s*(?:export\s+)?(?:(?:const|let|var)\s+)?["']?([A-Za-z_][A-Za-z0-9_.-]*)["']?\s*(?::[^=]+)?\s*(?:=|:)\s*(.+?)\s*[,;]?\s*$/;

const clientKeyPattern = /\bVITE_[A-Z][A-Z0-9_]*\b/g;

function isSensitiveAssignmentKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    normalized.includes('accesskey') ||
    normalized.includes('apikey') ||
    normalized.includes('authtoken') ||
    normalized.includes('bearertoken') ||
    normalized.includes('clientsecret') ||
    normalized.includes('credential') ||
    normalized.includes('password') ||
    normalized.includes('passwd') ||
    normalized.includes('privatekey') ||
    normalized.includes('secret') ||
    normalized.includes('signingkey') ||
    normalized === 'token'
  );
}

function assignedLiteral(rawValue: string, relativePath: string): string | null {
  const value = rawValue.trim().replace(/[,;]\s*$/, '').trim();
  const firstCharacter = value.at(0);
  const lastCharacter = value.at(-1);

  if (
    firstCharacter !== undefined &&
    firstCharacter === lastCharacter &&
    (firstCharacter === '"' || firstCharacter === "'" || firstCharacter === '`')
  ) {
    return value.slice(1, -1).trim();
  }

  const extension = path.extname(relativePath).toLowerCase();
  const allowsBareValues =
    relativePath.includes('.env') ||
    ['.conf', '.config', '.ini', '.md', '.npmrc', '.toml', '.txt', '.yaml', '.yml'].includes(
      extension,
    );

  if (
    !allowsBareValues ||
    value.startsWith('[') ||
    value.startsWith('{') ||
    value.startsWith('/') ||
    value.includes('=>') ||
    value.startsWith('process.env') ||
    value.startsWith('import.meta.env')
  ) {
    return null;
  }

  return value.replace(/\s+#.*$/, '').trim();
}

function isNonAuthenticatingPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === '' ||
    /^(?:changeme|dummy|example|fake|placeholder|redacted|replace[-_ ]?me|sample|test[-_ ]?only|x{4,})$/.test(
      normalized,
    ) ||
    normalized.includes('${') ||
    normalized.includes('{{') ||
    normalized.includes('<your') ||
    normalized.includes('example.invalid') ||
    normalized.includes('not-a-real') ||
    normalized.includes('not_a_real')
  );
}

function lineContainsAssignedCredential(
  line: string,
  relativePath: string,
): boolean {
  const match = assignedValuePattern.exec(line);
  if (match === null) {
    return false;
  }

  const key = match[1];
  const rawValue = match[2];
  if (key === undefined || rawValue === undefined || !isSensitiveAssignmentKey(key)) {
    return false;
  }

  const value = assignedLiteral(rawValue, relativePath);
  return value !== null && !isNonAuthenticatingPlaceholder(value);
}

export function scanFilesForSecretsAndClientConfiguration(
  files: readonly TextFileForValidation[],
  reportName: string,
): ValidationReport {
  const findings: ValidationFinding[] = [];
  const allowedClientKeys = new Set<string>(
    PUBLIC_CLIENT_CONFIGURATION.map((rule) => rule.key),
  );

  for (const file of files) {
    file.content.split(/\r?\n/).forEach((line, index) => {
      const location = locationForTextFile(file, index + 1);
      const hasKnownCredentialShape = credentialValuePatterns.some((pattern) =>
        pattern.test(line),
      );

      if (
        hasKnownCredentialShape ||
        lineContainsAssignedCredential(line, file.relativePath)
      ) {
        findings.push(createFinding('SCN001', location));
      }

      for (const match of line.matchAll(clientKeyPattern)) {
        const key = match[0];
        if (isForbiddenPublicClientKey(key)) {
          findings.push(createFinding('CFG002', location));
        } else if (!allowedClientKeys.has(key)) {
          findings.push(createFinding('CFG001', location));
        }
      }
    });
  }

  return createReport(reportName, findings);
}
