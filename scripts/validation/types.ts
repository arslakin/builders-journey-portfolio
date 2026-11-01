export const VALIDATION_MESSAGES = {
  CFG001: 'A public client key is not explicitly allowlisted.',
  CFG002: 'A secret-shaped public client key is forbidden.',
  CFG003: 'A required production public client key is missing.',
  CFG004: 'A public client value does not satisfy its reviewed format.',
  CFG005: 'The public client key policy is invalid.',
  CFG006: 'A public client configuration line is malformed.',
  CNT001:
    'Structural content validation is not connected; production validation remains blocked.',
  CNT002: 'Required owner-approved content is unresolved.',
  CNT003: 'A required content field has an invalid shape.',
  CNT004: 'A required text value must be non-empty.',
  CNT005: 'Renderable factual content must include owner approval metadata.',
  CNT006: 'Verification metadata must include a non-empty source note.',
  CNT007: 'A required identifier must be a non-empty string.',
  CNT008: 'Identifiers in this collection must be unique.',
  CNT009: 'Each structurally required project name must appear exactly once.',
  CNT010:
    'A verified project destination must be an absolute HTTP or HTTPS URL.',
  CNT011:
    'A project link must match its declared verified or placeholder shape.',
  CNT012: 'Unsupported renderable fields must be removed.',
  CNT013: 'A required content collection must contain at least one item.',
  CNT014: 'Fixed portfolio identity values must match the required identity.',
  CNT015: 'Journey stages must follow Teaching, Cloud, and AI in exact order.',
  DPL001:
    'A deployment-completion claim lacks a Deployment Confirmation evidence reference.',
  FS001: 'A validation input could not be read.',
  OUT001: 'The production build output directory must be dist/.',
  OUT002: 'The production build must clean its output directory before emitting assets.',
  OUT003: 'The expected dist/ built-asset directory is unavailable.',
  SCN001: 'A possible credential value was detected.',
} as const;

export type ValidationFindingCode = keyof typeof VALIDATION_MESSAGES;

export type ValidationLocationKind =
  | 'built-asset'
  | 'configuration'
  | 'environment'
  | 'repository';

export interface SafeValidationLocation {
  readonly displayPath: string;
  readonly kind: ValidationLocationKind;
  readonly line: number | null;
}

export interface ValidationFinding {
  readonly code: ValidationFindingCode;
  readonly location: SafeValidationLocation;
  readonly message: (typeof VALIDATION_MESSAGES)[ValidationFindingCode];
}

export interface ValidationReport {
  readonly findings: readonly ValidationFinding[];
  readonly name: string;
}

export function createLocation(
  displayPath: string,
  kind: ValidationLocationKind,
  line: number | null = null,
): SafeValidationLocation {
  return { displayPath, kind, line };
}

export function createFinding(
  code: ValidationFindingCode,
  location: SafeValidationLocation,
): ValidationFinding {
  return {
    code,
    location,
    message: VALIDATION_MESSAGES[code],
  };
}

function findingIdentity(finding: ValidationFinding): string {
  return [
    finding.code,
    finding.location.kind,
    finding.location.displayPath,
    finding.location.line === null ? '' : String(finding.location.line),
  ].join('\u0000');
}

export function createReport(
  name: string,
  findings: readonly ValidationFinding[],
): ValidationReport {
  const uniqueFindings = new Map<string, ValidationFinding>();

  for (const finding of findings) {
    uniqueFindings.set(findingIdentity(finding), finding);
  }

  return {
    name,
    findings: [...uniqueFindings.values()],
  };
}

export function reportsPassed(reports: readonly ValidationReport[]): boolean {
  return reports.every((report) => report.findings.length === 0);
}
