import { normalizeJdFormData } from '@/components/interview-setup/jd-step/jd-form.schema'
import {
  getJdLevelLabel,
  mapJdLevelToSfia,
  normalizeJdLevel,
} from '@/lib/interview-option-helpers'
import type {
  ContextPack,
  JdFormData,
  JdLevelOption,
  OutputLanguage,
  SaveJobDescriptionPayload,
  SavedJobDescription,
  Session,
} from '@/types'

function optionalText(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function extractSerializedJdLevel(
  jobDescription: string,
  jdLevels: readonly JdLevelOption[]
): string {
  const match = jobDescription.match(/^Level yêu cầu:\s*(.+)$/im)
  return normalizeJdLevel(match?.[1], jdLevels)
}

export function serializeJd(
  form: JdFormData,
  jdLevels: readonly JdLevelOption[]
): string {
  const lines: string[] = [
    `Tên công ty: ${form.company}`,
    form.website ? `Website: ${form.website}` : '',
    `Vị trí tuyển dụng: ${form.position}`,
    `Level yêu cầu: ${getJdLevelLabel(form.level, jdLevels)}`,
    form.headcount ? `Số lượng tuyển: ${form.headcount}` : '',
    form.location ? `Địa điểm làm việc: ${form.location}` : '',
    '',
    'Yêu cầu:',
    form.requirements,
    '',
    'Nội dung công việc:',
    form.jobContent,
    form.techStack.length > 0
      ? `\nTech Stack: ${form.techStack.join(', ')}`
      : '',
    form.benefits ? `\nQuyền lợi:\n${form.benefits}` : '',
    form.salary ? `\nLương: ${form.salary}` : '',
    form.bonus ? `\nThưởng: ${form.bonus}` : '',
  ]
  return lines.filter(Boolean).join('\n')
}

export function toSavedJobDescriptionPayload(
  form: JdFormData,
  jdLevels: readonly JdLevelOption[]
): SaveJobDescriptionPayload {
  return {
    companyName: form.company.trim(),
    companyWebsite: optionalText(form.website),
    jobTitle: form.position.trim(),
    level: form.level.trim(),
    headcount: optionalText(form.headcount),
    location: optionalText(form.location),
    requirements: form.requirements.trim(),
    jobContent: form.jobContent.trim(),
    techStack: form.techStack,
    benefits: optionalText(form.benefits),
    salary: optionalText(form.salary),
    bonus: optionalText(form.bonus),
    onetSocCode: optionalText(form.onetSocCode ?? ''),
    onetOccupationTitle: optionalText(form.onetOccupationTitle ?? ''),
    targetSfiaLevel:
      form.targetSfiaLevel ?? mapJdLevelToSfia(form.level, jdLevels),
  }
}

export function hasJdContent(jd: JdFormData): boolean {
  return (
    jd.company.trim().length > 0 ||
    jd.position.trim().length > 0 ||
    jd.level.trim().length > 0 ||
    jd.requirements.trim().length > 0 ||
    jd.jobContent.trim().length > 0
  )
}

export function buildCreateSessionPayload(params: {
  jd: JdFormData
  sessionType: Session['sessionType']
  contextPack: ContextPack
  numQuestions: number
  savedJobDescriptionId: string
  jdLevels: readonly JdLevelOption[]
}) {
  const {
    jd,
    sessionType,
    contextPack,
    numQuestions,
    savedJobDescriptionId,
    jdLevels,
  } = params
  return {
    jobDescription: serializeJd(jd, jdLevels),
    sessionType,
    contextPack,
    language: resolveSessionLanguage(contextPack),
    numQuestions,
    targetRoles: [jd.position],
    savedJobDescriptionId,
    targetSfiaLevel: jd.targetSfiaLevel ?? mapJdLevelToSfia(jd.level, jdLevels),
    onetSocCode: jd.onetSocCode,
  }
}

export function resolveSessionLanguage(
  contextPack: ContextPack
): OutputLanguage {
  return contextPack === 'Western' ? 'en' : 'vi'
}

export function resolveSavedJobDescriptionLevel(
  item: SavedJobDescription,
  jdLevels: readonly JdLevelOption[],
  sessions: Session[] = []
): string {
  const savedLevel = normalizeJdLevel(item.level, jdLevels)
  if (savedLevel) return savedLevel

  return (
    sessions
      .filter((session) => session.savedJobDescriptionId === item.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((session) =>
        extractSerializedJdLevel(session.jobDescription, jdLevels)
      )
      .find(Boolean) ?? ''
  )
}

export function hydrateSavedJobDescriptionLevels(
  items: SavedJobDescription[],
  sessions: Session[],
  jdLevels: readonly JdLevelOption[]
): SavedJobDescription[] {
  return items.map((item) => {
    const level = resolveSavedJobDescriptionLevel(item, jdLevels, sessions)
    return level && level !== item.level ? { ...item, level } : item
  })
}

export function savedJobDescriptionToForm(
  item: SavedJobDescription,
  jdLevels: readonly JdLevelOption[],
  sessions: Session[] = []
): JdFormData {
  const resolvedLevel = resolveSavedJobDescriptionLevel(
    item,
    jdLevels,
    sessions
  )
  return normalizeJdFormData({
    company: item.companyName,
    website: item.companyWebsite ?? undefined,
    position: item.jobTitle,
    level: resolvedLevel,
    headcount: item.headcount ?? undefined,
    location: item.location ?? undefined,
    requirements: item.requirements,
    jobContent: item.jobContent,
    techStack: item.techStack,
    benefits: item.benefits ?? undefined,
    salary: item.salary ?? undefined,
    bonus: item.bonus ?? undefined,
    onetSocCode: item.onetSocCode ?? undefined,
    onetOccupationTitle: item.onetOccupationTitle ?? undefined,
    targetSfiaLevel:
      item.targetSfiaLevel ??
      (resolvedLevel ? mapJdLevelToSfia(resolvedLevel, jdLevels) : undefined),
  })
}
