import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import * as ts from 'typescript';
import { SRC_ROOT } from './config';
import { CheckContext } from './types';

export function getAllSourceFiles(dir: string = SRC_ROOT): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      return getAllSourceFiles(fullPath);
    }
    if (entry.name.endsWith('.ts')) {
      return [fullPath];
    }
    return [];
  });
}

const SUPPRESSION_REGEX = /\/\/\s*convention-ignore:\s*([A-Z0-9_]+)/i;

export function buildCheckContext(filePath: string): CheckContext {
  const content = readFileSync(filePath, 'utf8');
  const relPath = relative(SRC_ROOT, filePath).split(sep).join('/');
  const lines = content.split('\n');

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
  );

  // Parse suppressions
  const suppressedMap = new Map<number, Set<string>>();

  lines.forEach((lineText, idx) => {
    const match = lineText.match(SUPPRESSION_REGEX);
    if (match) {
      const ruleId = match[1].toUpperCase();
      const lineNum = idx + 1; // 1-indexed

      // Suppress on the current line and the next line
      const currSet = suppressedMap.get(lineNum) ?? new Set<string>();
      currSet.add(ruleId);
      suppressedMap.set(lineNum, currSet);

      const nextSet = suppressedMap.get(lineNum + 1) ?? new Set<string>();
      nextSet.add(ruleId);
      suppressedMap.set(lineNum + 1, nextSet);
    }
  });

  const isIgnored = (ruleId: string, startLine: number, endLine?: number): boolean => {
    const to = endLine ?? startLine;
    for (let l = startLine; l <= to; l++) {
      const set = suppressedMap.get(l);
      if (set && (set.has(ruleId.toUpperCase()) || set.has('ALL'))) {
        return true;
      }
    }
    return false;
  };

  return {
    filePath,
    relPath,
    content,
    sourceFile,
    lines,
    isIgnored,
  };
}
