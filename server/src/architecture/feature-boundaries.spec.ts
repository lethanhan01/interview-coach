import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const SRC_ROOT = resolve(__dirname, '..');
const FEATURES = new Set([
  'admin',
  'assessment',
  'auth',
  'health',
  'report',
  'session',
  'turn',
  'user',
]);

// Root-level files are a feature's public API. These legacy nested paths are
// reviewed public contracts until their owners add a dedicated entry point.
const APPROVED_INTERNAL_IMPORTS = new Set([
  'auth/decorators/roles.decorator',
  'auth/guards/jwt-auth.guard',
  'auth/guards/roles.guard',
  'auth/guards/sse-token.guard',
  'assessment/rubric/rubric-catalog.service',
]);
const IMPORT_PATTERN = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
const CONTROLLER_FORBIDDEN_IMPORT =
  /(?:@prisma\/client|infrastructure\/database\/prisma|@nestjs\/bullmq|bullmq|openai|supabase)/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
      ? [file]
      : [];
  });
}

function relativeImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return Array.from(source.matchAll(IMPORT_PATTERN), (match) => match[1]);
}

function featureOf(file: string): string | undefined {
  return relative(SRC_ROOT, file).split(sep)[0];
}

describe('feature boundaries', () => {
  const files = sourceFiles(SRC_ROOT);

  it('keeps controllers free of persistence, queue, and external SDK imports', () => {
    const violations = files
      .filter((file) => file.endsWith('.controller.ts'))
      .flatMap((file) =>
        relativeImports(file)
          .filter((importPath) => CONTROLLER_FORBIDDEN_IMPORT.test(importPath))
          .map((importPath) => `${relative(SRC_ROOT, file)} -> ${importPath}`),
      );

    expect(violations).toEqual([]);
  });

  it('allows cross-feature imports only through public entry points', () => {
    const violations: string[] = [];

    for (const file of files) {
      const sourceFeature = featureOf(file);
      if (!sourceFeature || !FEATURES.has(sourceFeature)) continue;

      for (const importPath of relativeImports(file)) {
        const target = resolve(file, '..', importPath);
        const targetPath = relative(SRC_ROOT, target).split(sep).join('/');
        const targetFeature = targetPath.split('/')[0];
        const isCrossFeatureImport =
          FEATURES.has(targetFeature) && targetFeature !== sourceFeature;
        const isRootLevelPublicFile = targetPath.split('/').length === 2;

        if (
          isCrossFeatureImport &&
          !isRootLevelPublicFile &&
          !APPROVED_INTERNAL_IMPORTS.has(targetPath)
        ) {
          violations.push(`${relative(SRC_ROOT, file)} -> ${targetPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
