import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';
import { BOUNDED_CONTEXTS } from '../config';

const CONTROLLER_FORBIDDEN_IMPORT =
  /(?:prisma\.service|infrastructure\/database\/prisma|@nestjs\/bullmq|bullmq|openai|@supabase\/supabase-js|axios)/i;

export const arch001ControllerIsolation: RuleDefinition = {
  id: 'ARCH_001',
  name: 'Controller Presentation Isolation',
  category: 'ARCH',
  severity: 'ERROR',
  description:
    'Controllers must not import PrismaService, database models, BullMQ queues, WorkflowService, or vendor SDKs.',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.controller.ts')) return [];
    const violations: Violation[] = [];

    ts.forEachChild(ctx.sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        if (CONTROLLER_FORBIDDEN_IMPORT.test(moduleSpecifier)) {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (ctx.isIgnored('ARCH_001', lineNum)) return;

          violations.push({
            ruleId: 'ARCH_001',
            ruleName: 'Controller Presentation Isolation',
            category: 'ARCH',
            severity: 'ERROR',
            filePath: ctx.filePath,
            relPath: ctx.relPath,
            line: lineNum,
            column: character + 1,
            snippet: ctx.lines[line]?.trim(),
            message: `Controller imports forbidden infrastructure component: "${moduleSpecifier}"`,
            remediation:
              'Delegate business and infrastructure logic to a Use Case Service. Do not import database or queue services directly in controllers.',
          });
        }
      }
    });

    return violations;
  },
};

export const arch002CoreIndependence: RuleDefinition = {
  id: 'ARCH_002',
  name: 'Core Layer Independence',
  category: 'ARCH',
  severity: 'ERROR',
  description:
    'Core layer must not depend on or import from Business Modules (@modules/*).',
  check: (ctx) => {
    if (
      !ctx.relPath.startsWith('core/') ||
      ctx.relPath.includes('common.module.ts') ||
      ctx.relPath.endsWith('.spec.ts')
    ) {
      return [];
    }
    const violations: Violation[] = [];

    ts.forEachChild(ctx.sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;
        if (
          moduleSpecifier.startsWith('@modules/') ||
          moduleSpecifier.includes('/modules/')
        ) {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (ctx.isIgnored('ARCH_002', lineNum)) return;

          violations.push({
            ruleId: 'ARCH_002',
            ruleName: 'Core Layer Independence',
            category: 'ARCH',
            severity: 'ERROR',
            filePath: ctx.filePath,
            relPath: ctx.relPath,
            line: lineNum,
            column: character + 1,
            snippet: ctx.lines[line]?.trim(),
            message: `Core layer file imports from business module: "${moduleSpecifier}"`,
            remediation:
              'Move shared technical definitions down to @core/ or @infra/ to avoid inverted dependencies from Core to Modules.',
          });
        }
      }
    });

    return violations;
  },
};

function getBoundedContextOf(relPath: string): string | null {
  if (!relPath.startsWith('modules/')) return null;
  const parts = relPath.replace('modules/', '').split('/');
  return parts[0] || null;
}

export const arch003BoundedContextContracts: RuleDefinition = {
  id: 'ARCH_003',
  name: 'Bounded Context Contract Enforcement',
  category: 'ARCH',
  severity: 'ERROR',
  description:
    'Cross-bounded-context communication must go exclusively through @modules/<context>/contracts or .module files.',
  check: (ctx) => {
    if (!ctx.relPath.startsWith('modules/') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const sourceContext = getBoundedContextOf(ctx.relPath);
    if (!sourceContext || !BOUNDED_CONTEXTS.has(sourceContext)) return [];

    const violations: Violation[] = [];

    ts.forEachChild(ctx.sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const importPath = (node.moduleSpecifier as ts.StringLiteral).text;

        if (importPath.startsWith('@modules/')) {
          const targetContext = importPath.replace('@modules/', '').split('/')[0];
          const isCrossContext =
            BOUNDED_CONTEXTS.has(targetContext) && targetContext !== sourceContext;

          if (isCrossContext) {
            const isAllowed =
              targetContext === 'auth'
                ? importPath === '@modules/auth/auth.module'
                : importPath === `@modules/${targetContext}/contracts` ||
                  importPath.startsWith(`@modules/${targetContext}/contracts/`) ||
                  importPath.endsWith('.module');

            if (!isAllowed) {
              const { line, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
              const lineNum = line + 1;
              if (ctx.isIgnored('ARCH_003', lineNum)) return;

              violations.push({
                ruleId: 'ARCH_003',
                ruleName: 'Bounded Context Contract Enforcement',
                category: 'ARCH',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Illegal cross-module import from [${sourceContext}] into internal file of [${targetContext}]: "${importPath}"`,
                remediation: `Import through public facade contract (@modules/${targetContext}/contracts) instead of internal paths.`,
              });
            }
          }
        }
      }
    });

    return violations;
  },
};

export const arch004TransactionIsolation: RuleDefinition = {
  id: 'ARCH_004',
  name: 'Transaction Boundary Isolation',
  category: 'ARCH',
  severity: 'ERROR',
  description:
    'Facade methods in contracts/ must not accept Prisma.TransactionClient or tx parameter across bounded contexts.',
  check: (ctx) => {
    if (!ctx.relPath.includes('/contracts/') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) {
        for (const param of node.parameters) {
          const typeText = param.type?.getText(ctx.sourceFile) ?? '';
          const paramName = param.name.getText(ctx.sourceFile);
          if (
            typeText.includes('TransactionClient') ||
            typeText.includes('Prisma.TransactionClient') ||
            paramName === 'tx' ||
            paramName === 'prismaTx'
          ) {
            const { line, character } =
              ctx.sourceFile.getLineAndCharacterOfPosition(param.getStart());
            const lineNum = line + 1;
            if (ctx.isIgnored('ARCH_004', lineNum)) continue;

            violations.push({
              ruleId: 'ARCH_004',
              ruleName: 'Transaction Boundary Isolation',
              category: 'ARCH',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message: `Public Facade method parameter "${paramName}" accepts Prisma TransactionClient across bounded context.`,
              remediation:
                'Never pass transaction client tx across bounded contexts. Use eventual consistency or outbox pattern.',
            });
          }
        }
      }
      ts.forEachChild(node, checkNode);
    };

    ts.forEachChild(ctx.sourceFile, checkNode);
    return violations;
  },
};

export const archRules: RuleDefinition[] = [
  arch001ControllerIsolation,
  arch002CoreIndependence,
  arch003BoundedContextContracts,
  arch004TransactionIsolation,
];
