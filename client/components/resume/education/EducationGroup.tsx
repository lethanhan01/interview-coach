'use client'

import { Badge, Box, Button, Group, Stack, Text, Timeline } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPencil, IconSchool } from '@tabler/icons-react'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import type { EducationEntry } from '@/types'
import { EDUCATION_DEGREE_OPTIONS } from '@/components/resume/constants'
import EducationEditForm from './EducationEditForm'
import type { EducationFormValues } from '@/components/resume/resume-schemas'

export interface EducationGroupProps {
  data: Partial<EducationEntry> | null | undefined
  onSave: (data: EducationEntry) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

const DEGREE_LABEL: Record<string, string> = Object.fromEntries(
  EDUCATION_DEGREE_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label])
)

function toText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

function normalizeEducation(
  data: Partial<EducationEntry> | null | undefined
): EducationFormValues {
  return {
    degree: toText(data?.degree),
    school: toText(data?.school),
    major: toText(data?.major),
    gpa: toText(data?.gpa),
    graduationYear: toText(data?.graduationYear),
  }
}

export default function EducationGroup({
  data,
  onSave,
  onDirtyChange,
}: Readonly<EducationGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const normalized = normalizeEducation(data)
  const hasEducation = Boolean(
    normalized.degree ||
    normalized.school ||
    normalized.major ||
    normalized.gpa ||
    normalized.graduationYear
  )

  return (
    <Box id="education">
      <ProfileSection
        title="Trình độ học vấn"
        action={
          !isEditing ? (
            <Button
              type="button"
              variant="light"
              color="brand"
              size="xs"
              leftSection={
                <IconPencil size={14} stroke={1.5} aria-hidden="true" />
              }
              onClick={() => {
                onDirtyChange?.(false)
                openEdit()
              }}
            >
              Chỉnh sửa
            </Button>
          ) : undefined
        }
      >
        {!isEditing ? (
          hasEducation ? (
            <Timeline active={0} bulletSize={28} lineWidth={2}>
              <Timeline.Item
                bullet={
                  <IconSchool size={14} stroke={1.5} aria-hidden="true" />
                }
                title={normalized.school || 'Thông tin học vấn'}
              >
                <Stack gap={6} mt={4}>
                  {normalized.degree || normalized.major ? (
                    <Text size="sm" c="dimmed">
                      {[
                        normalized.degree
                          ? (DEGREE_LABEL[normalized.degree] ??
                            normalized.degree)
                          : '',
                        normalized.major,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                  <Group gap="xs" wrap="wrap">
                    {normalized.graduationYear ? (
                      <Badge variant="light" color="brand" size="sm">
                        Tốt nghiệp: {normalized.graduationYear}
                      </Badge>
                    ) : null}
                    {normalized.gpa ? (
                      <Badge variant="outline" color="neutral" size="sm">
                        GPA: {normalized.gpa}
                      </Badge>
                    ) : null}
                  </Group>
                </Stack>
              </Timeline.Item>
            </Timeline>
          ) : (
            <ProfileEmptyState message="Chưa cập nhật thông tin học vấn" />
          )
        ) : (
          <EducationEditForm
            initialValues={normalized}
            onSave={onSave}
            onSuccess={closeEdit}
            onCancel={closeEdit}
            onDirtyChange={onDirtyChange}
          />
        )}
      </ProfileSection>
    </Box>
  )
}
