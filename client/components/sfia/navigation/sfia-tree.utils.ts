import type { TreeNodeData } from '@mantine/core'
import type { SfiaCategory, SfiaSkillSummary, SfiaSubcategory } from '@/types'

export function filterSfiaSkills(
  skills: SfiaSkillSummary[],
  searchQuery: string,
  categoryFilter: string | null,
  levelFilter: number | 'all',
  blindSpotsOnly: boolean
): SfiaSkillSummary[] {
  const q = searchQuery.trim().toLowerCase()
  return skills.filter((s) => {
    if (categoryFilter && s.categoryCode !== categoryFilter) return false
    if (levelFilter !== 'all') {
      const lvl = Number(levelFilter)
      if (lvl < s.minLevel || lvl > s.maxLevel) return false
    }
    if (blindSpotsOnly && s.questionCount > 0) return false
    if (!q) return true
    return s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })
}

export function buildSfiaTreeData(
  categories: SfiaCategory[],
  subcategories: SfiaSubcategory[],
  filteredSkills: SfiaSkillSummary[]
): TreeNodeData[] {
  const skillsBySubcategory = new Map<string, SfiaSkillSummary[]>()
  for (const skill of filteredSkills) {
    const list = skillsBySubcategory.get(skill.subcategoryCode) ?? []
    list.push(skill)
    skillsBySubcategory.set(skill.subcategoryCode, list)
  }

  const subcategoriesByCategory = new Map<string, SfiaSubcategory[]>()
  for (const sub of subcategories) {
    if (skillsBySubcategory.has(sub.code)) {
      const list = subcategoriesByCategory.get(sub.categoryCode) ?? []
      list.push(sub)
      subcategoriesByCategory.set(sub.categoryCode, list)
    }
  }

  const result: TreeNodeData[] = []
  for (const cat of categories) {
    const subs = subcategoriesByCategory.get(cat.code)
    if (!subs || subs.length === 0) continue

    const subNodes: TreeNodeData[] = subs.map((sub) => {
      const subSkills = skillsBySubcategory.get(sub.code) ?? []
      const skillNodes: TreeNodeData[] = subSkills.map((sk) => ({
        value: `skill:${sk.code}`,
        label: sk.name,
        nodeProps: {
          type: 'skill',
          code: sk.code,
          skill: sk,
        },
      }))

      return {
        value: `sub:${sub.code}`,
        label: sub.nameVi || sub.name,
        nodeProps: {
          type: 'subcategory',
          code: sub.code,
          count: subSkills.length,
        },
        children: skillNodes,
      }
    })

    const totalSkillsInCat = subs.reduce((sum, sub) => {
      return sum + (skillsBySubcategory.get(sub.code)?.length ?? 0)
    }, 0)

    result.push({
      value: `cat:${cat.code}`,
      label: cat.nameVi || cat.name,
      nodeProps: {
        type: 'category',
        code: cat.code,
        count: totalSkillsInCat,
      },
      children: subNodes,
    })
  }

  return result
}
