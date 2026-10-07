import * as ts from 'typescript';

export type RuleCategory = 'ARCH' | 'PRES' | 'ERR' | 'INFRA' | 'OBS' | 'NAME';
export type Severity = 'ERROR' | 'WARN';

export interface Violation {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  severity: Severity;
  filePath: string;
  relPath: string;
  line: number;
  column: number;
  snippet?: string;
  message: string;
  remediation: string;
}

export interface CheckContext {
  filePath: string;
  relPath: string;
  content: string;
  sourceFile: ts.SourceFile;
  lines: string[];
  isIgnored: (ruleId: string, line: number, endLine?: number) => boolean;
}

export interface RuleDefinition {
  id: string;
  name: string;
  category: RuleCategory;
  severity: Severity;
  description: string;
  check: (context: CheckContext) => Violation[];
}

export interface AuditSummary {
  totalFiles: number;
  totalRules: number;
  violations: Violation[];
  errorsCount: number;
  warningsCount: number;
  durationMs: number;
}
