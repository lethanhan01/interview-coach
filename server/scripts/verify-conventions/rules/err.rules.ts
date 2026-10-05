import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';
import { RAW_ERROR_WHITELIST } from '../config';

const STANDARD_JS_ERRORS = new Set([
  'Error',
  'TypeError',
  'RangeError',
  'SyntaxError',
  'ReferenceError',
  'URIError',
  'EvalError',
]);

const NEST_HTTP_EXCEPTIONS = new Set([
  'HttpException',
  'BadRequestException',
  'UnauthorizedException',
  'NotFoundException',
  'ForbiddenException',
  'NotAcceptableException',
  'RequestTimeoutException',
  'ConflictException',
  'GoneException',
  'PayloadTooLargeException',
  'UnsupportedMediaTypeException',
  'UnprocessableEntityException',
  'InternalServerErrorException',
  'NotImplementedException',
  'BadGatewayException',
  'ServiceUnavailableException',
  'GatewayTimeoutException',
]);

export const err001RawErrorProhibition: RuleDefinition = {
  id: 'ERR_001',
  name: 'Raw Error & Literal Throw Prohibition',
  category: 'ERR',
  severity: 'ERROR',
  description:
    'Forbid "throw new Error(...)" or throwing raw string literals. Use InterviewAIException with centralized ErrorCode enum instead.',
  check: (ctx) => {
    if (ctx.relPath.endsWith('.spec.ts') || RAW_ERROR_WHITELIST.has(ctx.relPath)) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isThrowStatement(node)) {
        if (!node.expression) return;

        // Check string literal throw: throw 'error message'
        if (ts.isStringLiteral(node.expression)) {
          const { line, character } =
            ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
          const lineNum = line + 1;
          if (!ctx.isIgnored('ERR_001', lineNum)) {
            violations.push({
              ruleId: 'ERR_001',
              ruleName: 'Raw Error & Literal Throw Prohibition',
              category: 'ERR',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message:
                'Throwing raw string literal is forbidden. Always throw InterviewAIException.',
              remediation:
                'Throw InterviewAIException(ErrorCode.XYZ, HttpStatus.XYZ, message) instead.',
            });
          }
        }

        // Check standard JS error throw: throw new Error(...)
        if (ts.isNewExpression(node.expression)) {
          const className = node.expression.expression.getText(ctx.sourceFile);
          if (STANDARD_JS_ERRORS.has(className)) {
            const { line, character } =
              ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const lineNum = line + 1;
            if (!ctx.isIgnored('ERR_001', lineNum)) {
              violations.push({
                ruleId: 'ERR_001',
                ruleName: 'Raw Error & Literal Throw Prohibition',
                category: 'ERR',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Directly throwing "new ${className}(...)" is forbidden outside runtime bootstrap whitelist.`,
                remediation:
                  'Throw InterviewAIException(ErrorCode.XYZ, HttpStatus.XYZ, message) instead.',
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

export const err002ApplicationHttpExceptionProhibition: RuleDefinition = {
  id: 'ERR_002',
  name: 'Application Layer HTTP Exception Prohibition',
  category: 'ERR',
  severity: 'ERROR',
  description:
    'Application code must not throw NestJS HTTP exceptions directly (HttpException, BadRequestException, etc.).',
  check: (ctx) => {
    if (
      ctx.relPath.endsWith('.spec.ts') ||
      ctx.relPath.includes('interview-ai-exception.filter.ts') ||
      ctx.relPath.includes('interview-ai.exception.ts')
    ) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isThrowStatement(node)) {
        if (node.expression && ts.isNewExpression(node.expression)) {
          const className = node.expression.expression.getText(ctx.sourceFile);
          if (NEST_HTTP_EXCEPTIONS.has(className)) {
            const { line, character } =
              ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
            const lineNum = line + 1;
            if (!ctx.isIgnored('ERR_002', lineNum)) {
              violations.push({
                ruleId: 'ERR_002',
                ruleName: 'Application Layer HTTP Exception Prohibition',
                category: 'ERR',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Application code throws transport-coupled "${className}".`,
                remediation:
                  'Throw domain-centric InterviewAIException(ErrorCode.XYZ, HttpStatus.XYZ, message) instead.',
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

export const err003EmptyCatchSwallow: RuleDefinition = {
  id: 'ERR_003',
  name: 'Empty Catch Clause / Silent Swallow Detection',
  category: 'ERR',
  severity: 'ERROR',
  description:
    'Catch clauses must not be empty or silently swallow exceptions without logging or re-throwing.',
  check: (ctx) => {
    if (ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isCatchClause(node)) {
        const statements = node.block.statements;
        const { line, character } =
          ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const lineNum = line + 1;

        if (statements.length === 0) {
          if (!ctx.isIgnored('ERR_003', lineNum)) {
            violations.push({
              ruleId: 'ERR_003',
              ruleName: 'Empty Catch Clause / Silent Swallow Detection',
              category: 'ERR',
              severity: 'ERROR',
              filePath: ctx.filePath,
              relPath: ctx.relPath,
              line: lineNum,
              column: character + 1,
              snippet: ctx.lines[line]?.trim(),
              message: 'Empty catch block silently swallows error.',
              remediation:
                'Log the error via AppLogger/Logger or rethrow/wrap into an InterviewAIException.',
            });
          }
        } else {
          let hasThrow = false;
          let hasReturn = false;
          let hasLogging = false;

          const inspectCatch = (cNode: ts.Node) => {
            if (ts.isThrowStatement(cNode)) {
              hasThrow = true;
            }
            if (ts.isReturnStatement(cNode)) {
              hasReturn = true;
            }
            if (ts.isCallExpression(cNode)) {
              const exprText = cNode.expression.getText(ctx.sourceFile);
              if (
                exprText.includes('logger.') ||
                exprText.includes('Logger.') ||
                exprText.includes('console.')
              ) {
                hasLogging = true;
              }
            }
            ts.forEachChild(cNode, inspectCatch);
          };

          for (const stmt of statements) {
            inspectCatch(stmt);
          }

          if (!hasThrow && !hasReturn && !hasLogging) {
            if (!ctx.isIgnored('ERR_003', lineNum)) {
              violations.push({
                ruleId: 'ERR_003',
                ruleName: 'Empty Catch Clause / Silent Swallow Detection',
                category: 'ERR',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message:
                  'Catch block neither logs, re-throws, nor returns a fallback value.',
                remediation:
                  'Explicitly handle the error by logging it, rethrowing it, or returning a well-defined fallback.',
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

function isErrorMessageProperty(expr: ts.Expression, sourceFile: ts.SourceFile): boolean {
  if (ts.isPropertyAccessExpression(expr)) {
    const prop = expr.name.text;
    const obj = expr.expression.getText(sourceFile);
    if (
      prop === 'message' &&
      (obj === 'err' ||
        obj === 'error' ||
        obj === 'e' ||
        obj.endsWith('Error'))
    ) {
      return true;
    }
  }
  return false;
}

export const err004StringErrorMatching: RuleDefinition = {
  id: 'ERR_004',
  name: 'String Error Matching Prohibition',
  category: 'ERR',
  severity: 'ERROR',
  description:
    'Do not match error messages using string equality or substring checks. Use ErrorCode, error.code, status, or instanceof.',
  check: (ctx) => {
    if (ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      // 1. Binary equality checking on err.message
      if (ts.isBinaryExpression(node)) {
        const op = node.operatorToken.kind;
        const isEquality =
          op === ts.SyntaxKind.EqualsEqualsEqualsToken ||
          op === ts.SyntaxKind.EqualsEqualsToken ||
          op === ts.SyntaxKind.ExclamationEqualsEqualsToken ||
          op === ts.SyntaxKind.ExclamationEqualsToken;

        if (isEquality) {
          const leftIsMsg = isErrorMessageProperty(node.left, ctx.sourceFile);
          const rightIsMsg = isErrorMessageProperty(node.right, ctx.sourceFile);

          if (
            (leftIsMsg && ts.isStringLiteral(node.right)) ||
            (rightIsMsg && ts.isStringLiteral(node.left))
          ) {
            const parent = node.parent;
            const isTypeof =
              ts.isTypeOfExpression(node.left) ||
              ts.isTypeOfExpression(node.right) ||
              (parent && ts.isTypeOfExpression(parent));

            if (!isTypeof) {
              const { line, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
              const lineNum = line + 1;
              if (!ctx.isIgnored('ERR_004', lineNum)) {
                violations.push({
                  ruleId: 'ERR_004',
                  ruleName: 'String Error Matching Prohibition',
                  category: 'ERR',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[line]?.trim(),
                  message:
                    'Fragile string equality comparison on error message detected.',
                  remediation:
                    'Check error code (e.g. error.code === ErrorCode.XYZ) or use instanceof checking.',
                });
              }
            }
          }
        }
      }

      // 2. Call expression substring matching: err.message.includes(...), .startsWith(...)
      if (ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node.expression)) {
          const method = node.expression.name.text;
          if (method === 'includes' || method === 'startsWith' || method === 'indexOf') {
            if (isErrorMessageProperty(node.expression.expression, ctx.sourceFile)) {
              const { line, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(node.getStart());
              const lineNum = line + 1;
              if (!ctx.isIgnored('ERR_004', lineNum)) {
                violations.push({
                  ruleId: 'ERR_004',
                  ruleName: 'String Error Matching Prohibition',
                  category: 'ERR',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[line]?.trim(),
                  message: `Fragile substring check "error.message.${method}()" detected.`,
                  remediation:
                    'Check error code (e.g. error.code === ErrorCode.XYZ) or use instanceof checking.',
                });
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

export const err005RootCausePreservation: RuleDefinition = {
  id: 'ERR_005',
  name: 'Root Cause Preservation in Catch Blocks',
  category: 'ERR',
  severity: 'ERROR',
  description:
    'When rethrowing an InterviewAIException inside a catch clause, pass { cause: error } to preserve origin stack trace.',
  check: (ctx) => {
    if (ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isCatchClause(node)) {
        const errorVarName =
          node.variableDeclaration?.name.getText(ctx.sourceFile) || 'error';

        const inspectCatchStatements = (child: ts.Node) => {
          if (ts.isNewExpression(child)) {
            const className = child.expression.getText(ctx.sourceFile);
            if (className === 'InterviewAIException') {
              // The 4th argument of InterviewAIException(code, status, message, options)
              const optionsArg = child.arguments && child.arguments[3];
              let hasCause = false;

              if (optionsArg && ts.isObjectLiteralExpression(optionsArg)) {
                for (const prop of optionsArg.properties) {
                  if (ts.isPropertyAssignment(prop) || ts.isShorthandPropertyAssignment(prop)) {
                    if (prop.name.getText(ctx.sourceFile) === 'cause') {
                      hasCause = true;
                      break;
                    }
                  }
                }
              }

              if (!hasCause) {
                const { line, character } =
                  ctx.sourceFile.getLineAndCharacterOfPosition(child.getStart());
                const lineNum = line + 1;
                if (!ctx.isIgnored('ERR_005', lineNum)) {
                  violations.push({
                    ruleId: 'ERR_005',
                    ruleName: 'Root Cause Preservation in Catch Blocks',
                    category: 'ERR',
                    severity: 'ERROR',
                    filePath: ctx.filePath,
                    relPath: ctx.relPath,
                    line: lineNum,
                    column: character + 1,
                    snippet: ctx.lines[line]?.trim(),
                    message: `InterviewAIException instantiated in catch block without { cause: ${errorVarName} }.`,
                    remediation: `Pass { cause: ${errorVarName} } as 4th argument options to preserve root cause error stack trace.`,
                  });
                }
              }
            }
          }
          ts.forEachChild(child, inspectCatchStatements);
        };

        inspectCatchStatements(node.block);
      }
      ts.forEachChild(node, checkNode);
    };

    ts.forEachChild(ctx.sourceFile, checkNode);
    return violations;
  },
};

export const errRules: RuleDefinition[] = [
  err001RawErrorProhibition,
  err002ApplicationHttpExceptionProhibition,
  err003EmptyCatchSwallow,
  err004StringErrorMatching,
  err005RootCausePreservation,
];
