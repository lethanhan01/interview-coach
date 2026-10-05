import * as ts from 'typescript';
import { RuleDefinition, Violation } from '../types';

function getDecorators(node: ts.Node): readonly ts.Decorator[] {
  if (ts.canHaveDecorators && ts.canHaveDecorators(node)) {
    return ts.getDecorators(node) ?? [];
  }
  const modifiers = (node as { modifiers?: ts.NodeArray<ts.ModifierLike> }).modifiers;
  if (Array.isArray(modifiers)) {
    return modifiers.filter(ts.isDecorator);
  }
  return [];
}

function getDecoratorName(decorator: ts.Decorator): string | null {
  const expr = decorator.expression;
  if (ts.isCallExpression(expr)) {
    if (ts.isIdentifier(expr.expression)) {
      return expr.expression.text;
    }
  } else if (ts.isIdentifier(expr)) {
    return expr.text;
  }
  return null;
}

function getDecoratorCall(decorator: ts.Decorator): ts.CallExpression | null {
  return ts.isCallExpression(decorator.expression) ? decorator.expression : null;
}

export const pres001DtoTyping: RuleDefinition = {
  id: 'PRES_001',
  name: 'Presentation DTO Explicit Typing',
  category: 'PRES',
  severity: 'ERROR',
  description:
    'Controllers must type @Body() and @Query() with an explicit DTO class (not any, unknown, primitive, inline object, or untyped).',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.controller.ts') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isMethodDeclaration(node)) {
        for (const param of node.parameters) {
          const decorators = getDecorators(param);
          for (const dec of decorators) {
            const decName = getDecoratorName(dec);
            if (decName === 'Body' || decName === 'Query') {
              const call = getDecoratorCall(dec);
              const hasKeyArg = call && call.arguments.length > 0;
              const typeNode = param.type;
              const typeText = typeNode ? typeNode.getText(ctx.sourceFile).trim() : '';

              const isInvalidType =
                !typeNode ||
                typeText === 'any' ||
                typeText === 'unknown' ||
                typeText === 'object' ||
                typeText === 'string' ||
                typeText === 'number' ||
                typeText === 'boolean' ||
                typeText.startsWith('{') ||
                typeText.startsWith('Record<') ||
                (typeText.startsWith('I') && /^[I][A-Z]/.test(typeText));

              if (!hasKeyArg && isInvalidType) {
                const { line, character } =
                  ctx.sourceFile.getLineAndCharacterOfPosition(param.getStart());
                const lineNum = line + 1;
                if (ctx.isIgnored('PRES_001', lineNum)) continue;

                violations.push({
                  ruleId: 'PRES_001',
                  ruleName: 'Presentation DTO Explicit Typing',
                  category: 'PRES',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[line]?.trim(),
                  message: `Method parameter decorated with @${decName}() must be typed with a dedicated DTO class instead of "${typeText || 'untyped'}".`,
                  remediation:
                    'Create or import a dedicated DTO class and use it as the parameter type.',
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

const VALIDATION_DECORATOR_REGEX =
  /^(Is[A-Z]|Validate|Type$|Transform$|Min$|Max$|Length$|Matches$|IsIn$|Array[A-Z]|Allow$)/;

const OUTPUT_DTO_REGEX =
  /(?:Response|Result|Output|Metric|Stats?|Distribution(?:Item)?|Summary|Overview|Item|Row|Detail|View|Entity|Model)Dto?$/i;

function isOutputDtoClass(className: string): boolean {
  return (
    OUTPUT_DTO_REGEX.test(className) ||
    className.startsWith('Paginated') ||
    className.endsWith('Response') ||
    className.endsWith('ResponseDto')
  );
}

const INPUT_DTO_NAME_REGEX =
  /^(?:Create|Update|Save|Submit|Login|Register|Reset|Change|Confirm|Query|Filter|Params?|Request|Input|Body|Payload|Search|Auth)/i;

const INPUT_FILE_NAME_REGEX =
  /(?:create|update|save|submit|login|register|reset|change|confirm|query|filter|param|request|input|body|payload|search|auth)/i;

function isInputDtoClass(className: string, relPath: string): boolean {
  if (isOutputDtoClass(className)) {
    return false;
  }
  const fileName = relPath.split('/').pop() || relPath;
  if (
    INPUT_DTO_NAME_REGEX.test(className) ||
    /(?:Query|Filter|Request|Input|Params?|Body|Payload)Dto?$/i.test(className) ||
    INPUT_FILE_NAME_REGEX.test(fileName)
  ) {
    return true;
  }
  return false;
}

export const pres002DtoValidation: RuleDefinition = {
  id: 'PRES_002',
  name: 'DTO Validation Decorators',
  category: 'PRES',
  severity: 'ERROR',
  description:
    'Every input DTO property must have at least one validation decorator from class-validator or class-transformer.',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.dto.ts') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        const className = node.name?.getText(ctx.sourceFile) || '';
        // Only target input DTOs (Request / Query / Param / Body / Input)
        if (!isInputDtoClass(className, ctx.relPath)) {
          return;
        }

        for (const member of node.members) {
          if (ts.isPropertyDeclaration(member)) {
            const propName = member.name.getText(ctx.sourceFile);
            const decorators = getDecorators(member);
            const decoratorNames = decorators
              .map(getDecoratorName)
              .filter((n): n is string => n !== null);

            const hasValidationDecorator = decoratorNames.some((n) =>
              VALIDATION_DECORATOR_REGEX.test(n),
            );

            if (!hasValidationDecorator) {
              const { line, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(member.getStart());
              const lineNum = line + 1;
              if (ctx.isIgnored('PRES_002', lineNum)) continue;

              violations.push({
                ruleId: 'PRES_002',
                ruleName: 'DTO Validation Decorators',
                category: 'PRES',
                severity: 'ERROR',
                filePath: ctx.filePath,
                relPath: ctx.relPath,
                line: lineNum,
                column: character + 1,
                snippet: ctx.lines[line]?.trim(),
                message: `Property "${propName}" in DTO "${className}" lacks class-validator or class-transformer decorators.`,
                remediation:
                  'Add appropriate class-validator decorators (e.g. @IsString(), @IsInt(), @IsOptional()) to prevent unvalidated input.',
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

const PAGINATION_PROP_REGEX = /^(limit|take|pageSize|perPage|size)$/i;

export const pres003PaginationBound: RuleDefinition = {
  id: 'PRES_003',
  name: 'Pagination Query Bound Enforcement',
  category: 'PRES',
  severity: 'ERROR',
  description:
    'Pagination query parameters (limit, take, pageSize) must be guarded with @Max(N) where N <= 100 to prevent DoS.',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.dto.ts') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        const className = node.name?.getText(ctx.sourceFile) || '';
        // Skip response/output Swagger schemas
        if (isOutputDtoClass(className)) {
          return;
        }

        for (const member of node.members) {
          if (ts.isPropertyDeclaration(member)) {
            const propName = member.name.getText(ctx.sourceFile);
            if (PAGINATION_PROP_REGEX.test(propName)) {
              const decorators = getDecorators(member);
              let maxVal: number | null = null;
              let hasMin = false;

              for (const dec of decorators) {
                const dName = getDecoratorName(dec);
                if (dName === 'Max') {
                  const call = getDecoratorCall(dec);
                  if (call && call.arguments.length > 0) {
                    const arg = call.arguments[0];
                    if (ts.isNumericLiteral(arg)) {
                      maxVal = Number(arg.text);
                    }
                  }
                }
                if (dName === 'Min') {
                  hasMin = true;
                }
              }

              const { line: startLine, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(member.getStart());
              const { line: endLine } =
                ctx.sourceFile.getLineAndCharacterOfPosition(member.getEnd());
              const lineNum = startLine + 1;
              if (ctx.isIgnored('PRES_003', lineNum, endLine + 1)) continue;

              if (maxVal === null) {
                violations.push({
                  ruleId: 'PRES_003',
                  ruleName: 'Pagination Query Bound Enforcement',
                  category: 'PRES',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[startLine]?.trim(),
                  message: `Pagination property "${propName}" in DTO "${className}" must be guarded with @Max(100).`,
                  remediation:
                    'Add @Max(100) or @Max(N) where N <= 100 to limit the maximum number of items returned.',
                });
              } else if (maxVal > 100) {
                violations.push({
                  ruleId: 'PRES_003',
                  ruleName: 'Pagination Query Bound Enforcement',
                  category: 'PRES',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[startLine]?.trim(),
                  message: `Pagination property "${propName}" in DTO "${className}" has @Max(${maxVal}) which exceeds the 100 item safety ceiling.`,
                  remediation:
                    'Reduce @Max value to <= 100, or add "// convention-ignore: PRES_003 <reason>" if this is an explicit administrative exception.',
                });
              }

              if (!hasMin) {
                violations.push({
                  ruleId: 'PRES_003',
                  ruleName: 'Pagination Query Bound Enforcement',
                  category: 'PRES',
                  severity: 'ERROR',
                  filePath: ctx.filePath,
                  relPath: ctx.relPath,
                  line: lineNum,
                  column: character + 1,
                  snippet: ctx.lines[startLine]?.trim(),
                  message: `Pagination property "${propName}" in DTO "${className}" lacks @Min(1) lower bound guard.`,
                  remediation: 'Add @Min(1) to prevent negative or zero pagination limits.',
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

export const pres004SseSecurityAndCatch: RuleDefinition = {
  id: 'PRES_004',
  name: 'SSE Endpoint Security and Error Boundary',
  category: 'PRES',
  severity: 'ERROR',
  description:
    'Server-Sent Events (@Sse) endpoints must be protected with SseTokenGuard and wrap observable stream in catchError.',
  check: (ctx) => {
    if (!ctx.relPath.endsWith('.controller.ts') || ctx.relPath.endsWith('.spec.ts')) {
      return [];
    }
    const violations: Violation[] = [];

    const checkNode = (node: ts.Node) => {
      if (ts.isClassDeclaration(node)) {
        const classDecorators = getDecorators(node);
        const classHasSseGuard = classDecorators.some(
          (d) =>
            getDecoratorName(d) === 'UseGuards' &&
            d.getText(ctx.sourceFile).includes('SseTokenGuard'),
        );

        for (const member of node.members) {
          if (ts.isMethodDeclaration(member)) {
            const methodDecorators = getDecorators(member);
            const isSse = methodDecorators.some((d) => getDecoratorName(d) === 'Sse');

            if (isSse) {
              const methodHasSseGuard = methodDecorators.some(
                (d) =>
                  getDecoratorName(d) === 'UseGuards' &&
                  d.getText(ctx.sourceFile).includes('SseTokenGuard'),
              );

              const { line, character } =
                ctx.sourceFile.getLineAndCharacterOfPosition(member.getStart());
              const lineNum = line + 1;

              if (!classHasSseGuard && !methodHasSseGuard) {
                if (!ctx.isIgnored('PRES_004', lineNum)) {
                  violations.push({
                    ruleId: 'PRES_004',
                    ruleName: 'SSE Endpoint Security and Error Boundary',
                    category: 'PRES',
                    severity: 'ERROR',
                    filePath: ctx.filePath,
                    relPath: ctx.relPath,
                    line: lineNum,
                    column: character + 1,
                    snippet: ctx.lines[line]?.trim(),
                    message:
                      'SSE endpoint is missing @UseGuards(SseTokenGuard) protection.',
                    remediation:
                      'Add @UseGuards(SseTokenGuard) to the SSE endpoint to validate query ticket before opening long-lived connection.',
                  });
                }
              }

              let hasCatchError = false;
              const inspectMethod = (mChild: ts.Node) => {
                if (ts.isCallExpression(mChild)) {
                  const callText = mChild.expression.getText(ctx.sourceFile);
                  if (callText === 'catchError' || callText.endsWith('.catchError')) {
                    hasCatchError = true;
                  }
                }
                ts.forEachChild(mChild, inspectMethod);
              };

              if (member.body) {
                inspectMethod(member.body);
              }

              if (!hasCatchError) {
                if (!ctx.isIgnored('PRES_004', lineNum)) {
                  violations.push({
                    ruleId: 'PRES_004',
                    ruleName: 'SSE Endpoint Security and Error Boundary',
                    category: 'PRES',
                    severity: 'ERROR',
                    filePath: ctx.filePath,
                    relPath: ctx.relPath,
                    line: lineNum,
                    column: character + 1,
                    snippet: ctx.lines[line]?.trim(),
                    message:
                      'SSE endpoint observable stream is missing .pipe(catchError(...)) error envelope.',
                    remediation:
                      'Pipe catchError to transform stream exceptions into standardized error SSE events instead of abruptly dropping the socket.',
                  });
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

export const presRules: RuleDefinition[] = [
  pres001DtoTyping,
  pres002DtoValidation,
  pres003PaginationBound,
  pres004SseSecurityAndCatch,
];
