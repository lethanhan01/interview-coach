import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const SRC_ROOT = resolve(__dirname, '..');

const BOUNDED_CONTEXTS = new Set([
  'auth',
  'candidate-profile',
  'health',
  'interview-assessment',
  'interview-live',
  'interview-prep',
  'media',
  'onet',
  'sfia',
  'user',
]);

/**
 * Kiểm tra xem một import xuyên Bounded Context có hợp lệ hay không.
 * Quy tắc:
 * 1. Module `auth`: Cho phép import guards, decorators, auth.module.
 * 2. Mọi Bounded Context khác: CHỈ được phép import từ `@modules/<context>/contracts` (hoặc public contract index/file) hoặc các file `.module` để đăng ký DI.
 * 3. Tuyệt đối CẤM import trực tiếp vào các service/file nội bộ khác của module ngoại lai.
 */
function isAllowedCrossModuleImport(
  importPath: string,
  targetContext: string,
): boolean {
  // Module auth chỉ cho phép import .module để đăng ký DI (guards/decorators nay chuyển về @core/common)
  if (targetContext === 'auth') {
    return importPath === '@modules/auth/auth.module';
  }

  // Giao tiếp qua Public Contracts
  if (
    importPath === `@modules/${targetContext}/contracts` ||
    importPath.startsWith(`@modules/${targetContext}/contracts/`)
  ) {
    return true;
  }

  // Import NestJS Module để nạp vào imports: [...]
  if (importPath.endsWith('.module')) {
    return true;
  }

  return false;
}

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
            !isAllowedCrossModuleImport(importPath, targetContext)
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
              !isAllowedCrossModuleImport(normalizedTarget, targetContext)
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
