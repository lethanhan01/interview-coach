'use client'

import {
  Badge,
  Card,
  Divider,
  Group,
  NavLink,
  RingProgress,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import {
  IconAward,
  IconBriefcase,
  IconCircleCheck,
  IconCircleDashed,
  IconFolderCode,
  IconSchool,
  IconTarget,
  IconTool,
  IconUserCheck,
} from '@tabler/icons-react'
import type { GetProfileResponse } from '@/types'
import { isSectionCompleted, type ResumeSectionId } from './resume-schemas'
import classes from './ResumeHeader.module.css'

export interface ResumeHeaderProps {
  data: GetProfileResponse | null
  activeSection?: ResumeSectionId
  onSelectSection?: (section: ResumeSectionId) => void
  compact?: boolean
}

export const RESUME_SECTION_ITEMS: {
  id: ResumeSectionId
  label: string
  icon: typeof IconTarget
}[] = [
  { id: 'career', label: 'Định hướng', icon: IconTarget },
  { id: 'personality', label: 'Tính cách', icon: IconUserCheck },
  { id: 'education', label: 'Học vấn', icon: IconSchool },
  { id: 'skills', label: 'Kỹ năng', icon: IconTool },
  { id: 'experience', label: 'Kinh nghiệm', icon: IconBriefcase },
  { id: 'projects', label: 'Dự án', icon: IconFolderCode },
  { id: 'certifications', label: 'Chứng chỉ & Giải thưởng', icon: IconAward },
]

export function calculateCompleteness(data: GetProfileResponse | null): number {
  if (!data?.profile) return 0
  const profile = data.profile
  let score = 0

  if (profile.personality?.trim()) score += 15
  if (
    profile.education &&
    (profile.education.school || profile.education.major)
  )
    score += 15
  if (
    Array.isArray(profile.technicalSkills) &&
    profile.technicalSkills.length > 0
  )
    score += 20
  if (
    Array.isArray(profile.workExperience) &&
    profile.workExperience.length > 0
  )
    score += 25
  if (Array.isArray(profile.projects) && profile.projects.length > 0)
    score += 15
  if (
    (Array.isArray(profile.certifications) &&
      profile.certifications.length > 0) ||
    (Array.isArray(profile.awards) && profile.awards.length > 0)
  )
    score += 10

  return Math.min(100, score)
}

function getCompletenessMeta(completeness: number) {
  if (completeness >= 80) {
    return {
      color: 'success' as const,
      label: `Hồ sơ hoàn hảo (${completeness}%)`,
    }
  }
  if (completeness >= 50) {
    return {
      color: 'brand' as const,
      label: `Đang hoàn thiện (${completeness}%)`,
    }
  }
  return {
    color: 'warning' as const,
    label: `Cần bổ sung thêm (${completeness}%)`,
  }
}

export default function ResumeHeader({
  data,
  activeSection = 'career',
  onSelectSection,
  compact = false,
}: Readonly<ResumeHeaderProps>) {
  const completeness = calculateCompleteness(data)
  const meta = getCompletenessMeta(completeness)

  function handleSelect(sectionId: ResumeSectionId) {
    if (onSelectSection) {
      onSelectSection(sectionId)
      return
    }
    const element = document.getElementById(sectionId)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <Card withBorder radius="md" p={compact ? 'md' : 'lg'}>
      <Stack gap="md">
        <Group gap="md" wrap="nowrap" align="center">
          <RingProgress
            size={compact ? 70 : 88}
            thickness={compact ? 7 : 8}
            roundCaps
            sections={[{ value: completeness, color: meta.color }]}
            label={
              <Text ta="center" fw={700} fz={compact ? 'xs' : 'sm'}>
                {completeness}%
              </Text>
            }
          />
          <Stack gap={4} flex={1} miw={0}>
            <Title order={2} size="h5">
              Độ hoàn thiện hồ sơ CV
            </Title>
            <Badge color={meta.color} variant="light" size="sm" w="fit-content">
              {meta.label}
            </Badge>
            <Text size="xs" c="dimmed">
              Hồ sơ càng chi tiết, AI càng cá nhân hóa câu hỏi và đánh giá chính
              xác.
            </Text>
          </Stack>
        </Group>

        {!compact ? (
          <>
            <Divider />
            <Stack gap={4} component="nav" aria-label="Danh mục hồ sơ CV">
              {RESUME_SECTION_ITEMS.map(({ id, label, icon: Icon }) => {
                const completed = isSectionCompleted(id, data?.profile)
                return (
                  <NavLink
                    key={id}
                    component="button"
                    type="button"
                    label={label}
                    active={activeSection === id}
                    color="brand"
                    className={classes.navLink}
                    onClick={() => handleSelect(id)}
                    leftSection={
                      <Icon size={16} stroke={1.5} aria-hidden="true" />
                    }
                    rightSection={
                      completed ? (
                        <IconCircleCheck
                          size={16}
                          stroke={1.5}
                          aria-label="Đã hoàn thiện"
                          className={classes.statusDone}
                        />
                      ) : (
                        <IconCircleDashed
                          size={16}
                          stroke={1.5}
                          aria-label="Chưa hoàn thiện"
                          className={classes.statusTodo}
                        />
                      )
                    }
                  />
                )
              })}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Card>
  )
}
