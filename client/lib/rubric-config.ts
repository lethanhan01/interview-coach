// MIRROR of server/src/prisma/context-pack.data.ts — rubric data hard-code client-side.
// Nếu sửa rubric/weights ở server (rubricJson, scoringWeights), PHẢI sync tay file này.
// Không có cơ chế tự phát hiện lệch — đã verify khớp tại 2026-06-29.
import type { ContextPack, SessionType } from '@/lib/types'

export interface RubricDimension {
  code: string       // 'D1', 'TD1', ...
  nameVi: string     // tên tiêu chí
  weightPct: number  // phần trăm trong-category (integer, e.g. 20)
}

export interface RubricCategory {
  label: string
  categoryWeightPct: number  // phần trăm của điểm tổng
  dimensions: RubricDimension[]
}

const RUBRIC_DATA: Record<ContextPack, { behavioral: RubricCategory; technical: RubricCategory }> = {
  VN: {
    behavioral: {
      label: 'Tiêu chí hành vi',
      categoryWeightPct: 50,
      dimensions: [
        { code: 'D1', nameVi: 'Giao tiếp & Trình bày',      weightPct: 20 },
        { code: 'D2', nameVi: 'Tư duy & Giải quyết vấn đề', weightPct: 20 },
        { code: 'D3', nameVi: 'Làm việc nhóm',               weightPct: 15 },
        { code: 'D4', nameVi: 'Thái độ & Động lực',          weightPct: 20 },
        { code: 'D5', nameVi: 'Phù hợp văn hóa',             weightPct: 15 },
        { code: 'D6', nameVi: 'Tự nhận thức',                weightPct: 10 },
      ],
    },
    technical: {
      label: 'Tiêu chí kỹ thuật',
      categoryWeightPct: 50,
      dimensions: [
        { code: 'TD1', nameVi: 'Kiến thức nền tảng',           weightPct: 25 },
        { code: 'TD2', nameVi: 'Khả năng áp dụng thực tế',     weightPct: 25 },
        { code: 'TD3', nameVi: 'Tư duy hệ thống',              weightPct: 20 },
        { code: 'TD4', nameVi: 'Code quality & Best practices', weightPct: 20 },
        { code: 'TD5', nameVi: 'Debug & Problem-solving',       weightPct: 10 },
      ],
    },
  },
  Western: {
    behavioral: {
      label: 'Tiêu chí hành vi',
      categoryWeightPct: 45,
      dimensions: [
        { code: 'D1', nameVi: 'Communication & Presentation', weightPct: 20 },
        { code: 'D2', nameVi: 'Critical Thinking',            weightPct: 20 },
        { code: 'D3', nameVi: 'Collaboration & Teamwork',     weightPct: 15 },
        { code: 'D4', nameVi: 'Leadership & Initiative',      weightPct: 20 },
        { code: 'D5', nameVi: 'Culture Fit & Values',         weightPct: 15 },
        { code: 'D6', nameVi: 'Self-Awareness & Growth',      weightPct: 10 },
      ],
    },
    technical: {
      label: 'Tiêu chí kỹ thuật',
      categoryWeightPct: 55,
      dimensions: [
        { code: 'TD1', nameVi: 'Foundational Knowledge',        weightPct: 20 },
        { code: 'TD2', nameVi: 'Practical Application',         weightPct: 25 },
        { code: 'TD3', nameVi: 'Systems Thinking',              weightPct: 20 },
        { code: 'TD4', nameVi: 'Code Quality & Best Practices', weightPct: 20 },
        { code: 'TD5', nameVi: 'Debug & Problem-solving',       weightPct: 15 },
      ],
    },
  },
}

export function getRubricCategories(
  contextPackId: ContextPack,
  sessionType: SessionType,
): RubricCategory[] {
  const config = RUBRIC_DATA[contextPackId]
  if (sessionType === 'hr') return [config.behavioral]
  if (sessionType === 'technical') return [config.technical]
  return [config.behavioral, config.technical]
}

export function getRubricHint(
  contextPackId: ContextPack,
  sessionType: SessionType,
): string {
  const config = RUBRIC_DATA[contextPackId]
  if (sessionType === 'hr') {
    return `Tiêu chí hành vi: ${config.behavioral.dimensions
      .map((d) => `${d.code} ${d.nameVi} (${d.weightPct}%)`)
      .join(' · ')}`
  }
  if (sessionType === 'technical') {
    return `Tiêu chí kỹ thuật: ${config.technical.dimensions
      .map((d) => `${d.code} ${d.nameVi} (${d.weightPct}%)`)
      .join(' · ')}`
  }
  return `Hành vi ${config.behavioral.categoryWeightPct}% + Kỹ thuật ${config.technical.categoryWeightPct}%`
}
