'use client'

import {
  Badge,
  Card,
  Divider,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { formatVietnamDateTime } from '@/lib/date-time'
import type { ContextPack, Session, SessionType } from '@/types'
import surfaces from '@/styles/surfaces.module.css'
import typography from '@/styles/typography.module.css'

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  hr: 'Nhân sự',
  technical: 'Kỹ thuật',
}

const CONTEXT_PACK_LABELS: Record<ContextPack, string> = {
  VN: 'Việt Nam',
  Western: 'Quốc tế (Western)',
}

interface ParsedJobDescription {
  companyName?: string
  jobTitle?: string
  level?: string
  headcount?: string
  requirements?: string
  jobContent?: string
  techStack: string[]
}

const SECTION_LABELS = [
  'Yêu cầu:',
  'Nội dung công việc:',
  'Tech Stack:',
  'Quyền lợi:',
  'Lương:',
  'Thưởng:',
  'Phong cách phỏng vấn:',
]

function trimBlock(lines: string[]): string | undefined {
  const copy = [...lines]
  while (copy.length > 0 && copy[0].trim() === '') copy.shift()
  while (copy.length > 0 && copy[copy.length - 1].trim() === '') copy.pop()
  const value = copy.join('\n').trim()
  return value || undefined
}

function parseJobDescription(jobDescription?: string): ParsedJobDescription {
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

export interface SessionMetadataCardProps {
  session: Session
  className?: string
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {value}
      </Text>
    </Stack>
  )
}

export function SessionMetadataCard({
  session,
  className,
}: Readonly<SessionMetadataCardProps>) {
  const parsedJd = parseJobDescription(session.jobDescription)
  const sessionTypeLabel = session.sessionType
    ? SESSION_TYPE_LABELS[session.sessionType] || session.sessionType
    : '—'
  const contextPackLabel = session.contextPackId
    ? CONTEXT_PACK_LABELS[session.contextPackId] || session.contextPackId
    : '—'

  return (
    <Card withBorder radius="md" p="lg" className={className}>
      <Stack gap="md">
        <Title order={2} size="h4">
          Thông tin phiên phỏng vấn
        </Title>

        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          <MetaItem label="Vị trí ứng tuyển" value={session.jobTitle || '—'} />
          <MetaItem label="Loại phỏng vấn" value={sessionTypeLabel} />
          <MetaItem label="Bối cảnh" value={contextPackLabel} />
          <MetaItem
            label="Số câu hỏi"
            value={`${session.numQuestions || '—'} câu`}
          />
          <MetaItem
            label="Thời lượng"
            value={`${session.durationMin || '—'} phút`}
          />
          <MetaItem
            label="Thời gian hoàn tất"
            value={formatVietnamDateTime(
              session.completedAt || session.createdAt
            )}
          />
        </SimpleGrid>

        {session.jobDescription ? (
          <>
            <Divider my="xs" />

            <Title order={3} size="h5">
              Mô tả công việc (JD)
            </Title>

            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              <MetaItem label="Công ty" value={parsedJd.companyName || '—'} />
              <MetaItem label="Level yêu cầu" value={parsedJd.level || '—'} />
              <MetaItem
                label="Chỉ tiêu tuyển"
                value={parsedJd.headcount || '—'}
              />
              <MetaItem
                label="Vị trí JD"
                value={parsedJd.jobTitle || session.jobTitle || '—'}
              />
            </SimpleGrid>

            {parsedJd.techStack.length > 0 ? (
              <Stack gap={4}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  Tech Stack yêu cầu
                </Text>
                <Group gap="xs" wrap="wrap">
                  {parsedJd.techStack.map((tech) => (
                    <Badge key={tech} variant="light" color="neutral" size="sm">
                      {tech}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            ) : null}

            {parsedJd.requirements ? (
              <Stack gap={4}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  Yêu cầu công việc
                </Text>
                <Paper
                  withBorder
                  radius="sm"
                  p="sm"
                  className={`${surfaces.subtleSurface} ${typography.preLine}`}
                >
                  <Text size="sm">{parsedJd.requirements}</Text>
                </Paper>
              </Stack>
            ) : null}

            {parsedJd.jobContent ? (
              <Stack gap={4}>
                <Text size="xs" fw={600} tt="uppercase" c="dimmed">
                  Nội dung công việc
                </Text>
                <Paper
                  withBorder
                  radius="sm"
                  p="sm"
                  className={`${surfaces.subtleSurface} ${typography.preLine}`}
                >
                  <Text size="sm">{parsedJd.jobContent}</Text>
                </Paper>
              </Stack>
            ) : null}
          </>
        ) : null}
      </Stack>
    </Card>
  )
}

export default SessionMetadataCard
