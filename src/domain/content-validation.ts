import {
  builderChallengeName,
  portfolioOwnerName,
  portfolioTitle,
  type AboutContent,
  type PortfolioContent,
  type SiteIdentity,
  type SkillCategory,
} from './identity.ts';
import {
  validateJourneyStages,
  type JourneyStageTuple,
  type JourneyValidationCode,
} from './journey.ts';
import {
  placeholderProjectLinkLabel,
  requiredProjectNames,
  type ProjectRecord,
} from './project.ts';
import type { VerifiedText, VerifiedValue } from './verified.ts';

/** Static, value-free messages suitable for local and production diagnostics. */
export const contentValidationMessages = {
  CNT002: 'Required owner-approved content is unresolved.',
  CNT003: 'A required content field has an invalid shape.',
  CNT004: 'A required text value must be non-empty.',
  CNT005: 'Renderable factual content must include owner approval metadata.',
  CNT006: 'Verification metadata must include a non-empty source note.',
  CNT007: 'A required identifier must be a non-empty string.',
  CNT008: 'Identifiers in this collection must be unique.',
  CNT009: 'Each structurally required project name must appear exactly once.',
  CNT010: 'A verified project destination must be an absolute HTTP or HTTPS URL.',
  CNT011: 'A project link must match its declared verified or placeholder shape.',
  CNT012: 'Unsupported renderable fields must be removed.',
  CNT013: 'A required content collection must contain at least one item.',
  CNT014: 'Fixed portfolio identity values must match the required identity.',
  CNT015: 'Journey stages must follow Teaching, Cloud, and AI in exact order.',
} as const;

export type ContentValidationCode = keyof typeof contentValidationMessages;

export interface ContentValidationDiagnostic {
  readonly code: ContentValidationCode;
  readonly path: string;
  readonly message: (typeof contentValidationMessages)[ContentValidationCode];
}

type NonEmptyDiagnostics = readonly [
  ContentValidationDiagnostic,
  ...ContentValidationDiagnostic[],
];

export type ContentValidationResult<Value> =
  | {
      readonly status: 'valid';
      readonly value: Value;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: 'invalid';
      readonly diagnostics: NonEmptyDiagnostics;
    };

export type ProjectRecordsValidationResult = ContentValidationResult<
  readonly ProjectRecord[]
>;

export type PortfolioContentValidationResult =
  ContentValidationResult<PortfolioContent>;

const noDiagnostics: readonly [] = Object.freeze([]);

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(record: Readonly<Record<string, unknown>>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function createDiagnostic(
  code: ContentValidationCode,
  path: string,
): ContentValidationDiagnostic {
  return Object.freeze({
    code,
    path,
    message: contentValidationMessages[code],
  });
}

function validResult<Value>(value: Value): ContentValidationResult<Value> {
  return Object.freeze({
    status: 'valid',
    value,
    diagnostics: noDiagnostics,
  });
}

function invalidResult<Value>(
  diagnostics: readonly ContentValidationDiagnostic[],
): ContentValidationResult<Value> {
  const uniqueDiagnostics = new Map<string, ContentValidationDiagnostic>();

  for (const diagnostic of diagnostics) {
    uniqueDiagnostics.set(`${diagnostic.code}\u0000${diagnostic.path}`, diagnostic);
  }

  const [firstDiagnostic, ...remainingDiagnostics] = uniqueDiagnostics.values();
  if (firstDiagnostic === undefined) {
    throw new Error('An invalid content result requires a diagnostic.');
  }

  const nonEmptyDiagnostics: [
    ContentValidationDiagnostic,
    ...ContentValidationDiagnostic[],
  ] = [firstDiagnostic, ...remainingDiagnostics];

  return Object.freeze({
    status: 'invalid',
    diagnostics: Object.freeze(nonEmptyDiagnostics),
  });
}

function appendFieldPath(path: string, field: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(field)
    ? `${path}.${field}`
    : `${path}[unsupported-field]`;
}

function validateAllowedFields(
  record: Readonly<Record<string, unknown>>,
  allowedFields: readonly string[],
  path: string,
  diagnostics: ContentValidationDiagnostic[],
  code: ContentValidationCode = 'CNT012',
): void {
  const allowed = new Set(allowedFields);

  for (const field of Object.keys(record)) {
    if (!allowed.has(field)) {
      diagnostics.push(createDiagnostic(code, appendFieldPath(path, field)));
    }
  }
}

function validateVerifiedText(
  candidate: unknown,
  path: string,
  diagnostics: ContentValidationDiagnostic[],
): candidate is VerifiedValue<VerifiedText> {
  const initialDiagnosticCount = diagnostics.length;

  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return false;
  }

  validateAllowedFields(
    candidate,
    ['value', 'verification'],
    path,
    diagnostics,
  );

  if (
    typeof candidate['value'] !== 'string' ||
    candidate['value'].trim().length === 0
  ) {
    diagnostics.push(createDiagnostic('CNT004', `${path}.value`));
  }

  const verification = candidate['verification'];
  if (!isRecord(verification)) {
    diagnostics.push(
      createDiagnostic('CNT005', `${path}.verification.approvedByOwner`),
      createDiagnostic('CNT006', `${path}.verification.sourceNote`),
    );
    return false;
  }

  validateAllowedFields(
    verification,
    ['approvedByOwner', 'sourceNote'],
    `${path}.verification`,
    diagnostics,
  );

  if (verification['approvedByOwner'] !== true) {
    diagnostics.push(
      createDiagnostic('CNT005', `${path}.verification.approvedByOwner`),
    );
  }

  if (
    typeof verification['sourceNote'] !== 'string' ||
    verification['sourceNote'].trim().length === 0
  ) {
    diagnostics.push(
      createDiagnostic('CNT006', `${path}.verification.sourceNote`),
    );
  }

  return diagnostics.length === initialDiagnosticCount;
}

function validateIdentifier(
  candidate: unknown,
  path: string,
  diagnostics: ContentValidationDiagnostic[],
): candidate is string {
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return true;
  }

  diagnostics.push(createDiagnostic('CNT007', path));
  return false;
}

function validateUniqueIdentifiers(
  records: readonly unknown[],
  collectionPath: string,
  diagnostics: ContentValidationDiagnostic[],
): void {
  const firstIndexById = new Map<string, number>();

  records.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      return;
    }

    const id = candidate['id'];
    if (typeof id !== 'string' || id.trim().length === 0) {
      return;
    }

    if (firstIndexById.has(id)) {
      diagnostics.push(
        createDiagnostic('CNT008', `${collectionPath}[${String(index)}].id`),
      );
      return;
    }

    firstIndexById.set(id, index);
  });
}

function isValidVerifiedUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

function validateProjectLink(
  candidate: unknown,
  path: string,
  diagnostics: ContentValidationDiagnostic[],
): void {
  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return;
  }

  if (candidate['kind'] === 'verified') {
    validateAllowedFields(
      candidate,
      ['kind', 'label', 'url'],
      path,
      diagnostics,
      'CNT011',
    );
    validateVerifiedText(candidate['label'], `${path}.label`, diagnostics);

    const urlIsVerified = validateVerifiedText(
      candidate['url'],
      `${path}.url`,
      diagnostics,
    );
    if (
      urlIsVerified &&
      isRecord(candidate['url']) &&
      typeof candidate['url']['value'] === 'string' &&
      !isValidVerifiedUrl(candidate['url']['value'])
    ) {
      diagnostics.push(createDiagnostic('CNT010', `${path}.url.value`));
    }
    return;
  }

  if (candidate['kind'] === 'placeholder') {
    validateAllowedFields(
      candidate,
      ['kind', 'label'],
      path,
      diagnostics,
      'CNT011',
    );

    if (candidate['label'] !== placeholderProjectLinkLabel) {
      diagnostics.push(createDiagnostic('CNT011', `${path}.label`));
    }
    return;
  }

  diagnostics.push(createDiagnostic('CNT011', `${path}.kind`));
}

function validateProjectRecord(
  candidate: unknown,
  index: number,
  diagnostics: ContentValidationDiagnostic[],
): void {
  const path = `projects[${String(index)}]`;
  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return;
  }

  validateAllowedFields(
    candidate,
    ['id', 'name', 'description', 'technologies', 'achievement', 'link'],
    path,
    diagnostics,
  );
  validateIdentifier(candidate['id'], `${path}.id`, diagnostics);
  validateVerifiedText(candidate['name'], `${path}.name`, diagnostics);
  validateVerifiedText(
    candidate['description'],
    `${path}.description`,
    diagnostics,
  );

  const technologies = candidate['technologies'];
  if (!Array.isArray(technologies)) {
    diagnostics.push(createDiagnostic('CNT003', `${path}.technologies`));
  } else {
    if (technologies.length === 0) {
      diagnostics.push(createDiagnostic('CNT013', `${path}.technologies`));
    }

    technologies.forEach((technology, technologyIndex) => {
      validateVerifiedText(
        technology,
        `${path}.technologies[${String(technologyIndex)}]`,
        diagnostics,
      );
    });
  }

  if (hasOwn(candidate, 'achievement')) {
    validateVerifiedText(
      candidate['achievement'],
      `${path}.achievement`,
      diagnostics,
    );
  }

  validateProjectLink(candidate['link'], `${path}.link`, diagnostics);
}

function validateRequiredProjectCardinality(
  records: readonly unknown[],
  diagnostics: ContentValidationDiagnostic[],
): void {
  for (const requiredName of requiredProjectNames) {
    let count = 0;

    for (const candidate of records) {
      if (
        isRecord(candidate) &&
        isRecord(candidate['name']) &&
        candidate['name']['value'] === requiredName
      ) {
        count += 1;
      }
    }

    if (count !== 1) {
      diagnostics.push(
        createDiagnostic(
          'CNT009',
          `projects.requiredProjectNames["${requiredName}"]`,
        ),
      );
    }
  }
}

/**
 * Validates the complete project collection without changing, filling, or
 * downgrading any record. Invalid data returns diagnostics only.
 */
export function validateProjectRecords(
  candidate: unknown,
): ProjectRecordsValidationResult {
  const diagnostics: ContentValidationDiagnostic[] = [];
  const records: readonly unknown[] = Array.isArray(candidate) ? candidate : [];

  if (!Array.isArray(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', 'projects'));
  }

  records.forEach((record, index) => {
    validateProjectRecord(record, index, diagnostics);
  });
  validateUniqueIdentifiers(records, 'projects', diagnostics);
  validateRequiredProjectCardinality(records, diagnostics);

  if (diagnostics.length > 0) {
    return invalidResult(diagnostics);
  }

  return validResult(candidate as readonly ProjectRecord[]);
}

function validateIdentity(
  candidate: unknown,
  diagnostics: ContentValidationDiagnostic[],
): candidate is SiteIdentity {
  const initialDiagnosticCount = diagnostics.length;
  const path = 'identity';

  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return false;
  }

  validateAllowedFields(
    candidate,
    ['title', 'ownerName', 'challengeName', 'presentationCopy'],
    path,
    diagnostics,
  );

  if (candidate['title'] !== portfolioTitle) {
    diagnostics.push(createDiagnostic('CNT014', `${path}.title`));
  }
  if (candidate['ownerName'] !== portfolioOwnerName) {
    diagnostics.push(createDiagnostic('CNT014', `${path}.ownerName`));
  }
  if (candidate['challengeName'] !== builderChallengeName) {
    diagnostics.push(createDiagnostic('CNT014', `${path}.challengeName`));
  }
  if (hasOwn(candidate, 'presentationCopy')) {
    validateVerifiedText(
      candidate['presentationCopy'],
      `${path}.presentationCopy`,
      diagnostics,
    );
  }

  return diagnostics.length === initialDiagnosticCount;
}

function validateAbout(
  candidate: unknown,
  diagnostics: ContentValidationDiagnostic[],
): candidate is AboutContent {
  const initialDiagnosticCount = diagnostics.length;
  const path = 'about';

  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return false;
  }

  validateAllowedFields(
    candidate,
    ['teaching', 'cloudEngineering', 'artificialIntelligence', 'connection'],
    path,
    diagnostics,
  );
  validateVerifiedText(candidate['teaching'], `${path}.teaching`, diagnostics);
  validateVerifiedText(
    candidate['cloudEngineering'],
    `${path}.cloudEngineering`,
    diagnostics,
  );
  validateVerifiedText(
    candidate['artificialIntelligence'],
    `${path}.artificialIntelligence`,
    diagnostics,
  );
  validateVerifiedText(candidate['connection'], `${path}.connection`, diagnostics);

  return diagnostics.length === initialDiagnosticCount;
}

function validateSkillCategories(
  candidate: unknown,
  diagnostics: ContentValidationDiagnostic[],
): candidate is readonly SkillCategory[] {
  const initialDiagnosticCount = diagnostics.length;
  const path = 'skillCategories';

  if (!Array.isArray(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return false;
  }

  if (candidate.length === 0) {
    diagnostics.push(createDiagnostic('CNT013', path));
  }

  candidate.forEach((category, categoryIndex) => {
    const categoryPath = `${path}[${String(categoryIndex)}]`;
    if (!isRecord(category)) {
      diagnostics.push(createDiagnostic('CNT003', categoryPath));
      return;
    }

    validateAllowedFields(
      category,
      ['id', 'label', 'skills'],
      categoryPath,
      diagnostics,
    );
    validateIdentifier(category['id'], `${categoryPath}.id`, diagnostics);
    validateVerifiedText(category['label'], `${categoryPath}.label`, diagnostics);

    const skills = category['skills'];
    if (!Array.isArray(skills)) {
      diagnostics.push(createDiagnostic('CNT003', `${categoryPath}.skills`));
      return;
    }

    if (skills.length === 0) {
      diagnostics.push(createDiagnostic('CNT013', `${categoryPath}.skills`));
    }
    skills.forEach((skill, skillIndex) => {
      validateVerifiedText(
        skill,
        `${categoryPath}.skills[${String(skillIndex)}]`,
        diagnostics,
      );
    });
  });

  validateUniqueIdentifiers(candidate, path, diagnostics);
  return diagnostics.length === initialDiagnosticCount;
}

interface ResolvedRequiredContent {
  readonly status: 'resolved';
  readonly value: unknown;
}

interface UnresolvedRequiredContent {
  readonly status: 'unresolved';
}

function resolveRequiredContent(
  candidate: unknown,
  path: string,
  diagnostics: ContentValidationDiagnostic[],
): ResolvedRequiredContent | UnresolvedRequiredContent {
  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return { status: 'unresolved' };
  }

  if (candidate['kind'] === 'unresolved') {
    validateAllowedFields(candidate, ['kind', 'reason'], path, diagnostics);
    diagnostics.push(createDiagnostic('CNT002', path));
    return { status: 'unresolved' };
  }

  if (candidate['kind'] !== 'verified') {
    diagnostics.push(createDiagnostic('CNT003', `${path}.kind`));
    return { status: 'unresolved' };
  }

  validateAllowedFields(candidate, ['kind', 'value'], path, diagnostics);
  return { status: 'resolved', value: candidate['value'] };
}

function validateProjectCollectionStatus(
  candidate: unknown,
  diagnostics: ContentValidationDiagnostic[],
): boolean {
  const path = 'projectCollectionStatus';

  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', path));
    return false;
  }

  if (candidate['kind'] === 'unresolved') {
    validateAllowedFields(candidate, ['kind', 'reason'], path, diagnostics);
    diagnostics.push(createDiagnostic('CNT002', path));
    return false;
  }

  if (candidate['kind'] !== 'complete') {
    diagnostics.push(createDiagnostic('CNT003', `${path}.kind`));
    return false;
  }

  const initialDiagnosticCount = diagnostics.length;
  validateAllowedFields(candidate, ['kind'], path, diagnostics);
  return diagnostics.length === initialDiagnosticCount;
}

const journeyDiagnosticCodeMap = {
  JNY001: 'CNT015',
  JNY002: 'CNT003',
  JNY003: 'CNT015',
  JNY004: 'CNT015',
  JNY005: 'CNT004',
  JNY006: 'CNT005',
  JNY007: 'CNT006',
} as const satisfies Record<JourneyValidationCode, ContentValidationCode>;

function validateJourneyStageFields(
  candidate: unknown,
  diagnostics: ContentValidationDiagnostic[],
): void {
  if (!Array.isArray(candidate)) {
    return;
  }

  candidate.forEach((stage, index) => {
    if (!isRecord(stage)) {
      return;
    }

    const stagePath = `journeyStages[${String(index)}]`;
    validateAllowedFields(
      stage,
      ['id', 'label', 'content'],
      stagePath,
      diagnostics,
    );

    const content = stage['content'];
    if (!isRecord(content)) {
      return;
    }

    validateAllowedFields(
      content,
      ['value', 'verification'],
      `${stagePath}.content`,
      diagnostics,
    );

    const verification = content['verification'];
    if (isRecord(verification)) {
      validateAllowedFields(
        verification,
        ['approvedByOwner', 'sourceNote'],
        `${stagePath}.content.verification`,
        diagnostics,
      );
    }
  });
}

/**
 * Validates the source-to-render boundary. The function returns renderable
 * content only after every required source area and project record is valid.
 */
export function validatePortfolioContentSource(
  candidate: unknown,
): PortfolioContentValidationResult {
  const diagnostics: ContentValidationDiagnostic[] = [];

  if (!isRecord(candidate)) {
    diagnostics.push(createDiagnostic('CNT003', 'portfolioContentSource'));
    const projectResult = validateProjectRecords(undefined);
    diagnostics.push(...projectResult.diagnostics);
    return invalidResult(diagnostics);
  }

  validateAllowedFields(
    candidate,
    [
      'identity',
      'about',
      'skillCategories',
      'journeyStages',
      'superpowerStatement',
      'projects',
      'projectCollectionStatus',
    ],
    'portfolioContentSource',
    diagnostics,
  );

  const identity = validateIdentity(candidate['identity'], diagnostics)
    ? candidate['identity']
    : undefined;

  let about: AboutContent | undefined;
  const aboutSource = resolveRequiredContent(
    candidate['about'],
    'about',
    diagnostics,
  );
  if (
    aboutSource.status === 'resolved' &&
    validateAbout(aboutSource.value, diagnostics)
  ) {
    about = aboutSource.value;
  }

  let skillCategories: readonly SkillCategory[] | undefined;
  const skillSource = resolveRequiredContent(
    candidate['skillCategories'],
    'skillCategories',
    diagnostics,
  );
  if (
    skillSource.status === 'resolved' &&
    validateSkillCategories(skillSource.value, diagnostics)
  ) {
    skillCategories = skillSource.value;
  }

  let journeyStages: JourneyStageTuple | undefined;
  const journeySource = resolveRequiredContent(
    candidate['journeyStages'],
    'journeyStages',
    diagnostics,
  );
  if (journeySource.status === 'resolved') {
    validateJourneyStageFields(journeySource.value, diagnostics);
    const journeyResult = validateJourneyStages(journeySource.value);
    if (journeyResult.status === 'valid') {
      journeyStages = journeyResult.value;
    } else {
      for (const diagnostic of journeyResult.diagnostics) {
        diagnostics.push(
          createDiagnostic(
            journeyDiagnosticCodeMap[diagnostic.code],
            diagnostic.path,
          ),
        );
      }
    }
  }

  let superpowerStatement: VerifiedValue<VerifiedText> | undefined;
  const superpowerSource = resolveRequiredContent(
    candidate['superpowerStatement'],
    'superpowerStatement',
    diagnostics,
  );
  if (
    superpowerSource.status === 'resolved' &&
    validateVerifiedText(
      superpowerSource.value,
      'superpowerStatement',
      diagnostics,
    )
  ) {
    superpowerStatement = superpowerSource.value;
  }

  const projectResult = validateProjectRecords(candidate['projects']);
  diagnostics.push(...projectResult.diagnostics);
  const projectCollectionIsComplete = validateProjectCollectionStatus(
    candidate['projectCollectionStatus'],
    diagnostics,
  );

  if (
    diagnostics.length > 0 ||
    identity === undefined ||
    about === undefined ||
    skillCategories === undefined ||
    journeyStages === undefined ||
    superpowerStatement === undefined ||
    projectResult.status !== 'valid' ||
    !projectCollectionIsComplete
  ) {
    return invalidResult(diagnostics);
  }

  const value = Object.freeze({
    identity,
    about,
    skillCategories,
    journeyStages,
    superpowerStatement,
    projects: projectResult.value,
  }) satisfies PortfolioContent;

  return validResult(value);
}
