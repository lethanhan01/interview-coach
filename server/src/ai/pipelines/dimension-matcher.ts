import type { RubricDimensionEntry } from '../context-pack.service';

export interface MatchedDimension {
  id: string;
  name: string;
  baseWeight: number;
  score: number;
  matchBranch: 'exact' | 'normId' | 'code' | 'name';
}

// Regex bắt code token dạng D1, TD2, D-1 (T?D để phân biệt TD1 vs D1)
const CODE_REGEX = /\bT?D\s*\d+\b/i;

// Strip dấu tiếng Việt (U+0300–U+036F), đ/Đ→d, lowercase, bỏ ký tự không phải [a-z0-9]
function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function resolveOne(
  entry: { id: string; score: number },
  allowedDims: RubricDimensionEntry[],
): MatchedDimension | null {
  const raw = entry.id;

  // Branch 1: exact ID
  const exact = allowedDims.find((d) => d.id === raw);
  if (exact) {
    return {
      id: exact.id,
      name: exact.name,
      baseWeight: exact.weight,
      score: entry.score,
      matchBranch: 'exact',
    };
  }

  // Branch 2: normalized ID (case-insensitive, whitespace/dash stripped)
  const normRaw = normalizeKey(raw);
  const byNormId = allowedDims.find((d) => normalizeKey(d.id) === normRaw);
  if (byNormId) {
    return {
      id: byNormId.id,
      name: byNormId.name,
      baseWeight: byNormId.weight,
      score: entry.score,
      matchBranch: 'normId',
    };
  }

  // Branch 3: extract code token via regex (e.g. "D1: Giao tiếp", "TD2 - some desc")
  const codeMatch = CODE_REGEX.exec(raw);
  if (codeMatch) {
    const token = normalizeKey(codeMatch[0]);
    const byCode = allowedDims.find((d) => normalizeKey(d.id) === token);
    if (byCode) {
      return {
        id: byCode.id,
        name: byCode.name,
        baseWeight: byCode.weight,
        score: entry.score,
        matchBranch: 'code',
      };
    }
  }

  // Branch 4: match by normalized dimension name (gemma returned full name instead of ID)
  const byName = allowedDims.find((d) => normalizeKey(d.name) === normRaw);
  if (byName) {
    return {
      id: byName.id,
      name: byName.name,
      baseWeight: byName.weight,
      score: entry.score,
      matchBranch: 'name',
    };
  }

  return null;
}

// Total function: never throws. Empty array is a valid result — caller decides what to do.
export function resolveAppliedDimensions(
  applied: { id: string; score: number }[],
  allowedDims: RubricDimensionEntry[],
): MatchedDimension[] {
  const seen = new Set<string>();
  const result: MatchedDimension[] = [];

  for (const entry of applied) {
    try {
      const resolved = resolveOne(entry, allowedDims);
      if (resolved && !seen.has(resolved.id)) {
        seen.add(resolved.id);
        result.push(resolved);
      }
    } catch {
      // resolveOne should not throw, but belt-and-suspenders: skip entry on unexpected error
    }
  }

  return result;
}
