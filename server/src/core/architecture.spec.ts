import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const SRC_ROOT = resolve(__dirname, '..');

const BOUNDED_CONTEXTS = new Set([
  'admin',
  'auth',
  'health',
  'interview-assessment',
  'interview-live',
  'interview-prep',
  'media',
  'user',
]);

/**
 * Danh sách whitelist các import xuyên Bounded Context được phê duyệt.
 * Mọi import giữa 2 context khác nhau phải đăng ký tại đây kèm lý do kiến trúc.
 */
const APPROVED_CROSS_MODULE_IMPORTS = new Set([
  // Auth guards & decorators dùng chung toàn hệ thống
  '@modules/auth/guards/jwt-auth.guard',
  '@modules/auth/guards/roles.guard',
  '@modules/auth/guards/sse-token.guard',
  '@modules/auth/decorators/roles.decorator',
  '@modules/auth/auth.module',

  // Interview Live -> Interview Assessment contracts
  '@modules/interview-assessment/evaluation/rubric/rubric-catalog.service',
  '@modules/interview-assessment/report/report.service',
  '@modules/interview-assessment/report/report.module',
  '@modules/interview-assessment/evaluation/evaluation.module',

  // Interview Prep -> Interview Assessment contracts
  '@modules/interview-assessment/evaluation/context-pack.service',
  '@modules/interview-assessment/evaluation/evaluation.module',

  // Interview Live -> Interview Prep contracts
  '@modules/interview-prep/question-criteria/question-criteria.service',
  '@modules/interview-prep/question-criteria/question-criteria.module',

  // Interview Live -> Media contracts
  '@modules/media/audio-object-storage.service',
  '@modules/media/upload-and-transcribe-answer-audio.service',
  '@modules/media/voice-metrics.service',
  '@modules/media/transcription-job.dto',
  '@modules/media/media.module',

  // Media -> Interview Prep & Assessment contracts
  '@modules/interview-prep/question-criteria/question-criteria.service',
  '@modules/interview-prep/question-criteria/question-criteria.module',
  '@modules/interview-assessment/report/report.service',
  '@modules/interview-assessment/report/report.module',
]);

const IMPORT_PATTERN = /from\s+['"]([^'"]+)['"]/g;

// Các import bị cấm trong Controller để tránh vi phạm Presentation layer
const CONTROLLER_FORBIDDEN_IMPORT =
  /(?:prisma\.service|infrastructure\/database\/prisma|@nestjs\/bullmq|bullmq|openai|@supabase\/supabase-js)/i;

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(file);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
      ? [file]
      : [];
  });
}

function getAllImports(file: string): string[] {
  const source = readFileSync(file, 'utf8');
  return Array.from(source.matchAll(IMPORT_PATTERN), (match) => match[1]);
}

function getBoundedContextOf(filePath: string): string | null {
  const rel = relative(SRC_ROOT, filePath).split(sep).join('/');
  if (!rel.startsWith('modules/')) return null;
  const parts = rel.replace('modules/', '').split('/');
  return parts[0] || null;
}

describe('3-Layer Clean Architecture & Bounded Contexts Boundaries', () => {
  const files = sourceFiles(SRC_ROOT);

  it('keeps controllers free of direct database services, queues, and vendor SDKs', () => {
    const violations = files
      .filter((file) => file.endsWith('.controller.ts'))
      .flatMap((file) =>
        getAllImports(file)
          .filter((importPath) => CONTROLLER_FORBIDDEN_IMPORT.test(importPath))
          .map((importPath) => `${relative(SRC_ROOT, file)} -> ${importPath}`),
      );

    expect(violations).toEqual([]);
  });

  it('prevents core layer from depending on business modules', () => {
    const coreFiles = files.filter((file) => {
      const rel = relative(SRC_ROOT, file).split(sep).join('/');
      return rel.startsWith('core/') && !rel.includes('common.module.ts');
    });

    const violations: string[] = [];
    for (const file of coreFiles) {
      for (const importPath of getAllImports(file)) {
        if (
          importPath.startsWith('@modules/') ||
          importPath.includes('/modules/')
        ) {
          violations.push(`${relative(SRC_ROOT, file)} -> ${importPath}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it('allows cross-bounded-context imports only through approved public contracts', () => {
    const violations: string[] = [];
    const moduleFiles = files.filter((file) => {
      const rel = relative(SRC_ROOT, file).split(sep).join('/');
      return rel.startsWith('modules/');
    });

    for (const file of moduleFiles) {
      const sourceContext = getBoundedContextOf(file);
      if (!sourceContext || !BOUNDED_CONTEXTS.has(sourceContext)) continue;

      for (const importPath of getAllImports(file)) {
        // Kiểm tra alias import dạng @modules/<context>/...
        if (importPath.startsWith('@modules/')) {
          const targetContext = importPath
            .replace('@modules/', '')
            .split('/')[0];
          const isCrossContext =
            BOUNDED_CONTEXTS.has(targetContext) &&
            targetContext !== sourceContext;

          if (
            isCrossContext &&
            !APPROVED_CROSS_MODULE_IMPORTS.has(importPath)
          ) {
            violations.push(
              `[${sourceContext}] ${relative(SRC_ROOT, file)} -> ${importPath}`,
            );
          }
        }

        // Kiểm tra relative import nếu có trường hợp đi xuyên module
        if (importPath.startsWith('.')) {
          const absoluteTarget = resolve(file, '..', importPath);
          const targetRel = relative(SRC_ROOT, absoluteTarget)
            .split(sep)
            .join('/');
          if (targetRel.startsWith('modules/')) {
            const targetContext = targetRel
              .replace('modules/', '')
              .split('/')[0];
            const isCrossContext =
              BOUNDED_CONTEXTS.has(targetContext) &&
              targetContext !== sourceContext;

            const normalizedTarget = `@${targetRel}`;
            if (
              isCrossContext &&
              !APPROVED_CROSS_MODULE_IMPORTS.has(normalizedTarget)
            ) {
              violations.push(
                `[${sourceContext}] ${relative(SRC_ROOT, file)} -> ${importPath} (${targetRel})`,
              );
            }
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
