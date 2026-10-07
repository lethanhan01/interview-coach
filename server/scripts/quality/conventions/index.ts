import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { SRC_ROOT, SERVER_ROOT } from './config';
import { getAllSourceFiles, buildCheckContext } from './scanner';
import { ALL_RULES } from './rules';
import { AuditSummary, Violation } from './types';
import { renderTerminalReport } from './reporters/terminal.reporter';
import { writeMarkdownReport } from './reporters/markdown.reporter';

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldWriteReport = args.includes('--report');
  const isStrict = args.includes('--strict');
  const targetRuleArg = args.find((a) => a.startsWith('--rule='));
  const targetRuleId = targetRuleArg ? targetRuleArg.split('=')[1]?.toUpperCase() : null;

  const rules = targetRuleId
    ? ALL_RULES.filter((r) => r.id.toUpperCase() === targetRuleId)
    : ALL_RULES;

  if (targetRuleId && rules.length === 0) {
    console.error(`Rule "${targetRuleId}" not found. Available rules: ${ALL_RULES.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }

  const startTime = performance.now();
  const filePaths = getAllSourceFiles(SRC_ROOT);
  const allViolations: Violation[] = [];

  for (const filePath of filePaths) {
    const ctx = buildCheckContext(filePath);
    for (const rule of rules) {
      try {
        const fileViolations = rule.check(ctx);
        if (fileViolations && fileViolations.length > 0) {
          allViolations.push(...fileViolations);
        }
      } catch (err) {
        console.error(`Error running rule ${rule.id} on ${ctx.relPath}:`, err);
        allViolations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: 'ERROR',
          filePath: ctx.filePath,
          relPath: ctx.relPath,
          line: 1,
          column: 1,
          message: `Rule ${rule.id} execution failed unexpectedly: ${err instanceof Error ? err.message : String(err)}`,
          remediation: 'Fix source file syntax error or investigate rule checker implementation.',
        });
      }
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  const errorsCount = allViolations.filter((v) => v.severity === 'ERROR').length;
  const warningsCount = allViolations.filter((v) => v.severity === 'WARN').length;

  const summary: AuditSummary = {
    totalFiles: filePaths.length,
    totalRules: rules.length,
    violations: allViolations,
    errorsCount,
    warningsCount,
    durationMs,
  };

  renderTerminalReport(summary);

  if (shouldWriteReport) {
    const reportPath = resolve(SERVER_ROOT, 'CONVENTIONS-AUDIT-REPORT.md');
    writeMarkdownReport(summary, reportPath);
    console.log(`Markdown report written to: ${reportPath}\n`);
  }

  const hasBlockingIssues = errorsCount > 0 || (isStrict && warningsCount > 0);
  process.exit(hasBlockingIssues ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal conventions checker error:', err);
  process.exit(1);
});
