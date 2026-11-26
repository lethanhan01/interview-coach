'use client'

import { Alert, Badge, Box, Button, Group, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconAlertCircle, IconPencil } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import ProfileField from '@/components/profile/primitives/ProfileField'
import ProfileSection from '@/components/profile/primitives/ProfileSection'
import {
  getJdLevelLabel,
  mapJdLevelToSfia,
  normalizeJdLevel,
} from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import type { CareerInfoData, JdLevelOption } from '@/types'
import CareerInfoEditForm from './CareerInfoEditForm'
import type { CareerInfoFormValues } from '@/components/resume/resume-schemas'

export type { CareerInfoData }

export interface CareerInfoGroupProps {
  data: CareerInfoData
  onSave: (data: CareerInfoData) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

function normalizeCareerLevel(
  value: string | undefined,
  jdLevels: readonly JdLevelOption[]
): string {
  const normalized = normalizeJdLevel(value, jdLevels)
  return normalized || (value?.trim() ?? '')
}

function toInitialValues(
  data: CareerInfoData,
  jdLevels: readonly JdLevelOption[]
): CareerInfoFormValues {
  const normLevel = normalizeCareerLevel(data.targetLevel, jdLevels)
  return {
    targetPosition: data.targetPosition?.trim() ?? '',
    targetLevel: normLevel,
    onetSocCode: data.onetSocCode?.trim() || undefined,
    onetOccupationTitle: data.onetOccupationTitle?.trim() || undefined,
    targetSfiaLevel:
      data.targetSfiaLevel ??
      (normLevel ? mapJdLevelToSfia(normLevel, jdLevels) : undefined),
  }
}

export default function CareerInfoGroup({
  data,
  onSave,
  onDirtyChange,
}: Readonly<CareerInfoGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const jdLevels = catalogQuery.data?.jdLevels ?? []

  const displayPosition =
    data.targetPosition?.trim() || data.onetOccupationTitle?.trim() || ''
  const displayLevel = normalizeCareerLevel(data.targetLevel, jdLevels)
  const displaySfiaLevel =
    data.targetSfiaLevel ??
    (displayLevel ? mapJdLevelToSfia(displayLevel, jdLevels) : undefined)

  return (
    <Box id="career">
      <ProfileSection
        title="Định hướng nghề nghiệp"
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
                    Đang hiển thị mã gốc do không tải được danh mục cấp độ.
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

            <Stack component="dl" gap="sm" m={0}>
              <ProfileField
                label="Vị trí mục tiêu"
                value={
                  displayPosition ? (
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm" fw={500}>
                        {displayPosition}
                      </Text>
                      {data.onetSocCode ? (
                        <Badge variant="light" color="brand" size="sm">
                          SOC: {data.onetSocCode}
                        </Badge>
                      ) : null}
                    </Group>
                  ) : undefined
                }
              />
              <ProfileField
                label="Mức kinh nghiệm"
                value={
                  displayLevel ? (
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm">
                        {getJdLevelLabel(displayLevel, jdLevels)}
                      </Text>
                      {displaySfiaLevel ? (
                        <Badge variant="outline" color="neutral" size="sm">
                          SFIA Level {displaySfiaLevel}
                        </Badge>
                      ) : null}
                    </Group>
                  ) : undefined
                }
              />
            </Stack>
          </Stack>
        ) : (
          <CareerInfoEditForm
            initialValues={toInitialValues(data, jdLevels)}
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
