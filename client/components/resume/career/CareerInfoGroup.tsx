'use client'

import { Badge, Box, Button, Group, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPencil } from '@tabler/icons-react'
import ProfileField from '@/components/profile/ProfileField'
import ProfileSection from '@/components/profile/ProfileSection'
import {
  getJdLevelLabel,
  normalizeJdLevel,
  normalizePosition,
} from '@/lib/interview-options'
import { mapJdLevelToSfia } from '@/lib/setup-helpers'
import type { CareerInfoData } from '@/types'
import CareerInfoEditForm from './CareerInfoEditForm'
import type { CareerInfoFormValues } from './resume-schemas'

export type { CareerInfoData }

export interface CareerInfoGroupProps {
  data: CareerInfoData
  onSave: (data: CareerInfoData) => Promise<void>
  onDirtyChange?: (dirty: boolean) => void
}

function normalizeCareerLevel(value?: string): string {
  const normalized = normalizeJdLevel(value)
  return normalized || (value?.trim() ?? '')
}

function toInitialValues(data: CareerInfoData): CareerInfoFormValues {
  const normLevel = normalizeCareerLevel(data.targetLevel)
  return {
    targetPosition: normalizePosition(data.targetPosition),
    targetLevel: normLevel,
    onetSocCode: data.onetSocCode?.trim() || undefined,
    onetOccupationTitle: data.onetOccupationTitle?.trim() || undefined,
    targetSfiaLevel:
      data.targetSfiaLevel ??
      (normLevel ? mapJdLevelToSfia(normLevel) : undefined),
  }
}

export default function CareerInfoGroup({
  data,
  onSave,
  onDirtyChange,
}: Readonly<CareerInfoGroupProps>) {
  const [isEditing, { open: openEdit, close: closeEdit }] = useDisclosure(false)

  const displayPosition = data.targetPosition || data.onetOccupationTitle || ''
  const displayLevel = normalizeCareerLevel(data.targetLevel)
  const displaySfiaLevel =
    data.targetSfiaLevel ??
    (displayLevel ? mapJdLevelToSfia(displayLevel) : undefined)

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
                    <Text size="sm">{getJdLevelLabel(displayLevel)}</Text>
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
        ) : (
          <CareerInfoEditForm
            initialValues={toInitialValues(data)}
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
