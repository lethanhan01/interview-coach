import { describe, it, expect } from 'vitest'
import { sfiaAdminService } from '@/services/sfia-admin.service'

describe('sfiaAdminService Phase 4 Mock Store', () => {
  it('loads core skills with enriched onetMappings and questionBankItems', async () => {
    const testSkill = await sfiaAdminService.getSkillDetail('TEST')
    expect(testSkill).toBeDefined()
    expect(testSkill?.code).toBe('TEST')
    expect(testSkill?.onetMappings.length).toBeGreaterThanOrEqual(4)
    expect(testSkill?.questionBankItems.length).toBeGreaterThanOrEqual(5)

    const progSkill = await sfiaAdminService.getSkillDetail('PROG')
    expect(progSkill?.onetMappings.length).toBeGreaterThanOrEqual(5)
    expect(progSkill?.questionBankItems.length).toBeGreaterThanOrEqual(4)
  })

  it('successfully creates a new question and maintains in-memory consistency', async () => {
    const initialDetail = await sfiaAdminService.getSkillDetail('PROG')
    const initialCount = initialDetail?.questionBankItems.length || 0

    const newQuestion = await sfiaAdminService.addMockQuestion('PROG', {
      questionText: 'Test unit question about concurrent processing in Node.js',
      type: 'TECHNICAL',
      difficulty: 'HARD',
      targetSfiaLevel: 4,
    })

    expect(newQuestion.id).toMatch(/^Q-PROG-\d+$/)
    expect(newQuestion.questionText).toBe('Test unit question about concurrent processing in Node.js')

    const updatedDetail = await sfiaAdminService.getSkillDetail('PROG')
    expect(updatedDetail?.questionBankItems.length).toBe(initialCount + 1)
    expect(updatedDetail?.questionBankItems[0].id).toBe(newQuestion.id)

    // Verify skills summary list also updated questionCount
    const allSkills = await sfiaAdminService.getSkills()
    const progSummary = allSkills.find((s) => s.code === 'PROG')
    expect(progSummary?.questionCount).toBe(updatedDetail?.questionCount)
  })
})
