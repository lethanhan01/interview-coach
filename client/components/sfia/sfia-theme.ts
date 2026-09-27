/**
 * SFIA 9 Design Tokens & Category Theme Mappings
 * Strictly follows Safe Dynamic Styling (Lookup Tables) per Conventions.mdx
 */

export interface SfiaCategoryTheme {
  code: string
  name: string
  nameVi: string
  badge: string
  border: string
  accent: string
  cellActive: string
  dot: string
  bgLight: string
}

export const SFIA_CATEGORY_THEMES: Record<string, SfiaCategoryTheme> = {
  STRAT_ARCH: {
    code: 'STRAT_ARCH',
    name: 'Strategy and architecture',
    nameVi: 'Chiến lược & Kiến trúc',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-blue-500',
    accent: 'text-blue-600 dark:text-blue-400',
    cellActive: 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-500/40',
    dot: 'bg-blue-500',
    bgLight: 'bg-blue-500/5',
  },
  CHG_TRANS: {
    code: 'CHG_TRANS',
    name: 'Change and transformation',
    nameVi: 'Thay đổi & Chuyển đổi',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'border-emerald-500',
    accent: 'text-emerald-600 dark:text-emerald-400',
    cellActive: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    dot: 'bg-emerald-500',
    bgLight: 'bg-emerald-500/5',
  },
  DEV_IMPL: {
    code: 'DEV_IMPL',
    name: 'Development and implementation',
    nameVi: 'Phát triển & Triển khai',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    border: 'border-violet-500',
    accent: 'text-violet-600 dark:text-violet-400',
    cellActive: 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-700 dark:text-violet-300 border-violet-500/40',
    dot: 'bg-violet-500',
    bgLight: 'bg-violet-500/5',
  },
  DELIV_OP: {
    code: 'DELIV_OP',
    name: 'Delivery and operation',
    nameVi: 'Vận hành & Cung cấp dịch vụ',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'border-cyan-500',
    accent: 'text-cyan-600 dark:text-cyan-400',
    cellActive: 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 border-cyan-500/40',
    dot: 'bg-cyan-500',
    bgLight: 'bg-cyan-500/5',
  },
  PPL_SKILL: {
    code: 'PPL_SKILL',
    name: 'People and skills',
    nameVi: 'Con người & Kỹ năng',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-amber-500',
    accent: 'text-amber-600 dark:text-amber-400',
    cellActive: 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border-amber-500/40',
    dot: 'bg-amber-500',
    bgLight: 'bg-amber-500/5',
  },
  REL_ENG: {
    code: 'REL_ENG',
    name: 'Relationships and engagement',
    nameVi: 'Quan hệ & Tương tác đối tác',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    border: 'border-rose-500',
    accent: 'text-rose-600 dark:text-rose-400',
    cellActive: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/40',
    dot: 'bg-rose-500',
    bgLight: 'bg-rose-500/5',
  },
}

export const SFIA_DEFAULT_THEME: SfiaCategoryTheme = {
  code: 'UNKNOWN',
  name: 'General',
  nameVi: 'Tổng quát',
  badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  border: 'border-slate-500',
  accent: 'text-slate-600 dark:text-slate-400',
  cellActive: 'bg-slate-500/15 hover:bg-slate-500/25 text-slate-700 dark:text-slate-300 border-slate-500/40',
  dot: 'bg-slate-500',
  bgLight: 'bg-slate-500/5',
}

export const SFIA_LEVEL_DEFINITIONS: Record<number, { name: string; nameVi: string; shortName: string; color: string }> = {
  1: { name: 'Follow', nameVi: 'Tuân thủ & Thực thi cơ bản', shortName: 'L1 - Follow', color: 'text-slate-600 dark:text-slate-400' },
  2: { name: 'Assist', nameVi: 'Hỗ trợ & Đồng hành', shortName: 'L2 - Assist', color: 'text-blue-600 dark:text-blue-400' },
  3: { name: 'Apply', nameVi: 'Áp dụng độc lập', shortName: 'L3 - Apply', color: 'text-emerald-600 dark:text-emerald-400' },
  4: { name: 'Enable', nameVi: 'Chủ động & Tạo điều kiện', shortName: 'L4 - Enable', color: 'text-cyan-600 dark:text-cyan-400' },
  5: { name: 'Ensure / Advise', nameVi: 'Đảm bảo & Cố vấn chuyên môn', shortName: 'L5 - Ensure', color: 'text-violet-600 dark:text-violet-400' },
  6: { name: 'Initiate / Influence', nameVi: 'Khởi xướng & Gây ảnh hưởng', shortName: 'L6 - Initiate', color: 'text-amber-600 dark:text-amber-400' },
  7: { name: 'Set strategy / Inspire', nameVi: 'Định hình chiến lược & Truyền cảm hứng', shortName: 'L7 - Strategy', color: 'text-rose-600 dark:text-rose-400' },
}

export function getCategoryTheme(categoryCode?: string | null): SfiaCategoryTheme {
  if (!categoryCode) return SFIA_DEFAULT_THEME
  return SFIA_CATEGORY_THEMES[categoryCode] || SFIA_DEFAULT_THEME
}

export function getCategoryName(categoryCode?: string | null): string {
  return getCategoryTheme(categoryCode).name
}

export function getLevelTheme(level: number) {
  return SFIA_LEVEL_DEFINITIONS[level] || {
    name: `Level ${level}`,
    nameVi: `Cấp độ ${level}`,
    shortName: `L${level}`,
    color: 'text-slate-600 dark:text-slate-400',
  }
}

export interface SfiaAttributeTheme {
  code: string
  name: string
  nameVi: string
  badge: string
  border: string
  accent: string
  bgLight: string
  iconName: 'Compass' | 'Users' | 'Cpu' | 'Briefcase' | 'BookOpen'
}

export const SFIA_ATTRIBUTE_THEMES: Record<string, SfiaAttributeTheme> = {
  AUTONOMY: {
    code: 'AUTONOMY',
    name: 'Autonomy',
    nameVi: 'Mức độ tự chủ',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    border: 'border-blue-500/30 dark:border-blue-500/20',
    accent: 'text-blue-600 dark:text-blue-400',
    bgLight: 'bg-blue-500/5',
    iconName: 'Compass',
  },
  INFLUENCE: {
    code: 'INFLUENCE',
    name: 'Influence',
    nameVi: 'Mức độ ảnh hưởng',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    border: 'border-violet-500/30 dark:border-violet-500/20',
    accent: 'text-violet-600 dark:text-violet-400',
    bgLight: 'bg-violet-500/5',
    iconName: 'Users',
  },
  COMPLEXITY: {
    code: 'COMPLEXITY',
    name: 'Complexity',
    nameVi: 'Độ phức tạp của vấn đề',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    border: 'border-amber-500/30 dark:border-amber-500/20',
    accent: 'text-amber-600 dark:text-amber-400',
    bgLight: 'bg-amber-500/5',
    iconName: 'Cpu',
  },
  BUSINESS_SKILLS: {
    code: 'BUSINESS_SKILLS',
    name: 'Business skills',
    nameVi: 'Kỹ năng kinh doanh & Đạo đức số',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    border: 'border-emerald-500/30 dark:border-emerald-500/20',
    accent: 'text-emerald-600 dark:text-emerald-400',
    bgLight: 'bg-emerald-500/5',
    iconName: 'Briefcase',
  },
  KNOWLEDGE: {
    code: 'KNOWLEDGE',
    name: 'Knowledge',
    nameVi: 'Mức độ tiếp thu & Ứng dụng kiến thức',
    badge: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    border: 'border-cyan-500/30 dark:border-cyan-500/20',
    accent: 'text-cyan-600 dark:text-cyan-400',
    bgLight: 'bg-cyan-500/5',
    iconName: 'BookOpen',
  },
}

export const SFIA_DEFAULT_ATTRIBUTE_THEME: SfiaAttributeTheme = {
  code: 'UNKNOWN',
  name: 'Generic Attribute',
  nameVi: 'Thuộc tính năng lực',
  badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  border: 'border-slate-500/30 dark:border-slate-500/20',
  accent: 'text-slate-600 dark:text-slate-400',
  bgLight: 'bg-slate-500/5',
  iconName: 'Compass',
}

export function getAttributeTheme(attributeCode?: string | null): SfiaAttributeTheme {
  if (!attributeCode) return SFIA_DEFAULT_ATTRIBUTE_THEME
  return SFIA_ATTRIBUTE_THEMES[attributeCode] || SFIA_DEFAULT_ATTRIBUTE_THEME
}

