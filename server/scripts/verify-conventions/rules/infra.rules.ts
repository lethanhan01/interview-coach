import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';

export const infra001VendorAiSdkProhibition: RuleDefinition = {
  id: 'INFRA_001',
  name: 'Direct Vendor AI SDK Prohibition',
  category: 'INFRA',
  severity: 'ERROR',
  description:
    'Direct OpenAI SDK imports and instantiations are prohibited outside src/infrastructure/ai/.',
  check: (ctx) => {
    if (
      ctx.relPath.startsWith('infrastructure/ai/') ||
      ctx.relPath.endsWith('.spec.ts')
    ) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const specifier = (node.moduleSpecifier as ts.StringLiteral).text;
        if (specifier === 'openai' || specifier.startsWith('openai/')) {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (!ctx.isIgnored('INFRA_001', lineNum)) {
            violations.push({
              ruleId: 'INFRA_001',
              ruleName: 'Direct Vendor AI SDK Prohibition',
              category: 'INFRA',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message:
                'Direct import of vendor "openai" package is forbidden outside src/infrastructure/ai/.',
              remediation:
                'Inject OpenAiChatClient or OpenAiTranscriptionClient from @infrastructure/ai instead.',
            });
          }
        }
      }

      if (ts.isNewExpression(node)) {
        const className = node.expression.getText(ctx.sourceFile);
        if (className === 'OpenAI') {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (!ctx.isIgnored('INFRA_001', lineNum)) {
            violations.push({
              ruleId: 'INFRA_001',
              ruleName: 'Direct Vendor AI SDK Prohibition',
              category: 'INFRA',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message:
                'Direct instantiation "new OpenAI(...)" is forbidden outside src/infrastructure/ai/.',
              remediation:
                'Inject OpenAiChatClient or OpenAiTranscriptionClient from @infrastructure/ai instead.',
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

export const infra002BullMqErrorBoundary: RuleDefinition = {
  id: 'INFRA_002',
  name: 'BullMQ Worker Error Boundary Wrapper',
  category: 'INFRA',
  severity: 'ERROR',
  description:
    'BullMQ Processors must delegate job execution to BullMqJobErrorHandler.handleJobExecution in their process() method.',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.processor.ts') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        let isProcessor = false;
        const modifiers = (node as { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
        if (Array.isArray(modifiers)) {
          for (const m of modifiers) {
            if (ts.isDecorator(m)) {
              const text = m.getText(ctx.sourceFile);
              if (text.startsWith('@Processor')) {
                isProcessor = true;
                break;
              }
            }
          }
        }

        if (isProcessor) {
          for (const member of node.members) {
            if (ts.isMethodDeclaration(member)) {
              const methodName = member.name.getText(ctx.sourceFile);
              if (methodName === 'process') {
                const bodyText = member.body?.getText(ctx.sourceFile) || '';
                const usesErrorHandler =
                  bodyText.includes('BullMqJobErrorHandler.handleJobExecution') ||
                  bodyText.includes('handleJobExecution');

                if (!usesErrorHandler) {
                  const { line, character } =
                    ctx.sourceFile.getLineAndCharacterOfPosition(member.getStart());
                  const lineNum = line + 1;
                  if (!ctx.isIgnored('INFRA_002', lineNum)) {
                    violations.push({
                      ruleId: 'INFRA_002',
                      ruleName: 'BullMQ Worker Error Boundary Wrapper',
                      category: 'INFRA',
                      severity: 'ERROR',
                      filePath: ctx.filePath,
                      relPath: ctx.relPath,
                      line: lineNum,
                      column: character + 1,
                      snippet: ctx.lines[line]?.trim(),
                      message:
                        'BullMQ processor method "process()" does not wrap job execution with BullMqJobErrorHandler.handleJobExecution.',
                      remediation:
                        'Wrap job execution in "return BullMqJobErrorHandler.handleJobExecution(job, this.logger, async () => { ... })" to handle backoff and dead-letter queue classification.',
                    });
                  }
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, checkNode);
    };

    ts.forEachChild(ctx.sourceFile, checkNode);
    return violations;
  },
};

export const infra003BootstrapLoggerWire: RuleDefinition = {
  id: 'INFRA_003',
  name: 'Bootstrap Logger Wire Enforcement',
  category: 'INFRA',
  severity: 'ERROR',
  description:
    'src/main.ts must configure the Nest application logger with AppLogger.',
  check: (ctx) => {
    if (ctx.relPath !== 'main.ts') {
      return [];
    }
    const violations: Violation[] = [];

    const fileText = ctx.content;
    const wiresLogger =
      fileText.includes('useLogger(app.get(AppLogger))') ||
      (fileText.includes('useLogger') && fileText.includes('AppLogger'));

    if (!wiresLogger) {
      if (!ctx.isIgnored('INFRA_003', 1)) {
        violations.push({
          ruleId: 'INFRA_003',
          ruleName: 'Bootstrap Logger Wire Enforcement',
          category: 'INFRA',
          severity: 'ERROR',
          filePath: ctx.filePath,
          relPath: ctx.relPath,
          line: 1,
          column: 1,
          snippet: ctx.lines[0],
          message: 'src/main.ts does not wire AppLogger to app.useLogger().',
          remediation:
            'Call app.useLogger(app.get(AppLogger)) in both worker and HTTP bootstrap sequences.',
        });
      }
    }

    return violations;
  },
};

export const infraRules: RuleDefinition[] = [
  infra001VendorAiSdkProhibition,
  infra002BullMqErrorBoundary,
  infra003BootstrapLoggerWire,
];
