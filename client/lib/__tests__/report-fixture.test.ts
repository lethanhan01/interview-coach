import { describe, expect, it } from 'vitest'
import {
  mockLegacyReport,
  mockSkippedTurnsReport,
  mockUnifiedReport,
} from '@/tests/fixtures/report.fixture'
import { mapJdLevelToSfia } from '@/lib/setup-types'

describe('Report Fixtures & Setup Helpers (Phase 1)', () => {
  describe('mockUnifiedReport', () => {
    it('has valid report quality and recommendation status', () => {
      expect(mockUnifiedReport.reportQuality).toBe('full')
      expect(mockUnifiedReport.recommendationStatus).toBe('recommended')
      expect(mockUnifiedReport.overallScore).toBe(85)
    })

    it('contains comprehensive skillsBreakdown with SFIA and O*NET context', () => {
      expect(mockUnifiedReport.skillsBreakdown).toHaveLength(2)
      const prog = mockUnifiedReport.skillsBreakdown?.[0]
      expect(prog?.skillCode).toBe('PROG')
      expect(prog?.targetLevel).toBe(4)
      expect(prog?.demonstratedLevel).toBe(4)
      expect(prog?.status).toBe('passed')
      expect(prog?.techContext).toContain('TypeScript')

      const dbds = mockUnifiedReport.skillsBreakdown?.[1]
      expect(dbds?.skillCode).toBe('DBDS')
      expect(dbds?.targetLevel).toBe(4)
      expect(dbds?.demonstratedLevel).toBe(3)
      expect(dbds?.status).toBe('gap')
    })

    it('contains binary criteria evaluations on transcript turns', () => {
      expect(mockUnifiedReport.transcript).toHaveLength(2)
      const turn1 = mockUnifiedReport.transcript[0]
      expect(turn1.criteriaEvaluations).toHaveLength(2)
      expect(turn1.criteriaEvaluations?.[0].dimension).toBe('core')
      expect(turn1.criteriaEvaluations?.[0].passed).toBe(true)
      expect(turn1.criteriaEvaluations?.[1].dimension).toBe('seniority')
      expect(turn1.criteriaEvaluations?.[1].passed).toBe(false)
      expect(turn1.demonstratedLevel).toBe(3)
    })

    it('contains structured action plan with priority and topics', () => {
      const actionPlan = mockUnifiedReport.actionPlan as {
        actionPlan: Array<{ priority: string; skillCode: string; topics: string[] }>
      }
      expect(actionPlan.actionPlan).toHaveLength(2)
      expect(actionPlan.actionPlan[0].priority).toBe('high')
      expect(actionPlan.actionPlan[0].skillCode).toBe('DBDS')
    })
  })

  describe('mockLegacyReport', () => {
    it('maintains compatibility without skillsBreakdown', () => {
      expect(mockLegacyReport.skillsBreakdown).toBeUndefined()
      expect(mockLegacyReport.competencyHeatmap).toHaveProperty('D1')
      expect(mockLegacyReport.transcript[0].appliedDimensions).toBeDefined()
    })
  })

  describe('mockSkippedTurnsReport', () => {
    it('handles skipped question turns with 0 score and level 1', () => {
      const skippedTurn = mockSkippedTurnsReport.transcript[1]
      expect(skippedTurn.skipped).toBe(true)
      expect(skippedTurn.overallScore).toBe(0)
      expect(skippedTurn.demonstratedLevel).toBe(1)
      expect(skippedTurn.modelAnswer).toBeTruthy()
    })
  })

  describe('mapJdLevelToSfia helper', () => {
    it('correctly maps various levels to SFIA levels', () => {
      expect(mapJdLevelToSfia('Intern')).toBe(1)
      expect(mapJdLevelToSfia('fresher')).toBe(1)
      expect(mapJdLevelToSfia('Junior')).toBe(2)
      expect(mapJdLevelToSfia('Middle')).toBe(3)
      expect(mapJdLevelToSfia('mid')).toBe(3)
      expect(mapJdLevelToSfia('Senior')).toBe(4)
      expect(mapJdLevelToSfia('Tech Lead')).toBe(5)
      expect(mapJdLevelToSfia('Principal')).toBe(5)
      expect(mapJdLevelToSfia('Architect')).toBe(5)
      expect(mapJdLevelToSfia('unknown')).toBe(3)
    })
  })
})
