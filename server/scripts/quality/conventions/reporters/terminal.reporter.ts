import { AuditSummary, Violation } from '../types';

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

export function renderTerminalReport(summary: AuditSummary): void {
  console.log(`\n${c.bold}${c.cyan}======================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}        BACKEND CONVENTIONS & ARCHITECTURE AUDIT REPORT               ${c.reset}`);
  console.log(`${c.bold}${c.cyan}======================================================================${c.reset}\n`);

  if (summary.violations.length === 0) {
    console.log(`${c.green}${c.bold}✔ ALL CONVENTIONS VERIFIED SUCCESSFULLY!${c.reset}`);
    console.log(`${c.gray}100% compliance across all architectural and coding rules.${c.reset}\n`);
  } else {
    // Group violations by category
    const byCategory = new Map<string, Violation[]>();
    for (const v of summary.violations) {
      const list = byCategory.get(v.category) ?? [];
      list.push(v);
      byCategory.set(v.category, list);
    }

    for (const [category, violations] of byCategory.entries()) {
      console.log(`${c.bold}${c.blue}[${category}] Rules (${violations.length} violations):${c.reset}`);

      for (const v of violations) {
        const sevColor = v.severity === 'ERROR' ? c.red : c.yellow;
        const sevTag = `${sevColor}${c.bold}[${v.severity}]${c.reset}`;
        console.log(`  ${sevTag} ${c.bold}${v.ruleId}${c.reset} - ${v.ruleName}`);
        console.log(`     ${c.gray}Location:${c.reset} ${v.relPath}:${v.line}:${v.column}`);
        console.log(`     ${c.gray}Message:${c.reset}  ${v.message}`);
        if (v.snippet) {
          console.log(`     ${c.gray}Snippet:${c.reset}  ${c.gray}${v.snippet}${c.reset}`);
        }
        console.log(`     ${c.cyan}Fix:${c.reset}      ${v.remediation}`);
        console.log('');
      }
    }
  }

  console.log(`${c.bold}----------------------------------------------------------------------${c.reset}`);
  console.log(`${c.bold}Violations by Rule:${c.reset}`);
  const ruleCounts = new Map<string, number>();
  for (const v of summary.violations) {
    ruleCounts.set(v.ruleId, (ruleCounts.get(v.ruleId) ?? 0) + 1);
  }
  for (const [rId, count] of ruleCounts.entries()) {
    console.log(`  • ${rId}: ${count}`);
  }
  console.log(`${c.bold}----------------------------------------------------------------------${c.reset}`);
  console.log(`${c.bold}Audit Summary:${c.reset}`);
  console.log(`  • Files Analyzed:  ${c.bold}${summary.totalFiles}${c.reset}`);
  console.log(`  • Rules Evaluated: ${c.bold}${summary.totalRules}${c.reset}`);
  console.log(`  • Errors:          ${summary.errorsCount > 0 ? c.red : c.green}${c.bold}${summary.errorsCount}${c.reset}`);
  console.log(`  • Warnings:        ${summary.warningsCount > 0 ? c.yellow : c.green}${c.bold}${summary.warningsCount}${c.reset}`);
  console.log(`  • Total Duration:  ${summary.durationMs}ms`);
  console.log(`${c.bold}----------------------------------------------------------------------${c.reset}\n`);
}
