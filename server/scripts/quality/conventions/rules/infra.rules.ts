import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';
import { PROCESS_ENV_WHITELIST } from '../config';

const VENDOR_AI_SDKS = [
  'openai',
  '@google/genai',
  '@google/generative-ai',
  '@anthropic-ai/sdk',
  'langchain',
  '@langchain/core',
];

function isVendorAiModule(specifier: string): boolean {
  return VENDOR_AI_SDKS.some(
    (sdk) => specifier === sdk || specifier.startsWith(`${sdk}/`),
  );
}

export const infra001VendorAiSdkProhibition: RuleDefinition = {
  id: 'INFRA_001',
  name: 'Direct Vendor AI SDK Prohibition',
  category: 'INFRA',
  severity: 'ERROR',
  description:
    'Direct AI vendor SDK imports and instantiations (OpenAI, Gemini, Anthropic) are prohibited outside src/infrastructure/ai/.',
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
        if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return;
        const specifier = node.moduleSpecifier.text;
        if (isVendorAiModule(specifier)) {
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
              message: `Direct import of vendor AI package "${specifier}" is forbidden outside src/infrastructure/ai/.`,
              remediation:
                'Inject OpenAiChatClient, OpenAiTranscriptionClient or AI gateways from @infrastructure/ai instead.',
            });
          }
        }
      }

      if (ts.isNewExpression(node)) {
        const className = node.expression.getText(ctx.sourceFile);
        if (className === 'OpenAI' || className === 'GoogleGenerativeAI') {
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
              message: `Direct instantiation "new ${className}(...)" is forbidden outside src/infrastructure/ai/.`,
              remediation:
                'Inject OpenAiChatClient or AI gateways from @infrastructure/ai instead.',
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
                let usesErrorHandler = false;

                const inspectMethod = (mNode: ts.Node) => {
                  if (ts.isCallExpression(mNode)) {
                    const callText = mNode.expression.getText(ctx.sourceFile);
                    if (
                      callText.includes('BullMqJobErrorHandler.handleJobExecution') ||
                      callText === 'handleJobExecution'
                    ) {
                      usesErrorHandler = true;
                    }
                  }
                  ts.forEachChild(mNode, inspectMethod);
                };

                if (member.body) {
                  inspectMethod(member.body);
                }

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

export const conf001DirectProcessEnvProhibition: RuleDefinition = {
  id: 'CONF_001',
  name: 'Direct process.env Access Prohibition',
  category: 'INFRA',
  severity: 'ERROR',
  description:
    'Direct access to process.env is forbidden in business logic. Inject ConfigService from @nestjs/config instead.',
  check: (ctx) => {
    if (
      ctx.relPath.endsWith('.spec.ts') ||
      PROCESS_ENV_WHITELIST.has(ctx.relPath)
    ) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
        const exprText = node.expression.getText(ctx.sourceFile);
        if (exprText === 'process.env') {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (!ctx.isIgnored('CONF_001', lineNum)) {
            violations.push({
              ruleId: 'CONF_001',
              ruleName: 'Direct process.env Access Prohibition',
              category: 'INFRA',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message:
                'Direct access to "process.env" in application/business code is forbidden.',
              remediation:
                'Inject ConfigService from @nestjs/config or use configuration constants.',
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

export const infraRules: RuleDefinition[] = [
  infra001VendorAiSdkProhibition,
  infra002BullMqErrorBoundary,
  infra003BootstrapLoggerWire,
  conf001DirectProcessEnvProhibition,
];
