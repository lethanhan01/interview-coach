'use client'

import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Text,
  Timeline,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertCircle, IconPencil, IconSchool } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import ProfileEmptyState from '@/components/profile/primitives/ProfileEmptyState'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import { catalogQueries } from '@/queries/catalog.queries'
import type { EducationEntry } from '@/types'
import EducationEditForm from './EducationEditForm'
import type { EducationFormValues } from '@/components/resume/resume-schemas'

export interface EducationGroupProps {
  data: Partial<EducationEntry> | null | undefined
  onSave: (data: EducationEntry) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

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
  const catalogQuery = useQuery(catalogQueries.interviewOptions())

  const degreeOptions = [
    { value: '', label: 'Chọn trình độ' },
    ...(catalogQuery.data?.educationDegrees ?? []),
  ]
  const degreeLabelMap: Record<string, string> = Object.fromEntries(
    degreeOptions.filter((o) => o.value).map((o) => [o.value, o.label])
  )

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
          <Stack gap="sm">
            {catalogQuery.isError ? (
              <Alert
                color="danger"
                variant="light"
                role="alert"
                title="Không thể tải danh mục cấu hình"
                icon={
                  <IconAlertCircle size={16} stroke={1.5} aria-hidden="true" />
                }
              >
                <Group justify="space-between" align="center" gap="xs">
                  <Text size="xs">
                    Đang hiển thị mã gốc do không tải được danh mục trình độ.
                  </Text>
                  <Button
                    type="button"
                    size="compact-xs"
                    variant="light"
                    color="danger"
                    onClick={() => void catalogQuery.refetch()}
                  >
                    Thử lại
                  </Button>
                </Group>
              </Alert>
            ) : null}

            {hasEducation ? (
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
                            ? (degreeLabelMap[normalized.degree] ??
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
            )}
          </Stack>
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
