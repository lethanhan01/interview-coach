import { basename } from 'node:path';
import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';
import { CONSOLE_LOG_WHITELIST } from '../config';

const CONSOLE_METHODS = new Set(['log', 'error', 'warn', 'info', 'debug', 'trace']);

export const obs001ConsoleProhibition: RuleDefinition = {
  id: 'OBS_001',
  name: 'Direct Console Logging Prohibition',
  category: 'OBS',
  severity: 'ERROR',
  description:
    'Forbid direct console.log/error/warn/info/debug calls. Use AppLogger or NestJS Logger.',
  check: (ctx) => {
    if (
      ctx.relPath.endsWith('.spec.ts') ||
      CONSOLE_LOG_WHITELIST.has(ctx.relPath)
    ) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          if (
            ts.isIdentifier(expr.expression) &&
            expr.expression.text === 'console' &&
            CONSOLE_METHODS.has(expr.name.text)
          ) {
            const { line, character } =
              ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const lineNum = line + 1;
            if (!ctx.isIgnored('OBS_001', lineNum)) {
              violations.push({
                ruleId: 'OBS_001',
                ruleName: 'Direct Console Logging Prohibition',
                category: 'OBS',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Direct call to "console.${expr.name.text}()" detected in production code.`,
                remediation:
                  'Inject and use AppLogger or private readonly logger = new Logger(Context.name).',
              });
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

const KEBAB_CASE_FILE_REGEX =
  /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+(-[a-z0-9]+)*)*\.ts$/;

export const name001KebabCaseFiles: RuleDefinition = {
  id: 'NAME_001',
  name: 'Kebab-Case File Naming Convention',
  category: 'NAME',
  severity: 'WARN',
  description:
    'All TypeScript file names must adhere to lowercase kebab-case with dot-separated suffixes.',
  check: (ctx) => {
    const fileName = basename(ctx.filePath);
    if (fileName.endsWith('.d.ts')) return [];

    if (!KEBAB_CASE_FILE_REGEX.test(fileName)) {
      if (!ctx.isIgnored('NAME_001', 1)) {
        return [
          {
            ruleId: 'NAME_001',
            ruleName: 'Kebab-Case File Naming Convention',
            category: 'NAME',
            severity: 'WARN',
            filePath: ctx.filePath,
            relPath: ctx.relPath,
            line: 1,
            column: 1,
            snippet: fileName,
            message: `File name "${fileName}" does not conform to lowercase kebab-case convention.`,
            remediation:
              'Rename the file using lowercase letters, digits, and hyphens (e.g. "my-feature.service.ts").',
          },
        ];
      }
    }

    return [];
  },
};

const SERVICE_SUFFIXES = [
  'Service',
  'Facade',
  'Logger',
  'Dispatcher',
  'Collector',
  'Aggregator',
  'Executor',
  'Storage',
  'Context',
  'Handler',
  'Strategy',
  'Factory',
  'Manager',
  'Provider',
  'Registry',
  'ToText',
];

const COMMAND_PREFIX_REGEX =
  /^(Create|Update|Delete|Generate|Evaluate|Submit|Change|Upload|Transcribe|Stream|Record|Resolve|Build|Handle|Process)/;

const SUFFIX_MAPPING: Record<string, string[]> = {
  '.controller.ts': ['Controller'],
  '.module.ts': ['Module', 'Controller', 'Provider'],
  '.guard.ts': ['Guard'],
  '.filter.ts': ['Filter'],
  '.pipe.ts': ['Pipe'],
  '.processor.ts': ['Processor'],
  '.repository.ts': ['Repository'],
  '.service.ts': SERVICE_SUFFIXES,
};

export const name002ClassSuffixAlignment: RuleDefinition = {
  id: 'NAME_002',
  name: 'Class Suffix & PascalCase Alignment',
  category: 'NAME',
  severity: 'WARN',
  description:
    'Class names must be PascalCase and align with their architectural role suffix.',
  check: (ctx) => {
    if (ctx.relPath.endsWith('.spec.ts')) return [];
    const violations: Violation[] = [];

    let expectedSuffixes: string[] | null = null;
    const isServiceFile = ctx.relPath.endsWith('.service.ts');

    for (const [fileExt, suffixes] of Object.entries(SUFFIX_MAPPING)) {
      if (ctx.relPath.endsWith(fileExt)) {
        expectedSuffixes = suffixes;
        break;
      }
    }

    const checkNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        const { line, character } =
          ctx.sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
        const lineNum = line + 1;

        // Check PascalCase
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
          if (!ctx.isIgnored('NAME_002', lineNum)) {
            violations.push({
              ruleId: 'NAME_002',
              ruleName: 'Class Suffix & PascalCase Alignment',
              category: 'NAME',
              severity: 'WARN',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message: `Class "${className}" does not follow PascalCase naming.`,
              remediation: 'Rename the class to PascalCase.',
            });
          }
        }

        // Check suffix if applicable
        if (expectedSuffixes) {
          const matchesSuffix = expectedSuffixes.some((s) => className.endsWith(s));
          const matchesCommandPrefix = isServiceFile && COMMAND_PREFIX_REGEX.test(className);

          if (!matchesSuffix && !matchesCommandPrefix) {
            if (!ctx.isIgnored('NAME_002', lineNum)) {
              violations.push({
                ruleId: 'NAME_002',
                ruleName: 'Class Suffix & PascalCase Alignment',
                category: 'NAME',
                severity: 'WARN',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Class "${className}" in "${basename(ctx.relPath)}" should end with one of [${expectedSuffixes.slice(0, 3).join(', ')}...] or use a Command action prefix.`,
                remediation: `Append ${expectedSuffixes[0]} to the class name or align with Use Case Command naming.`,
              });
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

export const namingRules: RuleDefinition[] = [
  obs001ConsoleProhibition,
  name001KebabCaseFiles,
  name002ClassSuffixAlignment,
];
