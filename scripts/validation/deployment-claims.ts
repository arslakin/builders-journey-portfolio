import { locationForTextFile, type TextFileForValidation } from './file-system.ts';
import {
  createFinding,
  createReport,
  type ValidationFinding,
  type ValidationReport,
} from './types.ts';

const completionClaimPatterns = [
  /\b(?:the\s+)?(?:site|website|portfolio|application|app|production)\s+(?:is|was|has been)\s+(?:now\s+|successfully\s+)?(?:live|deployed|published|hosted)\b/i,
  /\bdeployment\s+(?:is|was|has been)\s+(?:successfully\s+)?(?:complete|completed|successful)\b/i,
  /\b(?:successfully\s+)?deployed\s+(?:to|on|via|with)\s+(?:aws\s+)?amplify\b/i,
  /\blive\s+on\s+(?:aws\s+)?amplify\b/i,
] as const;

const nonClaimContextPattern =
  /\b(?:after|before|can|check|claim|confirm|example|if|may|must|never|not|pending|planned|proposal|proposed|shall|should|unconfirmed|until|verify|when|will)\b/i;

const confirmationEvidencePattern =
  /deployment[\s_-]+confirmation(?:\s+evidence)?(?:\s+(?:record|reference))?\s*:\s*(?!(?:n\/a|none|pending|unavailable|unconfirmed)\b)\S+/i;

function isPublicationSurface(relativePath: string): boolean {
  const lowerPath = relativePath.toLowerCase();
  return (
    lowerPath === 'index.html' ||
    lowerPath.startsWith('docs/') ||
    lowerPath.startsWith('public/') ||
    lowerPath.startsWith('src/') ||
    /^readme(?:\.[^/]+)?$/.test(lowerPath)
  );
}

function containsCompletionClaim(line: string): boolean {
  return (
    !nonClaimContextPattern.test(line) &&
    completionClaimPatterns.some((pattern) => pattern.test(line))
  );
}

export function validateDeploymentCompletionClaims(
  files: readonly TextFileForValidation[],
): ValidationReport {
  const publicationFiles = files.filter((file) =>
    isPublicationSurface(file.relativePath),
  );
  const hasConfirmationEvidence = publicationFiles.some((file) =>
    confirmationEvidencePattern.test(file.content),
  );
  const findings: ValidationFinding[] = [];

  if (!hasConfirmationEvidence) {
    for (const file of publicationFiles) {
      file.content.split(/\r?\n/).forEach((line, index) => {
        if (containsCompletionClaim(line)) {
          findings.push(
            createFinding('DPL001', locationForTextFile(file, index + 1)),
          );
        }
      });
    }
  }

  return createReport('deployment completion claims', findings);
}
