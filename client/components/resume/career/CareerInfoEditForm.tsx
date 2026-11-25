'use client'

import { useState } from 'react'
import { Alert, Box, Button, Group, Stack } from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconAlertCircle } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import OnetOccupationPicker from '@/components/onet/OnetOccupationPicker'
import { getErrorMessage } from '@/lib/form-errors'
import { mapJdLevelToSfia } from '@/lib/interview-option-helpers'
import { catalogQueries } from '@/queries/catalog.queries'
import type { CareerInfoData, OnetOccupation } from '@/types'
import {
  careerInfoSchema,
  type CareerInfoFormValues,
} from '@/components/resume/resume-schemas'
import CareerLevelField from './CareerLevelField'
import CareerPositionField from './CareerPositionField'

export interface CareerInfoEditFormProps {
  initialValues: CareerInfoFormValues
  onSave: (data: CareerInfoData) => Promise<void>
  onSuccess: () => void
  onCancel: () => void
  onDirtyChange?: (dirty: boolean) => void
}

export default function CareerInfoEditForm({
  initialValues,
  onSave,
  onSuccess,
  onCancel,
  onDirtyChange,
}: Readonly<CareerInfoEditFormProps>) {
  const catalogQuery = useQuery(catalogQueries.interviewOptions())
  const jdLevels = catalogQuery.data?.jdLevels ?? []

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [onetView, setOnetView] = useState({
    socCode: initialValues.onetSocCode,
    title: initialValues.onetOccupationTitle,
    targetPosition: initialValues.targetPosition,
    targetLevel: initialValues.targetLevel,
  })

  const form = useForm<CareerInfoFormValues>({
    mode: 'uncontrolled',
    initialValues,
    validate: schemaResolver(careerInfoSchema, { sync: true }),
    onValuesChange: (values) => {
      onDirtyChange?.(true)
      setOnetView({
        socCode: values.onetSocCode,
        title: values.onetOccupationTitle,
        targetPosition: values.targetPosition,
        targetLevel: values.targetLevel,
      })
    },
  })

  function handleSelectOnet(occ: OnetOccupation) {
    const current = form.getValues()
    form.setValues({
      ...current,
      onetSocCode: occ.socCode,
      onetOccupationTitle: occ.title,
      targetPosition: current.targetPosition || occ.title,
    })
  }

  function handleClearOnet() {
    const current = form.getValues()
    form.setValues({
      ...current,
      onetSocCode: undefined,
      onetOccupationTitle: undefined,
    })
  }

  function handleLevelChange(val: string | null) {
    const nextLevel = val ?? ''
    const current = form.getValues()
    form.setValues({
      ...current,
      targetLevel: nextLevel,
      targetSfiaLevel: nextLevel
        ? mapJdLevelToSfia(nextLevel, jdLevels)
        : undefined,
    })
  }

  async function handleSubmit(values: CareerInfoFormValues) {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        targetPosition: values.targetPosition.trim(),
        targetLevel: values.targetLevel.trim(),
        onetSocCode: values.onetSocCode?.trim() || undefined,
        onetOccupationTitle: values.onetOccupationTitle?.trim() || undefined,
        targetSfiaLevel:
          values.targetSfiaLevel ??
          (values.targetLevel
            ? mapJdLevelToSfia(values.targetLevel, jdLevels)
            : undefined),
      })
      onDirtyChange?.(false)
      notifications.show({
        title: 'Đã cập nhật',
        message: 'Định hướng nghề nghiệp đã được lưu.',
        color: 'success',
        closeButtonProps: { 'aria-label': 'Đóng thông báo' },
      })
      onSuccess()
    } catch (err) {
      setError(getErrorMessage(err, 'Lưu thất bại'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box component="form" onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="md">
        {error ? (
          <Alert
            color="danger"
            variant="light"
            role="alert"
            icon={<IconAlertCircle size={18} stroke={1.5} aria-hidden="true" />}
          >
            {error}
          </Alert>
        ) : null}

        <OnetOccupationPicker
          inputId="career-onet-occupation"
          label="Chức danh chuẩn O*NET (Taxonomy)"
          helperText="Chuẩn hóa câu hỏi & kỹ năng"
          codePrefix="Mã O*NET SOC"
          clearLabel="Đổi"
          socCode={onetView.socCode}
          occupationTitle={onetView.title}
          disabled={saving}
          onSelect={handleSelectOnet}
          onClear={handleClearOnet}
        />

        <CareerPositionField
          value={onetView.targetPosition}
          error={form.errors.targetPosition}
          disabled={saving}
          onChange={(val) => form.setFieldValue('targetPosition', val)}
        />

        <CareerLevelField
          value={onetView.targetLevel}
          error={form.errors.targetLevel}
          jdLevels={jdLevels}
          isPending={catalogQuery.isPending}
          isError={catalogQuery.isError}
          disabled={saving}
          onRetry={() => void catalogQuery.refetch()}
          onChange={handleLevelChange}
        />

        <Group gap="xs">
          <Button
            type="submit"
            color="brand"
            loading={saving}
            disabled={saving}
          >
            Lưu thay đổi
          </Button>
          <Button
            type="button"
            variant="subtle"
            color="neutral"
            onClick={() => {
              onDirtyChange?.(false)
              onCancel()
            }}
            disabled={saving}
          >
            Hủy
          </Button>
        </Group>
      </Stack>
    </Box>
  )
}
