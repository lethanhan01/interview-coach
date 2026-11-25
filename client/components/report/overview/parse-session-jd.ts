export interface ParsedJobDescription {
  companyName?: string
  jobTitle?: string
  level?: string
  headcount?: string
  requirements?: string
  jobContent?: string
  techStack: string[]
}

export const SECTION_LABELS = [
  'Yêu cầu:',
  'Nội dung công việc:',
  'Tech Stack:',
  'Quyền lợi:',
  'Lương:',
  'Thưởng:',
  'Phong cách phỏng vấn:',
] as const

export function trimBlock(lines: string[]): string | undefined {
  const copy = [...lines]
  while (copy.length > 0 && copy[0].trim() === '') copy.shift()
  while (copy.length > 0 && copy[copy.length - 1].trim() === '') copy.pop()
  const value = copy.join('\n').trim()
  return value || undefined
}

export function parseJobDescription(
  jobDescription?: string
): ParsedJobDescription {
  if (!jobDescription) {
    return { techStack: [] }
  }
  const lines = jobDescription.split(/\r?\n/)

  const getInlineValue = (label: string) => {
    const target = `${label.toLowerCase()}:`
    const line = lines.find((item) =>
      item.trim().toLowerCase().startsWith(target)
    )
    return line?.slice(line.indexOf(':') + 1).trim() || undefined
  }

  const getSectionValue = (label: string) => {
    const target = `${label.toLowerCase()}:`
    const startIndex = lines.findIndex(
      (item) => item.trim().toLowerCase() === target
    )
    if (startIndex === -1) return undefined

    const content: string[] = []
    for (let i = startIndex + 1; i < lines.length; i += 1) {
      const current = lines[i].trim().toLowerCase()
      if (SECTION_LABELS.some((s) => s.toLowerCase() === current)) break
      content.push(lines[i])
    }

    return trimBlock(content)
  }

  const techStackValue = getInlineValue('Tech Stack')

  return {
    companyName: getInlineValue('Tên công ty'),
    jobTitle: getInlineValue('Vị trí tuyển dụng'),
    level: getInlineValue('Level yêu cầu'),
    headcount: getInlineValue('Số lượng tuyển'),
    requirements: getSectionValue('Yêu cầu'),
    jobContent: getSectionValue('Nội dung công việc'),
    techStack: techStackValue
      ? techStackValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  }
}
