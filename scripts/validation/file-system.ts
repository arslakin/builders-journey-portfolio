import type { Dirent } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import * as path from 'node:path';

import {
  createFinding,
  createLocation,
  type ValidationFinding,
  type ValidationFindingCode,
  type ValidationLocationKind,
} from './types.ts';

export interface TextFileForValidation {
  readonly absolutePath: string;
  readonly content: string;
  readonly locationKind: 'built-asset' | 'repository';
  readonly relativePath: string;
}

export interface CollectedTextFiles {
  readonly files: readonly TextFileForValidation[];
  readonly findings: readonly ValidationFinding[];
}

const textFileExtensions = new Set([
  '.bash',
  '.cjs',
  '.conf',
  '.config',
  '.css',
  '.env',
  '.html',
  '.ini',
  '.js',
  '.json',
  '.jsx',
  '.kiro',
  '.map',
  '.md',
  '.mdx',
  '.mjs',
  '.npmrc',
  '.scss',
  '.sh',
  '.svg',
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.xml',
  '.yaml',
  '.yml',
  '.zsh',
]);

const textFileNames = new Set([
  '.gitignore',
  '.npmrc',
  '.nvmrc',
  'Dockerfile',
  'LICENSE',
]);

const generatedSourceDirectories = new Set([
  '.git',
  '.turbo',
  '.vite',
  'blob-report',
  'coverage',
  'dist',
  'node_modules',
  'playwright-report',
  'test-results',
]);

function sanitizePathSegment(value: string): string {
  let sanitized = '';

  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    sanitized += codeUnit < 32 || codeUnit === 127 ? '?' : value.charAt(index);
  }

  return sanitized;
}

export function safeRelativePath(
  repositoryRoot: string,
  absolutePath: string,
): string {
  const relativePath = path.relative(repositoryRoot, absolutePath);

  if (
    relativePath === '' ||
    relativePath === '..' ||
    relativePath.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativePath)
  ) {
    return '.';
  }

  return sanitizePathSegment(relativePath.split(path.sep).join('/'));
}

function isTextFileCandidate(fileName: string): boolean {
  if (fileName.startsWith('.env')) {
    return true;
  }

  return (
    textFileNames.has(fileName) ||
    textFileExtensions.has(path.extname(fileName).toLowerCase())
  );
}

interface CollectionOptions {
  readonly baseDirectory: string;
  readonly locationKind: 'built-asset' | 'repository';
  readonly missingBaseCode: ValidationFindingCode;
  readonly repositoryRoot: string;
  readonly skippedDirectories: ReadonlySet<string>;
}

async function collectTextFiles(
  options: CollectionOptions,
): Promise<CollectedTextFiles> {
  const files: TextFileForValidation[] = [];
  const findings: ValidationFinding[] = [];

  async function walk(directory: string, isBaseDirectory: boolean): Promise<void> {
    let entries: Dirent[];

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      const code = isBaseDirectory ? options.missingBaseCode : 'FS001';
      findings.push(
        createFinding(
          code,
          createLocation(
            safeRelativePath(options.repositoryRoot, directory),
            options.locationKind,
          ),
        ),
      );
      return;
    }

    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!options.skippedDirectories.has(entry.name)) {
          await walk(absolutePath, false);
        }
        continue;
      }

      if (!entry.isFile() || !isTextFileCandidate(entry.name)) {
        continue;
      }

      try {
        const content = await readFile(absolutePath, 'utf8');
        if (content.includes('\u0000')) {
          continue;
        }

        files.push({
          absolutePath,
          content,
          locationKind: options.locationKind,
          relativePath: safeRelativePath(options.repositoryRoot, absolutePath),
        });
      } catch {
        findings.push(
          createFinding(
            'FS001',
            createLocation(
              safeRelativePath(options.repositoryRoot, absolutePath),
              options.locationKind,
            ),
          ),
        );
      }
    }
  }

  await walk(options.baseDirectory, true);
  return { files, findings };
}

export function collectRepositoryTextFiles(
  repositoryRoot: string,
): Promise<CollectedTextFiles> {
  return collectTextFiles({
    baseDirectory: repositoryRoot,
    locationKind: 'repository',
    missingBaseCode: 'FS001',
    repositoryRoot,
    skippedDirectories: generatedSourceDirectories,
  });
}

export function collectBuiltAssetTextFiles(
  repositoryRoot: string,
  outputDirectory: string,
): Promise<CollectedTextFiles> {
  return collectTextFiles({
    baseDirectory: path.resolve(repositoryRoot, outputDirectory),
    locationKind: 'built-asset',
    missingBaseCode: 'OUT003',
    repositoryRoot,
    skippedDirectories: new Set<string>(),
  });
}

export function locationForTextFile(
  file: TextFileForValidation,
  line: number,
): ReturnType<typeof createLocation> {
  const kind: ValidationLocationKind = file.locationKind;
  return createLocation(file.relativePath, kind, line);
}
