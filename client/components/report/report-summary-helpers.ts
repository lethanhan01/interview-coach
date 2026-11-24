import { ApiClientError } from '@/lib/api-client'
import type { ActionPlanItem, RecommendationStatus, Report } from '@/types'

export const REPORT_POLL_INTERVAL_MS = 5000
export const GOOD_ANSWER_THRESHOLD = 70
export const WEAK_ANSWER_THRESHOLD = 40

export interface SummaryAnswerItem {
  label: string
  score?: number
  takeaway?: string
}

export interface OverviewSummary {
  overview: string
  goodAnswers: SummaryAnswerItem[]
  weakAnswers: SummaryAnswerItem[]
  improvementDirections: string[]
}

export function isReportNotReadyError(err: unknown): boolean {
  if (
    err instanceof ApiClientError &&
    err.errorCode?.toUpperCase() === 'REPORT_NOT_READY'
  ) {
    return true
  }
  return err instanceof Error && err.message.includes('REPORT_NOT_READY')
}

export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim() !== ''
  )
}

export function extractActionPlanDirections(
  actionPlan: Report['actionPlan']
): string[] {
  if (!actionPlan) return []

  let structuredItems: ActionPlanItem[] = []
  if (Array.isArray(actionPlan)) {
    if (actionPlan.length > 0 && typeof actionPlan[0] === 'object') {
      structuredItems = actionPlan as ActionPlanItem[]
    }
  } else if (
    typeof actionPlan === 'object' &&
    actionPlan !== null &&
    'actionPlan' in actionPlan &&
    Array.isArray((actionPlan as { actionPlan?: ActionPlanItem[] }).actionPlan)
  ) {
    structuredItems = (actionPlan as { actionPlan: ActionPlanItem[] })
      .actionPlan
  }

  if (structuredItems.length > 0) {
    const priorityWeight: Record<string, number> = {
      high: 3,
      medium: 2,
      low: 1,
    }
    const sorted = [...structuredItems].sort(
      (a, b) =>
        (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0)
    )
    const directions: string[] = []
    for (const item of sorted) {
      if (item.title) {
        if (item.topics && item.topics.length > 0) {
          directions.push(
            `${item.title} (${item.topics.slice(0, 2).join(', ')})`
          )
        } else {
          directions.push(item.title)
        }
      }
      if (directions.length >= 3) break
    }
    if (directions.length > 0) return directions
  }

  let rawItems: unknown = []
  if (Array.isArray(actionPlan)) {
    rawItems = actionPlan
  } else if (
    typeof actionPlan === 'object' &&
    actionPlan !== null &&
    'items' in actionPlan
  ) {
    rawItems = (actionPlan as { items?: unknown }).items
  }
  return toStringList(rawItems)
}

export function buildOverviewSummary(report: Report): OverviewSummary {
  const overview =
    typeof report.executiveSummary?.summary === 'string' &&
    report.executiveSummary.summary.trim() !== ''
      ? report.executiveSummary.summary
      : 'Báo cáo đã được tổng hợp từ các câu trả lời có đủ dữ liệu chấm điểm.'

  const scoredAnswers = (report.transcript ?? []).flatMap((item) => {
    if (item.isFallback || item.overallScore == null) {
      return []
    }
    return [
      {
        label: `Câu ${item.orderIndex}`,
        score: item.overallScore,
        takeaway: item.keyTakeaway?.trim() || undefined,
      },
    ]
  })

  const goodAnswers = scoredAnswers.filter(
    (item) => item.score >= GOOD_ANSWER_THRESHOLD
  )
  const weakAnswers = scoredAnswers.filter(
    (item) => item.score < WEAK_ANSWER_THRESHOLD
  )
  const actionPlanDirections = extractActionPlanDirections(report.actionPlan)
  const improvementDirections =
    actionPlanDirections.length > 0
      ? actionPlanDirections
      : Array.from(
          new Set(
            weakAnswers.flatMap((item) =>
              item.takeaway ? [item.takeaway] : []
            )
          )
        ).slice(0, 3)

  return {
    overview,
    goodAnswers,
    weakAnswers,
    improvementDirections,
  }
}

export function getReportRecommendationStatus(
  report: Report
): RecommendationStatus | undefined {
  return (
    report.recommendationStatus ?? report.executiveSummary?.recommendationStatus
  )
}
